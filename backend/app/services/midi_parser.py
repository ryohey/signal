"""MIDI binary parsing utilities for quality validation."""

import struct
from typing import List, Tuple, Dict, Any


def parse_midi_bytes(midi_bytes: bytes) -> Tuple[int, int, List[Dict[str, Any]]]:
    """
    Parse MIDI binary data and extract note information.

    Returns:
        Tuple of (ticks_per_beat, tempo_bpm, notes)
        where notes is a list of dicts with: pitch, velocity, start_tick, duration_ticks, channel
    """
    if len(midi_bytes) < 14:
        raise ValueError("MIDI data too short")

    # Parse header
    header = midi_bytes[:4]
    if header != b'MThd':
        raise ValueError(f"Invalid MIDI header: {header}")

    header_length = struct.unpack('>I', midi_bytes[4:8])[0]
    format_type = struct.unpack('>H', midi_bytes[8:10])[0]
    num_tracks = struct.unpack('>H', midi_bytes[10:12])[0]
    ticks_per_beat = struct.unpack('>H', midi_bytes[12:14])[0]

    # Default tempo (120 BPM)
    tempo_bpm = 120

    # Parse tracks
    notes = []
    pos = 14

    for track_idx in range(num_tracks):
        if pos >= len(midi_bytes):
            break

        # Check for track header
        if midi_bytes[pos:pos+4] != b'MTrk':
            break

        track_length = struct.unpack('>I', midi_bytes[pos+4:pos+8])[0]
        track_end = pos + 8 + track_length
        pos += 8

        # Track state
        current_time = 0
        running_status = 0
        note_on_times: Dict[Tuple[int, int], int] = {}  # (channel, pitch) -> start_time

        while pos < track_end:
            # Read delta time (variable length)
            delta = 0
            while pos < track_end:
                byte = midi_bytes[pos]
                pos += 1
                delta = (delta << 7) | (byte & 0x7F)
                if not (byte & 0x80):
                    break

            current_time += delta

            if pos >= track_end:
                break

            # Read status byte
            status = midi_bytes[pos]

            if status & 0x80:
                # New status byte
                pos += 1
                running_status = status
            else:
                # Running status - use previous
                status = running_status

            if status == 0xFF:
                # Meta event
                if pos >= track_end:
                    break
                meta_type = midi_bytes[pos]
                pos += 1

                # Read length (variable)
                length = 0
                while pos < track_end:
                    byte = midi_bytes[pos]
                    pos += 1
                    length = (length << 7) | (byte & 0x7F)
                    if not (byte & 0x80):
                        break

                if meta_type == 0x51 and length == 3:
                    # Tempo event
                    microseconds_per_beat = struct.unpack('>I', b'\x00' + midi_bytes[pos:pos+3])[0]
                    tempo_bpm = round(60_000_000 / microseconds_per_beat)

                pos += length

            elif status == 0xF0 or status == 0xF7:
                # SysEx event - read until 0xF7 or length
                length = 0
                while pos < track_end:
                    byte = midi_bytes[pos]
                    pos += 1
                    length = (length << 7) | (byte & 0x7F)
                    if not (byte & 0x80):
                        break
                pos += length

            elif (status & 0xF0) in (0x80, 0x90, 0xA0, 0xB0, 0xE0):
                # Two-byte channel events
                if pos + 1 >= track_end:
                    break

                channel = status & 0x0F
                data1 = midi_bytes[pos]
                data2 = midi_bytes[pos + 1]
                pos += 2

                event_type = status & 0xF0

                if event_type == 0x90 and data2 > 0:
                    # Note on
                    note_on_times[(channel, data1)] = current_time

                elif event_type == 0x80 or (event_type == 0x90 and data2 == 0):
                    # Note off
                    key = (channel, data1)
                    if key in note_on_times:
                        start_time = note_on_times[key]
                        duration = current_time - start_time

                        # Look up original velocity from note-on
                        velocity = data2 if event_type == 0x80 else 64  # Default if note-off velocity

                        notes.append({
                            'pitch': data1,
                            'velocity': velocity,
                            'start_tick': start_time,
                            'duration_ticks': duration,
                            'channel': channel,
                        })
                        del note_on_times[key]

            elif (status & 0xF0) in (0xC0, 0xD0):
                # One-byte channel events
                pos += 1

    # For any notes still on, close them at the last known time
    for (channel, pitch), start_time in note_on_times.items():
        notes.append({
            'pitch': pitch,
            'velocity': 64,
            'start_tick': start_time,
            'duration_ticks': ticks_per_beat,  # Default to quarter note
            'channel': channel,
        })

    return ticks_per_beat, tempo_bpm, notes


def compute_track_metrics(
    notes: List[Dict[str, Any]],
    ticks_per_beat: int,
    tempo_bpm: int,
    track_name: str
) -> Dict[str, Any]:
    """
    Compute quality metrics for a list of notes.

    Returns dict with:
        - name: track name
        - note_count: total notes
        - velocity_min/max/mean/std: velocity statistics
        - notes_per_bar: average notes per 4-beat bar
        - eighth_note_or_faster_pct: percentage of notes with duration <= half beat
        - syncopation_score: percentage of notes starting off-beat
        - silence_pct: approximate percentage of silent time
    """
    if not notes:
        return {
            'name': track_name,
            'note_count': 0,
            'velocity_min': 0,
            'velocity_max': 0,
            'velocity_mean': 0,
            'velocity_std': 0,
            'notes_per_bar': 0,
            'eighth_note_or_faster_pct': 0,
            'syncopation_score': 0,
            'silence_pct': 100,
        }

    velocities = [n['velocity'] for n in notes]
    vel_mean = sum(velocities) / len(velocities)
    vel_std = (sum((v - vel_mean) ** 2 for v in velocities) / len(velocities)) ** 0.5

    # Duration analysis
    eighth_note_ticks = ticks_per_beat / 2
    short_notes = sum(1 for n in notes if n['duration_ticks'] <= eighth_note_ticks)
    eighth_pct = (short_notes / len(notes)) * 100

    # Syncopation analysis (notes starting off-beat)
    off_beat_notes = 0
    for n in notes:
        beat_position = (n['start_tick'] % ticks_per_beat) / ticks_per_beat
        # Off-beat if not on beat (0.0) or half-beat (0.5) positions
        if beat_position > 0.1 and abs(beat_position - 0.5) > 0.1:
            off_beat_notes += 1
    syncopation = off_beat_notes / len(notes)

    # Drum-specific analysis (for channel 9)
    snare_hits_per_bar = None
    kick_hits_per_bar = None
    hihat_hits_per_bar = None

    # Check if this is a drum track (channel 9)
    channels = set(n['channel'] for n in notes)
    if 9 in channels:
        drum_notes = [n for n in notes if n['channel'] == 9]

        # Count hits by drum type (GM standard)
        SNARE_PITCHES = {38, 40}  # Acoustic snare, Electric snare
        KICK_PITCHES = {35, 36}   # Acoustic bass drum, Bass drum 1
        HIHAT_PITCHES = {42, 44, 46}  # Closed, Pedal, Open hi-hat

        snare_hits = sum(1 for n in drum_notes if n['pitch'] in SNARE_PITCHES)
        kick_hits = sum(1 for n in drum_notes if n['pitch'] in KICK_PITCHES)
        hihat_hits = sum(1 for n in drum_notes if n['pitch'] in HIHAT_PITCHES)

        # Calculate total bars for drum track
        if drum_notes:
            drum_max_end = max(n['start_tick'] + n['duration_ticks'] for n in drum_notes)
            drum_min_start = min(n['start_tick'] for n in drum_notes)
            drum_total_ticks = drum_max_end - drum_min_start
            drum_total_bars = max(1, drum_total_ticks / (ticks_per_beat * 4))

            snare_hits_per_bar = snare_hits / drum_total_bars
            kick_hits_per_bar = kick_hits / drum_total_bars
            hihat_hits_per_bar = hihat_hits / drum_total_bars

    # Calculate duration of piece and notes per bar
    if notes:
        max_end = max(n['start_tick'] + n['duration_ticks'] for n in notes)
        min_start = min(n['start_tick'] for n in notes)
        total_ticks = max_end - min_start
        total_bars = max(1, total_ticks / (ticks_per_beat * 4))
        notes_per_bar = len(notes) / total_bars

        # Silence calculation (very rough estimate)
        note_coverage_ticks = sum(n['duration_ticks'] for n in notes)
        silence_pct = max(0, 100 - (note_coverage_ticks / total_ticks * 100)) if total_ticks > 0 else 0
    else:
        notes_per_bar = 0
        silence_pct = 100

    return {
        'name': track_name,
        'note_count': len(notes),
        'velocity_min': min(velocities),
        'velocity_max': max(velocities),
        'velocity_mean': round(vel_mean, 1),
        'velocity_std': round(vel_std, 1),
        'notes_per_bar': round(notes_per_bar, 1),
        'eighth_note_or_faster_pct': round(eighth_pct, 1),
        'syncopation_score': round(syncopation, 2),
        'silence_pct': round(silence_pct, 1),
        # Drum-specific metrics
        'snare_hits_per_bar': round(snare_hits_per_bar, 1) if snare_hits_per_bar is not None else None,
        'kick_hits_per_bar': round(kick_hits_per_bar, 1) if kick_hits_per_bar is not None else None,
        'hihat_hits_per_bar': round(hihat_hits_per_bar, 1) if hihat_hits_per_bar is not None else None,
    }
