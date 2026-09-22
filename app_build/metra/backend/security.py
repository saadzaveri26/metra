"""
Auth, role-based access, Clerk JWT verification (RS256 via JWKS or PEM key),
and the two path-safety primitives called out in the security baseline:
strict ID validation before using any user-supplied ID in a file path,
and a resolve()/is_relative_to() check before ever touching disk with it.
"""
import re
import time
import json
import urllib.request
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, Dict, Any


from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import PyJWKClient, PyJWTError

from config import settings
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)
except ImportError:
    import hashlib

    def hash_password(password: str) -> str:
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def verify_password(plain: str, hashed: str) -> bool:
        return hashlib.sha256(plain.encode("utf-8")).hexdigest() == hashed

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login",
    auto_error=True,
)

_ID_RE = re.compile(settings.ID_REGEX)

# Cached JWKS client for Clerk
_jwks_client: Optional[PyJWKClient] = None


def get_jwks_url() -> Optional[str]:
    if settings.CLERK_JWKS_URL:
        return settings.CLERK_JWKS_URL
    if settings.CLERK_ISSUER:
        return f"{settings.CLERK_ISSUER.rstrip('/')}/.well-known/jwks.json"
    return None


def get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client
    url = get_jwks_url()
    if url and _jwks_client is None:
        _jwks_client = PyJWKClient(url, cache_jwk_set=True, lifespan=300)
    return _jwks_client


def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    """Dev helper for generating test tokens using HMAC or configured key."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies a JWT token:
    1. If CLERK_JWT_KEY (PEM public key) is provided, verifies using RS256.
    2. If Clerk JWKS client is configured, retrieves key from JWKS via kid and verifies RS256.
    3. Fallback to HS256 for local test tokens signed with SECRET_KEY.
    """
    try:
        # 1. Verify with explicit PEM public key (e.g., Clerk Dashboard JWT key or test key)
        if settings.CLERK_JWT_KEY:
            payload = jwt.decode(
                token,
                settings.CLERK_JWT_KEY,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            return _normalize_claims(payload)

        # 2. Verify with Clerk JWKS endpoint
        jwks_client = get_jwks_client()
        if jwks_client:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            return _normalize_claims(payload)

        # 3. Development/Test fallback with SECRET_KEY
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_aud": False},
        )
        return _normalize_claims(payload)

    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


logger = logging.getLogger("metra.security")
_CLERK_USER_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
_CACHE_TTL_SECONDS = 60.0


def fetch_clerk_user_data(user_id: str) -> Dict[str, Any]:
    """
    Fetches user public metadata and profile directly from Clerk REST API.
    Uses an in-memory TTL cache to minimize latency while keeping roles fresh.
    """
    if not settings.CLERK_SECRET_KEY or not user_id.startswith("user_"):
        return {}

    now = time.time()
    if user_id in _CLERK_USER_CACHE:
        cached_time, cached_data = _CLERK_USER_CACHE[user_id]
        if now - cached_time < _CACHE_TTL_SECONDS:
            return cached_data

    try:
        req = urllib.request.Request(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={
                "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
                "User-Agent": "metra-backend",
            },
        )
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode())
            _CLERK_USER_CACHE[user_id] = (now, data)
            return data
    except Exception as e:
        logger.warning("Failed to fetch Clerk user %s metadata: %s", user_id, e)
        return {}


def _normalize_claims(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes Clerk user claims.
    Extracts role from 'role', or nested 'public_metadata.role' / 'metadata.role'.
    If role is missing in JWT (default Clerk session token), falls back to fetching
    from Clerk API using CLERK_SECRET_KEY so authorized users are never rejected.
    """
    sub = payload.get("sub") or ""
    role = (
        payload.get("role")
        or payload.get("public_metadata", {}).get("role")
        or payload.get("metadata", {}).get("role")
    )
    email = payload.get("email")
    full_name = payload.get("name") or payload.get("full_name")
    state_region = payload.get("state_region")

    # If role claim is not present in token JWT (default Clerk session token behavior),
    # fetch directly from Clerk public_metadata so users are never locked out
    if not role and sub.startswith("user_") and settings.CLERK_SECRET_KEY:
        clerk_data = fetch_clerk_user_data(sub)
        if clerk_data:
            public_meta = clerk_data.get("public_metadata", {})
            role = public_meta.get("role")
            if not email:
                email = clerk_data.get("email_addresses", [{}])[0].get("email_address")
            if not full_name:
                fn = clerk_data.get("first_name") or ""
                ln = clerk_data.get("last_name") or ""
                full_name = f"{fn} {ln}".strip() or None
            if not state_region:
                state_region = public_meta.get("state_region")

    if role:
        role = str(role).lower().strip()

    return {
        "sub": sub,
        "role": role,
        "email": email,
        "full_name": full_name,
        "state_region": state_region,
        "raw_claims": payload,
    }



async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """FastAPI dependency extracting verified user context from Bearer token."""
    payload = decode_access_token(token)
    if not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_roles(*allowed_roles: str):
    """
    Role-boundary enforcement dependency.
    Guarantees that:
    1. A valid JWT with NO role claim is rejected with HTTP 403 (never errors unpredictably).
    2. A valid JWT with an unauthorized role is rejected with HTTP 403.
    3. Access is granted only when the role claim matches one of allowed_roles.
    """
    normalized_allowed = [
        "officer" if r == "inspector" else ("headquarters" if r == "hq" else r)
        for r in allowed_roles
    ]

    async def _checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = user.get("role")

        # Explicit check for missing or null role claim
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: User has no assigned role claim. Role onboarding required.",
            )

        normalized_user_role = (
            "officer"
            if user_role == "inspector"
            else ("headquarters" if user_role == "hq" else user_role)
        )

        if normalized_user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Forbidden: Action requires one of roles: [{', '.join(allowed_roles)}]. "
                    f"Current user has role '{user_role}'."
                ),
            )
        return user

    return _checker


def validate_id(value: str, field_name: str = "id") -> str:
    """Strict format check for any ID used to resolve a file path."""
    if not _ID_RE.match(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name} format")
    return value


def safe_join(base_dir: str, *parts: str) -> Path:
    """
    Resolve a path under base_dir and refuse to return anything that
    escapes it (path traversal guard). Always call validate_id() on any
    user-supplied component first.
    """
    base = Path(base_dir).resolve()
    candidate = (base / Path(*parts)).resolve()
    if not candidate.is_relative_to(base):
        raise HTTPException(status_code=400, detail="Invalid path")
    return candidate
