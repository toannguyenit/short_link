# Custom Behavioral Rules for Antigravity AI Assistant

## Session History Logging
Every time the AI assistant performs a task/feature work in this repository, it MUST:
1. Generate a session directory under `ai-history/<YYYYMMDD>_<short_task_description>/` (e.g., `ai-history/20260724_vps_deployment/`).
2. Save copies of the `walkthrough.md` and `task.md` created during the session inside this directory for historic tracking.
3. Commit these history logs to the repository upon completion of the task.
