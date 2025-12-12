import styled from "@emotion/styled"
import { FC, useCallback, useEffect, useRef, useState } from "react"
import { useConductorTrack } from "../../hooks/useConductorTrack"
import { DEFAULT_TEMPO } from "@signal-app/player"

const MicButton = styled.button<{ isRecording: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${({ isRecording, theme }) =>
    isRecording ? theme.redColor || "#f44336" : theme.themeColor};
  color: ${({ theme }) => theme.onSurfaceColor};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
  position: relative;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ isRecording }) =>
    isRecording &&
    `
    animation: pulse 1.5s ease-in-out infinite;
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }
  `}
`

const StatusText = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.secondaryTextColor};
  margin-top: 0.25rem;
  text-align: center;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`

export interface DetectedNote {
  pitch: number // MIDI note number (0-127)
  start: number // Start time in ticks
  duration: number // Duration in ticks
  velocity: number // 1-127
}

/**
 * Convert frequency (Hz) to MIDI note number
 */
function frequencyToMidiNote(frequency: number): number {
  if (frequency <= 0) return -1
  // A4 = 440 Hz = MIDI note 69
  const midiNote = 69 + 12 * Math.log2(frequency / 440)
  return Math.round(midiNote)
}

/**
 * Simple autocorrelation-based pitch detection
 */
function detectPitch(
  audioBuffer: Float32Array,
  sampleRate: number
): number | null {
  const minPeriod = Math.floor(sampleRate / 2000) // Max frequency ~2000 Hz
  const maxPeriod = Math.floor(sampleRate / 80) // Min frequency ~80 Hz
  const bufferSize = audioBuffer.length

  if (bufferSize < maxPeriod * 2) {
    return null
  }

  let bestPeriod = 0
  let bestCorrelation = 0

  // Autocorrelation
  for (let period = minPeriod; period < maxPeriod; period++) {
    let correlation = 0
    for (let i = 0; i < bufferSize - period; i++) {
      correlation += audioBuffer[i] * audioBuffer[i + period]
    }
    correlation /= bufferSize - period

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestPeriod = period
    }
  }

  // Only return if correlation is strong enough
  if (bestCorrelation < 0.1 || bestPeriod === 0) {
    return null
  }

  const frequency = sampleRate / bestPeriod
  return frequency
}

/**
 * Quantize note to nearest MIDI note
 */
function quantizeToNearestNote(midiNote: number): number {
  return Math.round(midiNote)
}

interface VoiceRecorderProps {
  onNotesDetected?: (notes: DetectedNote[]) => void
}

export const VoiceRecorder: FC<VoiceRecorderProps> = ({ onNotesDetected }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<string>("")
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Float32Array | null>(null)
  const recordingStartTimeRef = useRef<number>(0)
  const notesRef = useRef<DetectedNote[]>([])
  const currentNoteRef = useRef<{ pitch: number; startTime: number } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const onNotesDetectedRef = useRef<((notes: DetectedNote[]) => void) | null>(null)
  const { currentTempo } = useConductorTrack()
  
  // Store callback in ref to avoid dependency issues
  useEffect(() => {
    onNotesDetectedRef.current = onNotesDetected || null
  }, [onNotesDetected])

  const TICKS_PER_QUARTER = 480
  const ANALYSIS_INTERVAL_MS = 100 // Analyze every 100ms
  const MIN_NOTE_DURATION_TICKS = 120 // Minimum 16th note
  
  // Get current tempo or use default
  const tempo = currentTempo ?? DEFAULT_TEMPO

  const stopRecording = useCallback(async () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    dataArrayRef.current = null
    setIsRecording(false)
  }, [])

  const processAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !isRecording) {
      return
    }

    analyserRef.current.getFloatTimeDomainData(dataArrayRef.current)
    const audioContext = audioContextRef.current
    if (!audioContext) return

    const frequency = detectPitch(dataArrayRef.current, audioContext.sampleRate)
    const currentTime = Date.now()
    const elapsedMs = currentTime - recordingStartTimeRef.current
    // Convert milliseconds to ticks: (ms / 1000) * (BPM / 60) * TICKS_PER_QUARTER
    const elapsedTicks = Math.floor((elapsedMs / 1000) * (tempo / 60) * TICKS_PER_QUARTER)

    if (frequency && frequency > 0) {
      const midiNote = frequencyToMidiNote(frequency)
      const quantizedNote = quantizeToNearestNote(midiNote)

      if (quantizedNote >= 0 && quantizedNote <= 127) {
        // Check if we have a current note
        if (currentNoteRef.current) {
          // If pitch changed significantly, end the previous note
          if (Math.abs(currentNoteRef.current.pitch - quantizedNote) > 2) {
            // End previous note
            const noteDuration = elapsedTicks - currentNoteRef.current.startTime
            if (noteDuration >= MIN_NOTE_DURATION_TICKS) {
              notesRef.current.push({
                pitch: currentNoteRef.current.pitch,
                start: currentNoteRef.current.startTime,
                duration: noteDuration,
                velocity: 100,
              })
            }
            // Start new note
            currentNoteRef.current = {
              pitch: quantizedNote,
              startTime: elapsedTicks,
            }
          }
          // Otherwise, continue the current note
        } else {
          // Start a new note
          currentNoteRef.current = {
            pitch: quantizedNote,
            startTime: elapsedTicks,
          }
        }
      }
    } else {
      // No pitch detected - end current note if exists
      if (currentNoteRef.current) {
        const noteDuration = elapsedTicks - currentNoteRef.current.startTime
        if (noteDuration >= MIN_NOTE_DURATION_TICKS) {
          notesRef.current.push({
            pitch: currentNoteRef.current.pitch,
            start: currentNoteRef.current.startTime,
            duration: noteDuration,
            velocity: 100,
          })
        }
        currentNoteRef.current = null
      }
    }

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(processAudio)
    }
  }, [isRecording])

  const startRecording = useCallback(async () => {
    try {
      setStatus("Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)

      analyserRef.current = analyser
      dataArrayRef.current = new Float32Array(analyser.fftSize)

      recordingStartTimeRef.current = Date.now()
      notesRef.current = []
      currentNoteRef.current = null

      setIsRecording(true)
      setStatus("Recording... Hum or sing a melody!")
      processAudio()
    } catch (error) {
      console.error("Error starting recording:", error)
      setStatus(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Microphone access denied"
          : "Failed to start recording"
      )
      await stopRecording()
    }
  }, [processAudio, stopRecording])

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording()

      // Finalize the last note if exists
      if (currentNoteRef.current) {
        const elapsedMs = Date.now() - recordingStartTimeRef.current
        const elapsedTicks = Math.floor((elapsedMs / 1000) * (tempo / 60) * TICKS_PER_QUARTER)
        const noteDuration = elapsedTicks - currentNoteRef.current.startTime
        if (noteDuration >= MIN_NOTE_DURATION_TICKS) {
          notesRef.current.push({
            pitch: currentNoteRef.current.pitch,
            start: currentNoteRef.current.startTime,
            duration: noteDuration,
            velocity: 100,
          })
        }
      }

      // Pass notes to agent via callback
      if (notesRef.current.length > 0) {
        setStatus(`Detected ${notesRef.current.length} notes, sending to agent...`)
        
        // Call the callback to pass notes to parent (AIChat)
        if (onNotesDetectedRef.current) {
          onNotesDetectedRef.current(notesRef.current)
          setStatus(`Sent ${notesRef.current.length} notes to agent!`)
        } else {
          setStatus("No agent handler available")
        }
        setTimeout(() => setStatus(""), 3000)
      } else {
        setStatus("No notes detected. Try humming louder!")
        setTimeout(() => setStatus(""), 3000)
      }
    } else {
      await startRecording()
    }
  }, [isRecording, startRecording, stopRecording, tempo])

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  return (
    <Container>
      <MicButton
        isRecording={isRecording}
        onClick={handleToggleRecording}
        title={isRecording ? "Stop recording" : "Record voice melody"}
      >
        {isRecording ? "⏹" : "🎤"}
      </MicButton>
      {status && <StatusText>{status}</StatusText>}
    </Container>
  )
}

