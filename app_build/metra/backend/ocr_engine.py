"""
OCR extraction layer.

Two engines behind one function, `extract_text_blocks(image_bytes)`:
  - "paddleocr": real inference using the benchmarked config from
    Technical_Specification.md.
  - "mock": regex/fixture-based stand-in for local dev without the
    heavy paddlepaddle/paddleocr install.

Applies the EXIF-orientation fix from the lessons doc unconditionally
(cheap, and silently wrong bounding boxes otherwise) even in mock mode,
so switching engines never changes this behavior.
"""
import io
import os
import threading
from typing import List, TypedDict

from PIL import Image, ImageOps

from config import settings


class OCRBlock(TypedDict):
    text: str
    confidence: float
    bounding_box: List[float]  # [x1,y1,x2,y2,x3,y3,x4,y4] polygon
    block_index: int


def _normalize_image(image_bytes: bytes) -> Image.Image:
    """EXIF-transpose + downscale to the benchmarked max long edge."""
    pil_img = ImageOps.exif_transpose(Image.open(io.BytesIO(image_bytes)))
    pil_img = pil_img.convert("RGB")

    long_edge = max(pil_img.size)
    if long_edge > settings.OCR_MAX_IMAGE_LONG_EDGE:
        scale = settings.OCR_MAX_IMAGE_LONG_EDGE / long_edge
        new_size = (int(pil_img.width * scale), int(pil_img.height * scale))
        pil_img = pil_img.resize(new_size, Image.LANCZOS)

    return pil_img


# --- PaddleOCR backend ---------------------------------------------------

_paddle_lock = threading.Lock()
_paddle_instance = None


def _get_paddle():
    global _paddle_instance
    if _paddle_instance is None:
        with _paddle_lock:
            if _paddle_instance is None:
                from paddleocr import PaddleOCR
                # Benchmarked config from Technical_Specification.md:
                # ~1.4-2.6s inference vs 6.8-11.2s naive, same accuracy
                # on upright labels. Do not change without re-benchmarking.
                _paddle_instance = PaddleOCR(
                    lang="en",
                    use_angle_cls=False,
                    enable_mkldnn=True,
                    det_limit_side_len=settings.OCR_DET_LIMIT_SIDE_LEN,
                    det_db_score_mode="fast",
                    show_log=False,
                )
    return _paddle_instance


def _extract_paddleocr(image_bytes: bytes) -> List[OCRBlock]:
    import numpy as np
    import cv2

    pil_img = _normalize_image(image_bytes)
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    ocr = _get_paddle()
    result = ocr.ocr(img, cls=False)

    blocks: List[OCRBlock] = []
    if result and result[0]:
        for idx, line in enumerate(result[0]):
            polygon, (text, confidence) = line
            flat_box = [coord for point in polygon for coord in point]
            blocks.append(OCRBlock(text=text, confidence=float(confidence),
                                    bounding_box=flat_box, block_index=idx))
    return blocks


# --- Mock backend (dev/test only) ----------------------------------------

_DEMO_BLOCKS = [
    "Wholesome Foods Pvt. Ltd., Plot 12, MIDC, Pune, Maharashtra 411019",
    "Refined Sunflower Oil",
    "Net Qty: 1 L",
    "MRP Rs. 189.00 incl. of all taxes",
    "Mfg: 07/2026",
    "Customer Care: care@wholesomefoods.example, 1800-000-1234",
]


def _extract_mock(image_bytes: bytes, fixture_hint: str = "") -> List[OCRBlock]:
    # EXIF/downscale still applied so both engines behave identically
    # w.r.t. image handling; result unused by the mock text itself.
    _normalize_image(image_bytes)

    lines = _DEMO_BLOCKS
    if fixture_hint:
        fixture_path = os.path.join(settings.OCR_MOCK_FIXTURES_DIR, f"{fixture_hint}.ocr.txt")
        if os.path.exists(fixture_path):
            with open(fixture_path, "r", encoding="utf-8") as f:
                lines = [ln.strip() for ln in f if ln.strip()]

    blocks: List[OCRBlock] = []
    for idx, text in enumerate(lines):
        blocks.append(OCRBlock(
            text=text, confidence=0.92,
            bounding_box=[10.0, 20.0 * (idx + 1), 300.0, 20.0 * (idx + 1) + 18.0],
            block_index=idx,
        ))
    return blocks


# --- Public entrypoint -----------------------------------------------------

def extract_text_blocks(image_bytes: bytes, fixture_hint: str = "") -> List[OCRBlock]:
    """
    Synchronous, CPU-bound. Callers in async routes MUST wrap this in
    `starlette.concurrency.run_in_threadpool` per the code-generation
    rule in generate_code.md.
    """
    try:
        if settings.OCR_ENGINE == "paddleocr":
            return _extract_paddleocr(image_bytes)
        return _extract_mock(image_bytes, fixture_hint=fixture_hint)
    except Exception as e:
        # Never let an OCR failure surface a raw traceback to the caller.
        raise RuntimeError(f"OCR extraction failed: {e}") from e
