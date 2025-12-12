"""Services for the AI music generation backend."""

from .llm import (
    generate_midi_code,
    generate_midi_code_from_spec,
    generate_song_spec,
    generate_refined_code,
)
from .midi_executor import execute_midi_generation, midi_to_base64, MIDIExecutionError
from .validator import validate_midi_output
from .generator import generate_song_deep, GenerationError
from .midi_parser import parse_midi_bytes, compute_track_metrics

__all__ = [
    # LLM functions
    "generate_midi_code",
    "generate_midi_code_from_spec",
    "generate_song_spec",
    "generate_refined_code",
    # MIDI executor
    "execute_midi_generation",
    "midi_to_base64",
    "MIDIExecutionError",
    # Validator
    "validate_midi_output",
    # Generator
    "generate_song_deep",
    "GenerationError",
    # MIDI parser
    "parse_midi_bytes",
    "compute_track_metrics",
]
