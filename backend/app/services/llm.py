import openai
from app.config import get_settings

settings = get_settings()

# OpenRouter uses OpenAI-compatible API
client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

SYSTEM_PROMPT = """You are a music composition assistant specializing in indie rock.

When asked to generate music, respond with ONLY valid Python code that creates MIDI files.
No explanations, no markdown code blocks - just raw Python code.

REQUIREMENTS:
1. Use MIDIUtil library
2. Create separate MIDI files for each instrument: drums.mid, bass.mid, guitar.mid, keys.mid
3. All tracks must share the same tempo, time signature, and song structure
4. Generate 32-64 bars of music with clear sections (intro, verse, chorus)

CRITICAL - AVOID MIDI ERRORS:
1. NEVER have overlapping notes on the same pitch - each note must end before the next one on the same pitch starts
2. Keep note durations shorter than the gap to the next note (e.g., use 0.9 instead of 1.0 for quarter notes)
3. For chords, ensure all notes in the chord have the same duration
4. Use simple, non-overlapping patterns - avoid complex arpeggios that might overlap

MUSICAL COHESION RULES:
1. Bass MUST follow the kick drum rhythm (play on beats 1 and 3)
2. Bass plays chord root notes primarily
3. Guitar plays chord voicings, leaving space for bass frequencies
4. Keys provide texture/pads, not competing with guitar
5. Density increases from verse to chorus

MIDI REFERENCE:
- Track 0 for each file, but different channels
- Drums: channel 9, kick=36, snare=38, hihat-closed=42, hihat-open=46, crash=49, ride=51
- Bass: channel 0, notes in octave 2-3 (36-48)
- Guitar: channel 1, notes in octave 3-5 (48-72)
- Keys: channel 2, notes in octave 4-5 (60-84)
- Velocity: 80-100 for accents, 60-80 for normal, 40-60 for soft
- Duration: 1 = quarter note, 0.5 = eighth, 0.25 = sixteenth
- IMPORTANT: Use duration 0.9 for quarter notes, 0.45 for eighths to prevent overlap

HUMANIZATION:
- Add slight velocity variations (±5-10)
- Keep kick/snare on grid, allow slight timing variations on other instruments

CHORD REFERENCE for common keys:
- Am: Am(A,C,E), F(F,A,C), C(C,E,G), G(G,B,D)
- Em: Em(E,G,B), C(C,E,G), G(G,B,D), D(D,F#,A)
- Dm: Dm(D,F,A), Bb(Bb,D,F), F(F,A,C), C(C,E,G)
- C: C(C,E,G), G(G,B,D), Am(A,C,E), F(F,A,C)
- G: G(G,B,D), D(D,F#,A), Em(E,G,B), C(C,E,G)

NOTE NUMBERS:
- C2=36, D2=38, E2=40, F2=41, G2=43, A2=45, B2=47
- C3=48, D3=50, E3=52, F3=53, G3=55, A3=57, B3=59
- C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71
- C5=72, D5=74, E5=76, F5=77, G5=79, A5=81, B5=83

EXAMPLE STRUCTURE:
from midiutil import MIDIFile
import os
import random

def generate_song(output_dir: str, tempo: int, key: str):
    # Define song structure
    structure = [
        ("intro", 8),
        ("verse", 16),
        ("chorus", 16),
        ("verse", 16),
        ("chorus", 16),
        ("outro", 8)
    ]

    # Define chord progressions
    progressions = {
        "Am": {
            "verse": ["Am", "F", "C", "G"],
            "chorus": ["F", "C", "G", "Am"],
            "intro": ["Am", "F"],
            "outro": ["Am", "F", "Am", "Am"]
        }
    }

    chords = progressions.get(key, progressions["Am"])

    # Generate each instrument
    generate_drums(output_dir, tempo, structure)
    generate_bass(output_dir, tempo, structure, chords, key)
    generate_guitar(output_dir, tempo, structure, chords, key)
    generate_keys(output_dir, tempo, structure, chords, key)

def generate_drums(output_dir, tempo, structure):
    midi = MIDIFile(1)
    midi.addTempo(0, 0, tempo)
    # ... drum pattern generation
    with open(os.path.join(output_dir, "drums.mid"), "wb") as f:
        midi.writeFile(f)

# Similar functions for bass, guitar, keys...

generate_song("{output_dir}", {tempo}, "{key}")
"""


async def generate_midi_code(prompt: str, tempo: int = 120, key: str = "Am") -> str:
    """Generate Python code that creates MIDI files."""

    user_prompt = f"""Generate a complete indie rock song with these parameters:
- Tempo: {tempo} BPM
- Key: {key}
- Style/mood: {prompt}

Create 4 tracks: drums, bass, guitar, keys
Each should be saved as a separate .mid file.

Structure the song with:
- 8 bar intro (sparse, drums + one instrument)
- 16 bar verse (medium density)
- 16 bar chorus (full band, more energy)
- 16 bar verse
- 16 bar chorus
- 8 bar outro (fade out)

Total: 80 bars

Make sure all instruments work together harmonically and rhythmically."""

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=8192,  # Increased for longer code
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        extra_headers={
            "HTTP-Referer": "https://github.com/signal-music-composer",
            "X-Title": "AI Music Composer",
        },
    )

    return response.choices[0].message.content


SINGLE_TRACK_PROMPT = """Regenerate the {track_name} track for an existing song.

Context:
- Tempo: {tempo} BPM
- Key: {key}
- Other tracks in the song: {other_tracks}

Instruction: {instruction}

Generate ONLY Python code that creates a single MIDI file named "{track_name}.mid".
The code must be complete and executable. Use the exact structure below:

```
from midiutil import MIDIFile
import os

def generate_{track_name}(output_dir, tempo, key):
    midi = MIDIFile(1)
    track = 0
    channel = {channel}
    midi.addTempo(track, 0, tempo)

    # Add notes here using midi.addNote(track, channel, pitch, time, duration, velocity)
    # IMPORTANT: duration should be 0.9 for quarter notes to avoid overlap

    with open(os.path.join(output_dir, "{track_name}.mid"), "wb") as f:
        midi.writeFile(f)

generate_{track_name}("{{output_dir}}", {{tempo}}, "{{key}}")
```

Replace the comment with actual note generation code.
Output ONLY the Python code, no explanations or markdown.
"""


TRACK_CHANNELS = {
    "drums": 9,
    "bass": 0,
    "guitar": 1,
    "keys": 2,
}


async def generate_single_track_code(
    track_name: str, instruction: str, context: dict
) -> str:
    """Generate code for a single track regeneration."""

    tempo = context.get("tempo", 120)
    key = context.get("key", "Am")
    other_tracks = ", ".join(context.get("otherTracks", []))
    channel = TRACK_CHANNELS.get(track_name.lower(), 0)

    user_prompt = SINGLE_TRACK_PROMPT.format(
        tempo=tempo,
        key=key,
        other_tracks=other_tracks,
        track_name=track_name.lower(),
        instruction=instruction,
        channel=channel,
    )

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=4096,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        extra_headers={
            "HTTP-Referer": "https://github.com/signal-music-composer",
            "X-Title": "AI Music Composer",
        },
    )

    return response.choices[0].message.content
