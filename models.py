from typing import List, Optional
from pydantic import BaseModel, Field

class GameProfile(BaseModel):
    game_id: str
    platform: Optional[str] = None
    region: Optional[str] = None
    rank: Optional[str] = None
    role: Optional[str] = None
    mode: Optional[str] = None
    edition: Optional[str] = None
    voice: Optional[bool] = None
    style: Optional[str] = None
    schedule: List[str] = Field(default_factory=list)

class Profile(BaseModel):
    user_id: str
    display_name: str
    age: int = Field(ge=18, le=100)
    languages: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    communication_style: List[str] = Field(default_factory=list)
    values: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)
    availability: List[str] = Field(default_factory=list)
    games: List[GameProfile] = Field(default_factory=list)

class MatchRequest(BaseModel):
    from_user: str
    to_user: str
    zone: str
