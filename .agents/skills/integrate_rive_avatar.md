# Skill: integrate_rive_avatar

## Purpose
Wire a team-built Rive `.riv` avatar file into the Next.js app. The rig (shapes, keyframes, state machine) is built manually in the Rive editor by the team — this skill is integration only.

## Input
A `.riv` file with a state machine named `AvatarSM`, inputs:
- `avatarState` (number): 0 = idle, 1 = scanning, 2 = thinking, 3 = pass, 4 = concerned
- `mouthOpen` (number, 0-1): drives lip movement blend

## Process
1. Place the `.riv` file in `app_build/metra/public/`.
2. Use `@rive-app/react-canvas`'s `useRive` and `useStateMachineInput` hooks.
3. Set `avatarState` from real app events: scan request fires → 1; awaiting a backend response → 2; verdict PASS → 3; NON_COMPLIANT/NEEDS_REVIEW → 4.
4. Drive `mouthOpen`:
   - Fixed pre-rendered phrases: Web Audio `AnalyserNode` amplitude, updated via `requestAnimationFrame`.
   - Dynamic Ask METRA answers: `SpeechSynthesisUtterance.onboundary`, toggling `mouthOpen` between 0 and 1.
5. Reset `avatarState` to 0 (idle) after a result has been shown, or on navigation away.

## Rules
- Never use a live cloud TTS with viseme data (Azure/Polly) — local/offline methods only, for demo reliability.
- If the `.riv` file's input names don't match this schema, stop and report the mismatch rather than guessing.
