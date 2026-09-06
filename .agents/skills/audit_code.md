# Skill: audit_code

## Purpose
Review completed work against its spec before it's considered done.

## Process
1. Pull the relevant spec from `production_artifacts/Technical_Specification.md`.
2. Check:
   - Does the implementation do exactly what the spec says?
   - Hardcoded secrets or API keys committed anywhere?
   - Any synchronous heavy call in an async FastAPI route not wrapped in `run_in_threadpool`?
   - Error handling present at every external boundary?
   - If UI: does it match its Figma/v0 source, not a generic reinterpretation?
   - Known previous-prototype issues (EXIF orientation, path traversal, upload size, SQLite WAL) not reintroduced?
   - If the feature uses vector_database: is the similarity threshold explicit and 
  documented, not a magic number with no comment? Are near-threshold matches routed 
  to review rather than silently decided either way?
3. Produce a report: PASS, or specific line-level issues. Do not fix issues yourself.

## Rules
- Be specific, not general.
- Flag scope creep as seriously as missing functionality.
