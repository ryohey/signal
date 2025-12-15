import styled from "@emotion/styled"
import { FC, useState } from "react"
import type { NoteQuantizationSettings } from "../../helpers/basicPitchConverter"
import { Button } from "../ui/Button"
import { Slider } from "../ui/Slider"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"

const Section = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
`

const Description = styled.p`
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0.75rem 0;
`

const ValueDisplay = styled.span`
  font-family: monospace;
  color: var(--color-theme);
  margin-left: 0.5rem;
`

const FileName = styled.div`
  font-size: 0.875rem;
  color: var(--color-text);
  background: var(--color-background-secondary);
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-family: monospace;
`

interface AudioImportDialogProps {
  file: File
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (settings: NoteQuantizationSettings) => Promise<unknown>
}

export const AudioImportDialog: FC<AudioImportDialogProps> = ({
  file,
  open,
  onOpenChange,
  onImport,
}) => {
  const [pitchCorrection, setPitchCorrection] = useState(100) // Default: full quantization
  const [minDuration, setMinDuration] = useState(10) // 0.1s in units of 0.01s
  const [velocitySensitivity, setVelocitySensitivity] = useState(80)
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    setIsImporting(true)
    try {
      await onImport({
        pitchCorrectionStrength: pitchCorrection,
        minimumNoteDuration: minDuration / 100, // Convert to seconds
        velocitySensitivity,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Import failed:", error)
      alert(
        "Import failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      )
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle>Import Audio as MIDI</DialogTitle>
      <DialogContent>
        <FileName>{file.name}</FileName>

        <Section>
          <Label>
            Pitch Correction
            <ValueDisplay>{pitchCorrection}%</ValueDisplay>
          </Label>
          <Description>
            How much to snap notes to the nearest pitch. 0% preserves original
            pitch, 100% forces notes into correct scale.
          </Description>
          <Slider
            value={pitchCorrection}
            onChange={setPitchCorrection}
            min={0}
            max={100}
            step={1}
          />
        </Section>

        <Section>
          <Label>
            Minimum Note Duration
            <ValueDisplay>{(minDuration / 100).toFixed(2)}s</ValueDisplay>
          </Label>
          <Description>
            Filter out very short notes (typically noise or artifacts).
          </Description>
          <Slider
            value={minDuration}
            onChange={setMinDuration}
            min={5}
            max={50}
            step={1}
          />
        </Section>

        <Section>
          <Label>
            Velocity Sensitivity
            <ValueDisplay>{velocitySensitivity}%</ValueDisplay>
          </Label>
          <Description>
            How much volume variation to capture. Lower = more uniform
            velocities, higher = more dynamic range.
          </Description>
          <Slider
            value={velocitySensitivity}
            onChange={setVelocitySensitivity}
            min={10}
            max={100}
            step={1}
          />
        </Section>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onOpenChange(false)} disabled={isImporting}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={isImporting}>
          {isImporting ? "Importing..." : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
