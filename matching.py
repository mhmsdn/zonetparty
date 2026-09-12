from .models import Profile

ZONE_WEIGHTS = {
    "date": {
        "interests": .15, "communication_style": .20, "values": .25,
        "goals": .20, "availability": .10, "age": .10
    },
    "friend": {
        "interests": .30, "communication_style": .25, "values": .15,
        "goals": .10, "availability": .20
    },
    "game": {
        "games": .45, "communication_style": .10, "availability": .20,
        "interests": .10, "age": .05
    },
    "study": {
        "goals": .30, "availability": .25, "interests": .20,
        "communication_style": .10, "values": .10, "age": .05
    },
    "pro": {
        "goals": .30, "interests": .25, "communication_style": .15,
        "values": .15, "availability": .10, "age": .05
    },
    "create": {
        "interests": .35, "goals": .25, "communication_style": .15,
        "availability": .15, "values": .10
    },
}

def overlap(a, b):
    a, b = set(x.lower() for x in a), set(x.lower() for x in b)
    if not a or not b:
        return 0.0
    return len(a & b) / max(1, len(a | b))

def age_score(a, b):
    return max(0.0, 1.0 - abs(a.age - b.age) / 15.0)

def game_score(a, b):
    ga = {g.game_id: g for g in a.games}
    gb = {g.game_id: g for g in b.games}
    common = set(ga) & set(gb)
    if not common:
        return 0.0, []
    best = 0.0
    for gid in common:
        x, y = ga[gid], gb[gid]
        parts = []
        if x.platform and y.platform:
            parts.append(1.0 if x.platform.lower() == y.platform.lower() else 0.0)
        if x.region and y.region:
            parts.append(1.0 if x.region.lower() == y.region.lower() else 0.0)
        if x.voice is not None and y.voice is not None:
            parts.append(1.0 if x.voice == y.voice else 0.0)
        parts.append(overlap(x.schedule, y.schedule))
        if x.rank and y.rank:
            parts.append(1.0 if x.rank.lower() == y.rank.lower() else 0.5)
        best = max(best, sum(parts) / len(parts) if parts else 0.0)
    return best, sorted(common)

def score(a, b, zone):
    w = ZONE_WEIGHTS.get(zone, ZONE_WEIGHTS["friend"])
    gs, shared_games = game_score(a, b)
    values = {
        "interests": overlap(a.interests, b.interests),
        "communication_style": overlap(a.communication_style, b.communication_style),
        "values": overlap(a.values, b.values),
        "goals": overlap(a.goals, b.goals),
        "availability": overlap(a.availability, b.availability),
        "games": gs,
        "age": age_score(a, b),
    }
    total = sum(weight * values[key] for key, weight in w.items())
    reasons = []
    if values["interests"] >= .35: reasons.append("shared interests")
    if values["communication_style"] >= .5: reasons.append("similar communication style")
    if values["values"] >= .4: reasons.append("compatible values")
    if values["availability"] >= .4: reasons.append("overlapping schedule")
    if shared_games and gs >= .55: reasons.append("strong game compatibility")
    return round(total * 100), reasons[:4], shared_games

def find_matches(source: Profile, candidates, zone: str):
    result = []
    for candidate in candidates:
        compatibility, reasons, shared_games = score(source, candidate, zone)
        result.append({
            "user_id": candidate.user_id,
            "display_name": candidate.display_name,
            "compatibility": compatibility,
            "reasons": reasons,
            "shared_games": shared_games,
        })
    return sorted(result, key=lambda item: item["compatibility"], reverse=True)
