"""
Pitch detection service using CREPE.
"""
import io
import numpy as np
from scipy.io import wavfile
from pydub import AudioSegment
import crepe

from app.models.schemas import PitchSegment, PitchDetectionResponse


def hz_to_midi(frequency: float) -> int:
    """Convert frequency in Hz to MIDI note number."""
    if frequency <= 0:
        return 0
    midi = 69 + 12 * np.log2(frequency / 440.0)
    return int(round(midi))


def group_pitch_segments(
    time: np.ndarray,
    frequency: np.ndarray,
    confidence: np.ndarray,
    confidence_threshold: float = 0.3,
    pitch_tolerance_cents: float = 50,
) -> list[PitchSegment]:
    """
    Group consecutive pitch frames into segments.

    Args:
        time: Array of timestamps in seconds
        frequency: Array of frequencies in Hz
        confidence: Array of confidence values 0-1
        confidence_threshold: Minimum confidence to include
        pitch_tolerance_cents: Max cents difference to group together

    Returns:
        List of PitchSegment objects
    """
    segments = []
    current_segment = None

    for t, f, c in zip(time, frequency, confidence):
        # Skip low confidence frames
        if c < confidence_threshold or f <= 0:
            # End current segment if exists
            if current_segment is not None:
                segments.append(current_segment)
                current_segment = None
            continue

        midi_note = hz_to_midi(f)

        if current_segment is None:
            # Start new segment
            current_segment = {
                'start_time': t,
                'end_time': t,
                'frequencies': [f],
                'confidences': [c],
                'midi_note': midi_note,
            }
        else:
            # Check if pitch is similar enough to continue segment
            current_midi = current_segment['midi_note']
            current_freq = 440 * 2**((current_midi - 69) / 12)
            if current_freq > 0 and f > 0:
                cents_diff = abs(1200 * np.log2(f / current_freq))
            else:
                cents_diff = float('inf')

            if cents_diff <= pitch_tolerance_cents:
                # Continue segment
                current_segment['end_time'] = t
                current_segment['frequencies'].append(f)
                current_segment['confidences'].append(c)
            else:
                # End current segment, start new one
                segments.append(current_segment)
                current_segment = {
                    'start_time': t,
                    'end_time': t,
                    'frequencies': [f],
                    'confidences': [c],
                    'midi_note': midi_note,
                }

    # Don't forget the last segment
    if current_segment is not None:
        segments.append(current_segment)

    # Convert to PitchSegment objects
    result = []
    for seg in segments:
        result.append(PitchSegment(
            start_time=seg['start_time'],
            end_time=seg['end_time'],
            avg_frequency=float(np.mean(seg['frequencies'])),
            avg_confidence=float(np.mean(seg['confidences'])),
            midi_note=seg['midi_note'],
        ))

    return result


async def detect_pitch(
    audio_bytes: bytes,
    model_capacity: str = 'small',
    step_size: int = 10,
) -> PitchDetectionResponse:
    """
    Run CREPE pitch detection on audio bytes.

    Args:
        audio_bytes: Raw audio file bytes (WAV or WebM)
        model_capacity: CREPE model size ('tiny', 'small', 'medium', 'large', 'full')
        step_size: Hop size in milliseconds

    Returns:
        PitchDetectionResponse with grouped segments
    """
    # Convert audio to WAV format that CREPE expects
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes))

    # Convert to mono and get raw samples
    audio = audio.set_channels(1)
    sr = audio.frame_rate
    samples = np.array(audio.get_array_of_samples(), dtype=np.float32)

    # Normalize to [-1, 1]
    samples = samples / (2**15)

    # Run CREPE
    time, frequency, confidence, _ = crepe.predict(
        samples,
        sr,
        model_capacity=model_capacity,
        viterbi=True,  # Apply smoothing
        step_size=step_size,
        verbose=0,
    )

    # Group into segments
    segments = group_pitch_segments(time, frequency, confidence)

    return PitchDetectionResponse(
        segments=segments,
        duration_seconds=float(time[-1]) if len(time) > 0 else 0.0,
        sample_rate=sr,
        model_used=model_capacity,
    )
