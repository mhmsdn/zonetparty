from fastapi import FastAPI, HTTPException
from .models import Profile, MatchRequest
from .store import Store
from .matching import find_matches

app = FastAPI(title="ZonetParty API", version="0.1.0")
store = Store("zonetparty.db")

@app.get("/health")
def health():
    return {"ok": True, "app": "ZonetParty", "version": "0.1.0"}

@app.post("/profiles")
def create_profile(profile: Profile):
    store.save_profile(profile)
    return profile

@app.get("/profiles/{user_id}")
def get_profile(user_id: str):
    profile = store.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile

@app.post("/matches/search/{user_id}")
def search_matches(user_id: str, zone: str = "friend", limit: int = 10):
    source = store.get_profile(user_id)
    if not source:
        raise HTTPException(404, "Profile not found")
    candidates = [
        p for p in store.all_profiles()
        if p.user_id != user_id and not store.is_blocked(user_id, p.user_id)
    ]
    return {"zone": zone, "matches": find_matches(source, candidates, zone)[:limit]}

@app.post("/matches/request")
def request_match(req: MatchRequest):
    if not store.get_profile(req.from_user) or not store.get_profile(req.to_user):
        raise HTTPException(404, "Both profiles must exist")
    if store.is_blocked(req.from_user, req.to_user):
        raise HTTPException(403, "Matching is blocked")
    store.add_request(req)
    return {"status": "pending", "from": req.from_user, "to": req.to_user}

@app.post("/matches/accept")
def accept_match(req: MatchRequest):
    store.accept_request(req.from_user, req.to_user)
    return {"status": "matched", "users": [req.from_user, req.to_user]}

@app.post("/safety/block")
def block_user(from_user: str, to_user: str):
    store.block(from_user, to_user)
    return {"status": "blocked"}

@app.get("/games")
def games():
    return [
        {"id": "valorant", "name": "Valorant", "fields": ["rank","role","region","platform","voice","schedule","style"]},
        {"id": "fortnite", "name": "Fortnite", "fields": ["mode","rank","region","platform","voice","schedule","style"]},
        {"id": "minecraft", "name": "Minecraft", "fields": ["edition","mode","region","platform","voice","schedule","style"]},
        {"id": "cs2", "name": "Counter-Strike 2", "fields": ["rank","region","platform","voice","schedule","style"]},
        {"id": "roblox", "name": "Roblox", "fields": ["experience","region","platform","voice","schedule","style"]},
        {"id": "gta_online", "name": "GTA Online", "fields": ["platform","region","voice","schedule","style"]},
    ]
