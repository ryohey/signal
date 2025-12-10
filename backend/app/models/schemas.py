from pydantic import BaseModel
from typing import Optional


class GenerateRequest(BaseModel):
    prompt: str


class TrackData(BaseModel):
    name: str
    midi_data: str  # base64 encoded
    channel: int
    program_number: int


class SongMetadata(BaseModel):
    tempo: int
    key: str
    time_signature: str


class GenerateResponse(BaseModel):
    tracks: list[TrackData]
    metadata: SongMetadata
    message: str


class RegenerateRequest(BaseModel):
    track_name: str
    instruction: str
    context: dict  # Current song state for context


class RegenerateResponse(BaseModel):
    track: TrackData
    message: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
