import styled from "@emotion/styled"
import { TrackId } from "@signal-app/core"
import { FC, useCallback, useState } from "react"
import { useTrack } from "../../hooks/useTrack"
import { useSong } from "../../hooks/useSong"
import { aiBackend } from "../../services/aiBackend"
import { useRegenerateTrack } from "../../actions/aiGeneration"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button, PrimaryButton } from "../ui/Button"

const Input = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.dividerColor};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  color: ${({ theme }) => theme.textColor};
  resize: none;
  font-family: inherit;
  font-size: 0.875rem;
  min-height: 80px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.themeColor};
  }

  &::placeholder {
    color: ${({ theme }) => theme.secondaryTextColor};
  }
`

const TrackInfo = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  border-radius: 0.5rem;
  font-size: 0.875rem;
`

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.redColor};
  margin-top: 0.5rem;
  font-size: 0.875rem;
`

export interface RegenerateDialogProps {
  trackId: TrackId
  open: boolean
  onClose: () => void
}

export const RegenerateDialog: FC<RegenerateDialogProps> = ({
  trackId,
  open,
  onClose,
}) => {
  const { name: trackName } = useTrack(trackId)
  const { tracks } = useSong()
  const regenerateTrack = useRegenerateTrack()
  const [instruction, setInstruction] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get other track names for context
  const otherTracks = tracks
    .filter((t) => !t.isConductorTrack && t.id !== trackId)
    .map((t) => t.name || "unnamed")

  const handleRegenerate = useCallback(async () => {
    if (!instruction.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await aiBackend.regenerate({
        trackName: trackName || "track",
        instruction: instruction.trim(),
        context: {
          tempo: 120, // TODO: get from conductor track
          key: "Am", // TODO: store and retrieve from song metadata
          otherTracks,
        },
      })

      // Apply the regenerated track
      regenerateTrack(response.track)

      // Close dialog on success
      setInstruction("")
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed")
    } finally {
      setIsLoading(false)
    }
  }, [instruction, isLoading, trackName, otherTracks, regenerateTrack, onClose])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setInstruction("")
      setError(null)
      onClose()
    }
  }, [isLoading, onClose])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        handleClose()
      }
    },
    [handleClose],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      style={{ minWidth: "24rem" }}
    >
      <DialogTitle>Regenerate Track with AI</DialogTitle>
      <DialogContent>
        <TrackInfo>
          Regenerating: <strong>{trackName || "Unnamed Track"}</strong>
        </TrackInfo>
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Describe how you want to change this track... (e.g., 'make the bass simpler' or 'add more variation')"
          disabled={isLoading}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <PrimaryButton
          onClick={handleRegenerate}
          disabled={isLoading || !instruction.trim()}
        >
          {isLoading ? "Regenerating..." : "Regenerate"}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  )
}
