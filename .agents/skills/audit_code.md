# Skill: audit_code (Updated — auth + multi-role checks)

## Purpose
Review completed work against its spec before it's considered done.

## Process
1. Pull the relevant spec from `production_artifacts/Technical_Specification.md`.
2. Check:
   - Does the implementation do exactly what the spec says?
   - Hardcoded secrets or API keys committed anywhere (including Clerk secret keys)?
   - Any synchronous heavy call in an async FastAPI route not wrapped in `run_in_threadpool`?
   - Error handling present at every external boundary?
   - If UI: does it match its HTML/Figma/v0 source exactly, not a generic reinterpretation?
   - **Auth/role checks:** does every backend endpoint verify role from the Clerk JWT rather than trusting a client-sent value? Is `publicMetadata.role` ever written from client-side code (it must not be)? Does a vendor/consumer-scoped query ever risk returning another business's or another role's data?
   - Known previous-prototype issues (EXIF orientation, path traversal, upload size, SQLite WAL) not reintroduced?
   - If vector_database is used: is the similarity threshold explicit and documented?
3. Produce a report: PASS, or specific line-level issues. Do not fix issues yourself.

## Rules
- Be specific, not general.
- Flag scope creep and any role-boundary violation as seriously as missing functionality — a role-boundary leak is a security issue, treat it at that severity.
