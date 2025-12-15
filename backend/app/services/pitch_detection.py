"""
Pitch detection service using CREPE.
"""
import io
import numpy as np
from scipy.io import wavfile
from pydub import AudioSegment
import crepe

from app.models.schemas import PitchSegment, PitchDetectionResponse


# Store raw CREPE data for logging (will be accessed by rhythm_interpreter)
_last_raw_crepe_data: dict | None = None


def get_last_raw_crepe_data() -> dict | None:
    """Get the raw CREPE data from the last pitch detection run."""
    return _last_raw_crepe_data


def clear_raw_crepe_data():
    """Clear the stored raw CREPE data."""
    global _last_raw_crepe_data
    _last_raw_crepe_data = None


def calculate_rms_amplitude(samples: np.ndarray, frame_size: int = 1024, hop_size: int = 160) -> np.ndarray:
    """
    Calculate RMS amplitude for each frame of audio.

    Args:
        samples: Audio samples normalized to [-1, 1]
        frame_size: Number of samples per frame
        hop_size: Samples between frame starts (160 = 10ms at 16kHz)

    Returns:
        Array of RMS values, one per frame
    """
    if len(samples) < frame_size:
        # Not enough samples for even one frame
        return np.array([np.sqrt(np.mean(samples ** 2))]) if len(samples) > 0 else np.array([0.0])

    num_frames = (len(samples) - frame_size) // hop_size + 1
    rms = np.zeros(num_frames)

    for i in range(num_frames):
        start = i * hop_size
        frame = samples[start:start + frame_size]
        rms[i] = np.sqrt(np.mean(frame ** 2))

    return rms


def find_singing_boundaries(
    rms: np.ndarray,
    threshold_factor: float = 3.0,
    min_silence_frames: int = 10,
) -> tuple[int, int]:
    """
    Find the first and last frames where singing occurs.

    Singing is detected when amplitude rises significantly above the
    background noise level (estimated from the quietest portions).

    Args:
        rms: Array of RMS amplitude values
        threshold_factor: How many times above background noise to trigger
        min_silence_frames: Minimum quiet frames to estimate noise floor

    Returns:
        Tuple of (start_frame, end_frame) indices
    """
    if len(rms) < min_silence_frames:
        return 0, len(rms) - 1

    # Estimate noise floor from quietest 10% of frames
    sorted_rms = np.sort(rms)
    noise_floor = np.mean(sorted_rms[:max(1, len(sorted_rms) // 10)])

    # Threshold is noise floor * factor (with minimum to avoid zero)
    threshold = max(noise_floor * threshold_factor, 0.01)

    # Find first frame above threshold
    above_threshold = rms > threshold
    start_frame = 0
    for i, is_above in enumerate(above_threshold):
        if is_above:
            start_frame = i
            break

    # Find last frame above threshold
    end_frame = len(rms) - 1
    for i in range(len(above_threshold) - 1, -1, -1):
        if above_threshold[i]:
            end_frame = i
            break

    return start_frame, end_frame


def detect_onsets(
    rms: np.ndarray,
    hop_size_ms: float = 10.0,
    threshold_ratio: float = 1.5,
    min_rms: float = 0.02,
    min_onset_gap_ms: float = 100.0,
) -> list[float]:
    """
    Detect onset timestamps from RMS amplitude increases.

    An onset is detected when RMS increases by more than threshold_ratio
    (e.g., 1.5 = 150% increase, meaning new value is 2.5x the previous).

    Args:
        rms: Array of RMS amplitude values
        hop_size_ms: Time between RMS frames in milliseconds
        threshold_ratio: Minimum relative increase to trigger onset (1.5 = 150% increase)
        min_rms: Minimum RMS value to consider (avoids false onsets in silence)
        min_onset_gap_ms: Minimum gap between detected onsets (debouncing)

    Returns:
        List of onset timestamps in seconds
    """
    if len(rms) < 2:
        return []

    onsets = []
    hop_size_sec = hop_size_ms / 1000.0
    min_gap_sec = min_onset_gap_ms / 1000.0
    last_onset_time = -float('inf')

    for i in range(1, len(rms)):
        prev_rms = rms[i - 1]
        curr_rms = rms[i]
        onset_time = i * hop_size_sec

        # Skip if we're in silence
        if curr_rms < min_rms:
            continue

        # Skip if too close to last onset (debouncing)
        if onset_time - last_onset_time < min_gap_sec:
            continue

        # Calculate relative increase
        if prev_rms > 0:
            relative_increase = (curr_rms - prev_rms) / prev_rms
        else:
            # If previous was zero/near-zero, any significant current value is an onset
            relative_increase = float('inf') if curr_rms >= min_rms else 0

        if relative_increase >= threshold_ratio:
            onsets.append(onset_time)
            last_onset_time = onset_time

    return onsets


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
    amplitude_threshold_factor: float = 3.0,
) -> PitchDetectionResponse:
    """
    Run CREPE pitch detection on audio bytes with amplitude-based trimming.

    Args:
        audio_bytes: Raw audio file bytes (WAV or WebM)
        model_capacity: CREPE model size ('tiny', 'small', 'medium', 'large', 'full')
        step_size: Hop size in milliseconds
        amplitude_threshold_factor: How many times above noise floor to consider singing

    Returns:
        PitchDetectionResponse with grouped segments
    """
    global _last_raw_crepe_data

    # Convert audio to WAV format that CREPE expects
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes))

    # Convert to mono and get raw samples
    audio = audio.set_channels(1)
    sr = audio.frame_rate
    samples = np.array(audio.get_array_of_samples(), dtype=np.float32)

    # Normalize to [-1, 1] based on actual sample width
    sample_width = audio.sample_width  # bytes per sample
    if sample_width == 1:
        samples = samples / (2**7)   # 8-bit audio
    elif sample_width == 2:
        samples = samples / (2**15)  # 16-bit audio
    elif sample_width == 3:
        samples = samples / (2**23)  # 24-bit audio
    elif sample_width == 4:
        samples = samples / (2**31)  # 32-bit audio
    else:
        # Fallback: normalize by max absolute value
        max_val = np.abs(samples).max()
        if max_val > 0:
            samples = samples / max_val

    # Run CREPE
    time, frequency, confidence, _ = crepe.predict(
        samples,
        sr,
        model_capacity=model_capacity,
        viterbi=True,  # Apply smoothing
        step_size=step_size,
        verbose=0,
    )

    # Store raw CREPE data before any filtering (for logging)
    raw_time = time.copy()
    raw_frequency = frequency.copy()
    raw_confidence = confidence.copy()

    # Calculate amplitude and find singing boundaries
    # Use frame_size and hop_size that give ~10ms frames to match CREPE's step size
    frame_size = int(sr * 0.064)  # 64ms frame (matches CREPE's analysis window)
    hop_size = int(sr * 0.01)     # 10ms hop (matches CREPE's default step size)
    rms = calculate_rms_amplitude(samples, frame_size=frame_size, hop_size=hop_size)
    start_frame, end_frame = find_singing_boundaries(rms, threshold_factor=amplitude_threshold_factor)

    # Detect onsets from RMS amplitude
    onsets = detect_onsets(rms, hop_size_ms=step_size)

    # Convert frame indices to time (hop_size samples = step_size ms)
    start_time = start_frame * (step_size / 1000.0)
    end_time = end_frame * (step_size / 1000.0)

    # Filter CREPE output to only include frames within singing boundaries
    if len(time) > 0:
        mask = (time >= start_time) & (time <= end_time)
        time = time[mask]
        frequency = frequency[mask]
        confidence = confidence[mask]

    # Store the raw data for logging access
    _last_raw_crepe_data = {
        'raw_time': raw_time,
        'raw_frequency': raw_frequency,
        'raw_confidence': raw_confidence,
        'filtered_time': time,
        'filtered_frequency': frequency,
        'filtered_confidence': confidence,
        'amplitude_start_time': start_time,
        'amplitude_end_time': end_time,
        'rms': rms,
        'onsets': onsets,  # Onset timestamps for transition detection
    }

    # Group into segments
    segments = group_pitch_segments(time, frequency, confidence)

    return PitchDetectionResponse(
        segments=segments,
        duration_seconds=float(time[-1]) if len(time) > 0 else 0.0,
        sample_rate=sr,
        model_used=model_capacity,
    )
