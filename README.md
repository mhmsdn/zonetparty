# ZonetParty MVP

MVP backend for the ZonetParty matching engine.

## Included
- User/profile model
- Zone-specific matching weights
- Compatibility scoring
- Game-specific matching
- Mutual-consent match requests
- Block/report foundation
- SQLite persistence
- FastAPI API

## Run

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `/docs` for the interactive API.

This is an MVP foundation, not production-ready. Authentication, age/eligibility controls, moderation, rate limiting, audit logging, encrypted production storage and official game integrations still need to be added.
