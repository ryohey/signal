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

const AudioVisualizer = styled.div`
  width: 100%;
  max-width: 200px;
  padding: 0.5rem;
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  border-radius: 0.375rem;
  border: 1px solid ${({ theme }) => theme.dividerColor};
`

const LevelMeter = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.backgroundColor};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  position: relative;
`

const LevelBar = styled.div<{ level: number }>`
  height: 100%;
  width: ${({ level }) => Math.min(100, level * 100)}%;
  background: ${({ level, theme }) => {
    if (level > 0.7) return theme.redColor || "#f44336"
    if (level > 0.4) return theme.yellowColor || "#ffc107"
    return theme.themeColor
  }};
  transition:
    width 0.1s ease-out,
    background 0.1s ease-out;
  border-radius: 4px;
`

const FrequencyDisplay = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textColor};
  text-align: center;
  font-family: monospace;
`

const WaveformContainer = styled.div`
  width: 100%;
  height: 40px;
  background: ${({ theme }) => theme.backgroundColor};
  border-radius: 0.25rem;
  position: relative;
  overflow: hidden;
  margin-top: 0.5rem;
`

const WaveformCanvas = styled.canvas`
  width: 100%;
  height: 100%;
`

const RecordingTimer = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.secondaryTextColor};
  margin-left: 8px;
  font-family: monospace;
`

const MicrophoneSelect = styled.select`
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.dividerColor};
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  color: ${({ theme }) => theme.textColor};
  max-width: 180px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.themeColor};
  }
`

const MicSelectorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`

export interface DetectedNote {
  pitch: number // MIDI note number (0-127)
  start: number // Start time in ticks
  duration: number // Duration in ticks
  velocity: number // 1-127
}

/**
 * Calculate RMS (Root Mean Square) audio level
 * Returns a normalized value between 0 and 1
 */
function calculateRMS(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i]
  }
  const rms = Math.sqrt(sum / buffer.length)
  // Normalize and amplify for better visualization
  // RMS values are typically very small (0.001-0.1), so we scale them up
  return Math.min(1, rms * 10) // Scale by 10x and cap at 1.0
}

/**
 * Draw waveform on canvas
 */
function drawWaveform(
  canvas: HTMLCanvasElement,
  buffer: Float32Array,
  width: number,
  height: number,
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  // Find max amplitude for scaling
  let maxAmplitude = 0
  for (let i = 0; i < buffer.length; i++) {
    maxAmplitude = Math.max(maxAmplitude, Math.abs(buffer[i]))
  }

  // Scale factor to make waveform more visible (amplify low signals)
  const scaleFactor = maxAmplitude > 0 ? Math.min(10, 0.1 / maxAmplitude) : 1

  ctx.strokeStyle = "#4caf50"
  ctx.lineWidth = 2
  ctx.beginPath()

  const sliceWidth = width / buffer.length
  const centerY = height / 2
  let x = 0

  for (let i = 0; i < buffer.length; i++) {
    // Center the waveform and scale it
    const v = buffer[i] * scaleFactor
    const y = centerY - v * centerY

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    x += sliceWidth
  }

  ctx.stroke()

  // Draw center line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  ctx.stroke()
}

interface VoiceRecorderProps {
  onNotesDetected?: (notes: DetectedNote[]) => void
  onAudioCaptured?: (audioBlob: Blob, notes: DetectedNote[]) => void
}

export const VoiceRecorder: FC<VoiceRecorderProps> = ({
  onNotesDetected,
  onAudioCaptured,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([])
  const [selectedMicId, setSelectedMicId] = useState<string>("")
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Float32Array | null>(null)
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const onNotesDetectedRef = useRef<((notes: DetectedNote[]) => void) | null>(
    null,
  )
  const isRecordingRef = useRef<boolean>(false)
  // Audio recording for CREPE processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [recordingDuration, setRecordingDuration] = useState(0)
  const recordingTimerRef = useRef<number | null>(null)
  const MAX_RECORDING_DURATION = 30 // seconds
  const onAudioCapturedRef = useRef<
    ((audioBlob: Blob, notes: DetectedNote[]) => void) | null
  >(null)
  const { currentTempo } = useConductorTrack()

  // Store callbacks in refs to avoid dependency issues
  useEffect(() => {
    onNotesDetectedRef.current = onNotesDetected || null
  }, [onNotesDetected])

  useEffect(() => {
    onAudioCapturedRef.current = onAudioCaptured || null
  }, [onAudioCaptured])

  // Enumerate available microphones on mount
  useEffect(() => {
    const enumerateMics = async () => {
      try {
        // Request permission first to get proper device labels
        await navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => stream.getTracks().forEach((t) => t.stop()))
          .catch(() => {}) // Ignore permission errors, we'll still enumerate

        const devices = await navigator.mediaDevices.enumerateDevices()
        const mics = devices.filter((d) => d.kind === "audioinput")
        setAvailableMics(mics)

        // Try to find a real microphone (not virtual)
        const realMic = mics.find(
          (m) =>
            !m.label.toLowerCase().includes("blackhole") &&
            !m.label.toLowerCase().includes("virtual") &&
            !m.label.toLowerCase().includes("soundflower"),
        )
        if (realMic) {
          setSelectedMicId(realMic.deviceId)
        } else if (mics.length > 0) {
          setSelectedMicId(mics[0].deviceId)
        }
      } catch (err) {
        console.error("[VoiceRecorder] Error enumerating devices:", err)
      }
    }
    enumerateMics()

    // Re-enumerate when devices change
    navigator.mediaDevices.addEventListener("devicechange", enumerateMics)
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", enumerateMics)
  }, [])

  // Get current tempo or use default
  const tempo = currentTempo ?? DEFAULT_TEMPO

  const getAudioBlob = useCallback((): Blob | null => {
    if (audioChunksRef.current.length === 0) return null
    return new Blob(audioChunksRef.current, { type: "audio/webm" })
  }, [])

  const stopRecording = useCallback(async () => {
    // Stop MediaRecorder and collect audio blob
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop()
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    setRecordingDuration(0)

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
    isRecordingRef.current = false
    setIsRecording(false)
    setAudioLevel(0)
  }, [])

  const processAudio = useCallback(() => {
    if (
      !analyserRef.current ||
      !dataArrayRef.current ||
      !isRecordingRef.current
    ) {
      return
    }

    // Check if audio context is still valid
    const audioContext = audioContextRef.current
    if (!audioContext || audioContext.state === "closed") {
      return
    }

    if (audioContext.state === "suspended") {
      audioContext.resume()
    }

    // Check if stream is still active
    if (!mediaStreamRef.current) {
      return
    }

    const tracks = mediaStreamRef.current.getAudioTracks()
    const activeTrack = tracks.find((t) => t.readyState === "live")
    if (!activeTrack) {
      return
    }

    try {
      // Get audio data
      analyserRef.current.getFloatTimeDomainData(dataArrayRef.current)

      // Calculate audio level (RMS) - keep for visual feedback
      const rms = calculateRMS(dataArrayRef.current)
      setAudioLevel(rms)

      // Draw waveform - keep for visual feedback
      if (waveformCanvasRef.current) {
        const canvas = waveformCanvasRef.current
        drawWaveform(canvas, dataArrayRef.current, canvas.width, canvas.height)
      }
    } catch (error) {
      console.error("Error in processAudio:", error)
    }

    // Continue the loop
    if (isRecordingRef.current) {
      animationFrameRef.current = requestAnimationFrame(processAudio)
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("Microphone API not available in this browser")
        console.error("getUserMedia not available")
        return
      }

      setStatus("Requesting microphone access...")

      // Request microphone with better error handling
      // Use selected device if available
      let stream: MediaStream
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }
      if (selectedMicId) {
        audioConstraints.deviceId = { exact: selectedMicId }
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        })
      } catch (err) {
        const error = err as Error
        console.error("getUserMedia error:", error)
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setStatus(
            "Microphone permission denied. Please allow microphone access.",
          )
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          setStatus("No microphone found. Please connect a microphone.")
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          setStatus("Microphone is being used by another application.")
        } else {
          setStatus(`Microphone error: ${error.message}`)
        }
        return
      }

      // Verify stream has active audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        setStatus("No audio tracks found in stream")
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      // Check if tracks are active
      const activeTrack = audioTracks.find(
        (track) => track.readyState === "live",
      )
      if (!activeTrack) {
        setStatus("Audio tracks are not active")
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      // Microphone connected successfully

      mediaStreamRef.current = stream

      // Create audio context with explicit sample rate
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: 44100, // Standard sample rate
      })
      audioContextRef.current = audioContext

      // Resume AudioContext if suspended (required by browser autoplay policies)
      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      // Wait a moment for context to fully initialize
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Double-check context is running
      if (audioContext.state !== "running") {
        await audioContext.resume()
      }

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.3 // Lower for more responsive visualization
      analyser.minDecibels = -90
      analyser.maxDecibels = -10
      source.connect(analyser)

      analyserRef.current = analyser
      dataArrayRef.current = new Float32Array(analyser.fftSize)

      // Set up MediaRecorder for audio capture
      try {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        })
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.start(1000) // Collect data every second

        // Start recording timer
        setRecordingDuration(0)
        recordingTimerRef.current = window.setInterval(() => {
          setRecordingDuration((prev) => {
            if (prev >= MAX_RECORDING_DURATION - 1) {
              // Auto-stop at max duration - use timeout to avoid setState during render
              setTimeout(() => {
                if (isRecordingRef.current) {
                  stopRecording()
                }
              }, 0)
              return prev
            }
            return prev + 1
          })
        }, 1000)
      } catch (err) {
        console.warn("MediaRecorder not supported, pitch detection only:", err)
      }

      // Monitor track state changes
      activeTrack.addEventListener("ended", () => {
        setStatus("Microphone disconnected")
        stopRecording()
      })

      activeTrack.addEventListener("mute", () => {
        setStatus("Microphone muted")
      })

      activeTrack.addEventListener("unmute", () => {
        setStatus("Recording... Hum or sing a melody!")
      })

      // Setup waveform canvas
      if (waveformCanvasRef.current) {
        const canvas = waveformCanvasRef.current
        canvas.width = canvas.offsetWidth * window.devicePixelRatio
        canvas.height = canvas.offsetHeight * window.devicePixelRatio
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
      }

      setAudioLevel(0)

      // Set recording state in both ref and state
      isRecordingRef.current = true
      setIsRecording(true)
      setStatus("Recording... Hum or sing a melody!")

      // Start the audio processing loop
      processAudio()
    } catch (error) {
      console.error("Error starting recording:", error)
      const err = error as Error
      setStatus(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone permission denied"
          : err.name === "NotFoundError"
            ? "No microphone found"
            : `Error: ${err.message || "Failed to start recording"}`,
      )
      await stopRecording()
    }
  }, [processAudio, stopRecording, selectedMicId])

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording()

      // After finalizing notes, also pass audio blob for CREPE processing
      const audioBlob = getAudioBlob()
      if (audioBlob) {
        console.log(
          `Audio blob captured: ${(audioBlob.size / 1024).toFixed(1)} KB`,
        )
      }
      if (audioBlob && onAudioCapturedRef.current) {
        setStatus(`Processing audio with CREPE...`)
        onAudioCapturedRef.current(audioBlob, [])
        setStatus(`✅ Audio captured! Processing melody...`)
        setTimeout(() => setStatus(""), 3000)
      } else if (audioBlob) {
        // Audio blob captured but no handler - still show success
        setStatus(
          `✅ Audio captured (${(audioBlob.size / 1024).toFixed(1)} KB)`,
        )
        setTimeout(() => setStatus(""), 3000)
      } else {
        setStatus("No audio recorded")
        setTimeout(() => setStatus(""), 3000)
      }
    } else {
      await startRecording()
    }
  }, [isRecording, startRecording, stopRecording, tempo, getAudioBlob])

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  return (
    <Container>
      {!isRecording && availableMics.length > 1 && (
        <MicSelectorRow>
          <MicrophoneSelect
            value={selectedMicId}
            onChange={(e) => setSelectedMicId(e.target.value)}
            title="Select microphone"
          >
            {availableMics.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </MicrophoneSelect>
        </MicSelectorRow>
      )}
      <MicButton
        isRecording={isRecording}
        onClick={handleToggleRecording}
        disabled={isProcessing}
        title={
          isProcessing
            ? "Processing..."
            : isRecording
              ? "Stop recording"
              : "Record voice melody"
        }
      >
        {isProcessing ? "⏳" : isRecording ? "⏹" : "🎤"}
      </MicButton>
      {isRecording && (
        <RecordingTimer>
          {recordingDuration}s / {MAX_RECORDING_DURATION}s
        </RecordingTimer>
      )}
      {isRecording && (
        <AudioVisualizer>
          <LevelMeter>
            <LevelBar level={audioLevel} />
          </LevelMeter>
          <FrequencyDisplay style={{ color: "rgba(255,255,255,0.5)" }}>
            {audioLevel > 0.01 ? "Recording..." : "No audio detected"}
          </FrequencyDisplay>
          <WaveformContainer>
            <WaveformCanvas ref={waveformCanvasRef} />
          </WaveformContainer>
        </AudioVisualizer>
      )}
      {status && <StatusText>{status}</StatusText>}
      {isProcessing && <StatusText>⏳ Processing...</StatusText>}
    </Container>
  )
}
