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
- Drums: channel 9, kick=36, snare=38, hihat-closed=42, hihat-open=46, crash=49, ride=51, tom-low=45, tom-mid=47, tom-high=50

NOTE RANGES:
- Bass: octave 2-3 (36-48)
- Guitar/Keys: octave 3-5 (48-72)
- Melody/Lead: C4-G5 (60-79) for singable range
- Pads/Strings: octave 4-5 (60-84)
- Duration: 1 = quarter note, 0.5 = eighth, 0.25 = sixteenth

RHYTHM COMPLEXITY (CRITICAL - music must groove):
- Minimum 60% eighth notes or faster - quarter notes alone sound robotic
- Use syncopation: place notes BETWEEN beats (0.5, 1.5, 2.5, 3.5)
- Vary note durations within each bar - mix eighths, sixteenths, quarters
- Add strategic rests - don't fill every beat
- Swing feel: optionally delay off-beat notes by 0.03-0.05

VELOCITY DYNAMICS (CRITICAL - music must breathe):
- Full range: 30-100, not just 70-90
- Strong beats (1, 3): velocity 85-100
- Weak beats (2, 4): velocity 65-80
- Off-beats: velocity 50-70
- Ghost notes: velocity 30-50
- Crescendo into chorus: gradually increase velocity over 2-4 bars
- Decrescendo in outro: gradually decrease velocity

PATTERN VARIATION (CRITICAL - avoid repetition):
- Change patterns every 4-8 bars
- Verse pattern MUST differ from chorus pattern
- Second verse should vary from first verse (add ornaments, change rhythm slightly)
- Add fills every 8 bars to transition between sections
- Bridge section: completely different pattern/feel

INSTRUMENT-SPECIFIC RULES:

DRUMS:
- Hi-hat: ALWAYS eighth notes minimum, sixteenths in chorus for energy
- Kick: Syncopated pattern, NOT just beats 1 and 3 (e.g., 1, 2.5, 3, 4.5)
- Snare: Main hits on 2 and 4, ADD ghost notes (vel 30-45) on other beats
- Fills every 8 bars: tom rolls (45, 47, 50) or snare rolls before section changes
- Crash (49) on beat 1 of new sections
- Ride (51) in verses, hi-hat in chorus for contrast

BASS:
- NEVER just root notes on quarter notes - this sounds amateur
- Use eighth note patterns: root-root-fifth-root or root-octave-fifth-third
- Add chromatic approach notes (one semitone below target note)
- Lock rhythmically with kick drum pattern
- Walking bass in jazz/soul styles
- Slides: approach notes 1-2 semitones below
- Octave jumps for energy in chorus

GUITAR (Rhythm):
- Strumming: alternate DOWN-up-DOWN-up, not all downstrokes
- Eighth note strumming minimum, sixteenths for high energy
- Palm muting in verses (shorter duration 0.1-0.2, lower velocity 50-65)
- Open strumming in chorus (longer duration 0.3-0.5, higher velocity 75-90)
- Power chords: staccato hits (duration 0.2-0.3)
- Arpeggios: sixteenth notes through chord tones

GUITAR (Lead):
- Pentatonic runs and licks, not just held notes
- Bends represented by quick chromatic steps
- Vibrato: slight pitch oscillation (optional)
- Call and response with vocals/melody
- Solo section: faster sixteenth note runs, wider interval jumps

KEYS/PIANO:
- NOT just whole note pads - this is boring
- Rhythmic comping: eighth note patterns with chord stabs
- Use chord inversions for smooth voice leading
- Left hand: bass notes or octaves on beats 1 and 3
- Right hand: chord voicings with rhythmic variation
- Occasional runs/fills between chord changes
- Counter-melody lines in different register from main melody

MELODY TRACK:
- Use Flute (program 73) on channel 3 for vocal melody representation
- Keep notes in singable range: C4-G5 (MIDI notes 60-79)
- Phrases 2-4 bars with rests between (singers need to breathe!)
- Stepwise motion primarily, leaps of 3rds/4ths for expression
- Chord tones on strong beats, passing tones on weak beats
- Vary rhythm: mix quarter, eighth, dotted rhythms
- Syncopation: anticipate chord changes by an eighth note
- Silent during intro/outro

STRUCTURE DYNAMICS:
- Intro (8 bars): Sparse, 1-2 instruments, establish groove
- Verse 1 (16 bars): Medium density, drums + bass + one melodic instrument
- Pre-Chorus (4-8 bars): Build tension, add instruments, crescendo
- Chorus (16 bars): Full band, highest energy, densest arrangement
- Verse 2 (16 bars): Like verse 1 but with subtle variations (extra fills, ornaments)
- Chorus 2 (16 bars): Even bigger - add extra layer or higher octave
- Bridge (8 bars): Different feel - change pattern, maybe half-time or different groove
- Outro (8 bars): Gradually reduce instruments, decrescendo, end on root chord

REFERENCE ARTISTS:
- Users may reference artists (e.g., "like Arctic Monkeys" or "Radiohead vibes")
- Use these references to inform instrumentation, style, tempo feel, and complexity
- Let artist references guide the overall musical approach

HUMANIZATION (apply to all tracks):
- Velocity variation: ±5-15 from target (use humanize_velocity function)
- Timing: kick/snare ON grid, other instruments ±0.02 beats (use humanize_timing function)
- Never have all notes at exact same velocity - this sounds robotic

EXAMPLE CODE PATTERN:
from midiutil import MIDIFile
import os
import random

def humanize_velocity(base_vel, variance=12):
    return max(1, min(127, base_vel + random.randint(-variance, variance)))

def humanize_timing(time, variance=0.02):
    return max(0, time + random.uniform(-variance, variance))

def generate_song(output_dir: str, tempo: int, key: str):
    os.makedirs(output_dir, exist_ok=True)
    structure = [("intro", 8), ("verse", 16), ("chorus", 16), ("verse", 16), ("chorus", 16), ("outro", 8)]
    chords = {"verse": ["Am", "F", "C", "G"], "chorus": ["F", "C", "G", "Am"]}
    generate_drums(output_dir, tempo, structure)
    generate_bass(output_dir, tempo, structure, chords)
    # ... more instruments as appropriate for the style

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
