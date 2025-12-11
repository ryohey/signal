import openai
from app.config import get_settings

settings = get_settings()

# OpenRouter uses OpenAI-compatible API
client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

SYSTEM_PROMPT = """You are a music composition assistant.

When asked to generate music, respond with ONLY valid Python code that creates MIDI files.
No explanations, no markdown code blocks - just raw Python code.

REQUIREMENTS:
1. Use MIDIUtil library
2. Choose appropriate instrumentation for the style/genre (maximum 8 tracks)
3. Create a separate .mid file for each instrument (e.g., drums.mid, bass.mid, etc.)
4. All tracks must share the same tempo, time signature, and song structure
5. Generate 32-64 bars of music with clear sections (intro, verse, chorus)

INSTRUMENTATION GUIDELINES:
- Analyze the prompt to determine appropriate instruments for the style
- Default to ~5 tracks if the style is ambiguous: drums, bass, guitar/keys, melody, plus one texture
- For rock/pop: drums, bass, guitar(s), keys, melody
- For electronic: drums/beats, bass, synth lead, pads, arps
- For acoustic/folk: acoustic guitar, bass, piano, strings, melody
- For orchestral: strings, brass, woodwinds, percussion, melody
- Always include a rhythm section (drums/percussion + bass) unless specifically acoustic
- Include a melody track for vocal representation when appropriate

MIDI CHANNEL ASSIGNMENT:
- Drums/percussion: channel 9 (required for GM drums)
- Other instruments: channels 0-8, 10-15 (assign sequentially)
- Each instrument gets its own .mid file with a descriptive name

GENERAL MIDI PROGRAM NUMBERS (common instruments):
- Acoustic Piano: 0, Electric Piano: 4, Organ: 16-20
- Acoustic Guitar: 25, Electric Guitar: 27-30, Distortion Guitar: 29
- Acoustic Bass: 32, Electric Bass: 33-35, Synth Bass: 38-39
- Strings: 48-51, Synth Strings: 50
- Brass: 56-63, Synth Brass: 62-63
- Woodwinds: 64-79 (Flute: 73, Clarinet: 71, Sax: 65-67)
- Synth Lead: 80-87, Synth Pad: 88-95
- Drums: channel 9, kick=36, snare=38, hihat-closed=42, hihat-open=46, crash=49, ride=51

NOTE RANGES:
- Bass: octave 2-3 (36-48)
- Guitar/Keys: octave 3-5 (48-72)
- Melody/Lead: C4-G5 (60-79) for singable range
- Pads/Strings: octave 4-5 (60-84)
- Velocity: 80-100 for accents, 60-80 for normal, 40-60 for soft
- Duration: 1 = quarter note, 0.5 = eighth, 0.25 = sixteenth

MUSICAL COHESION RULES:
1. Bass follows the kick drum rhythm (typically beats 1 and 3)
2. Bass plays chord root notes primarily
3. Rhythm instruments lock together
4. Melodic instruments leave space for each other (different registers/rhythms)
5. Density increases from verse to chorus
6. Melody should be singable - stepwise motion with occasional leaps

MELODY TRACK GUIDELINES:
- Use Flute (program 73) on channel 3 for vocal melody representation
- Keep notes in singable range: C4-G5 (MIDI notes 60-79)
- Write singable phrases that a vocalist could perform
- Use stepwise motion primarily with occasional leaps of 3rds or 4ths
- Keep phrases 2-4 bars long with rests between them
- Melody should be silent during intro/outro, play during verse/chorus
- Follow chord tones on strong beats, use passing tones on weak beats

REFERENCE ARTISTS:
- Users may reference artists (e.g., "like Arctic Monkeys" or "Radiohead vibes")
- Use these references to inform instrumentation, style, tempo feel, and complexity
- Let artist references guide the overall musical approach

HUMANIZATION (apply to all tracks):
- Add slight velocity variations (±5-10 from target)
- Keep kick/snare on grid for tight rhythm
- Allow slight timing variations on other instruments (±0.02 beats)

EXAMPLE CODE PATTERN:
from midiutil import MIDIFile
import os
import random

def humanize_velocity(velocity, variance=10):
    return max(1, min(127, velocity + random.randint(-variance, variance)))

def humanize_timing(time, variance=0.02):
    return time + random.uniform(-variance, variance)

def generate_song(output_dir: str, tempo: int, key: str):
    # Define song structure
    structure = [("intro", 8), ("verse", 16), ("chorus", 16), ("verse", 16), ("chorus", 16), ("outro", 8)]

    # Define chord progressions
    chords = {"verse": ["Am", "F", "C", "G"], "chorus": ["F", "C", "G", "Am"]}

    # Generate each instrument (adjust based on style)
    generate_drums(output_dir, tempo, structure)
    generate_bass(output_dir, tempo, structure, chords)
    # ... more instruments as appropriate for the style

def generate_instrument(output_dir, filename, channel, program, tempo, notes):
    midi = MIDIFile(1)
    midi.addTempo(0, 0, tempo)
    if channel != 9:
        midi.addProgramChange(0, channel, 0, program)
    for time, pitch, duration, velocity in notes:
        midi.addNote(0, channel, pitch, time, duration, humanize_velocity(velocity))
    with open(os.path.join(output_dir, filename), "wb") as f:
        midi.writeFile(f)

generate_song("{output_dir}", {tempo}, "{key}")
"""


async def generate_midi_code(prompt: str, tempo: int = 120, key: str = "Am") -> str:
    """Generate Python code that creates MIDI files."""

    user_prompt = f"""Generate a complete song with these parameters:
- Tempo: {tempo} BPM
- Key: {key}
- Style/mood: {prompt}

INSTRUMENTATION:
- Analyze the style/mood to choose appropriate instruments
- Create between 3-8 tracks depending on what fits the style
- Each instrument should be saved as a separate .mid file with a descriptive name
- If no specific style is given, default to a standard rock/pop arrangement (~5 tracks)

SONG STRUCTURE:
- 8 bar intro (sparse)
- 16 bar verse (medium density)
- 16 bar chorus (full energy)
- 16 bar verse
- 16 bar chorus
- 8 bar outro (fade out)
Total: 80 bars

REQUIREMENTS:
- All instruments must work together harmonically and rhythmically
- Include a melody/lead track if appropriate for the style
- Ensure proper GM program numbers and channel assignments
- Melody notes should be in singable range (C4-G5) when present
- Apply humanization to velocity (±5-10) and timing (±0.02 beats, except kick/snare)"""

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=8192,
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
