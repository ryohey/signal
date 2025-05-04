import { FC, useCallback } from "react"
import { useInstrumentBrowser } from "../../hooks/useInstrumentBrowser"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useTrack } from "../../hooks/useTrack"
import { categoryEmojis, getCategoryIndex } from "../../midi/GM"
import { ToolbarButton } from "../Toolbar/ToolbarButton"
import { TrackInstrumentName } from "../TrackList/InstrumentName"

export const InstrumentButton: FC = () => {
  const { selectedTrackId } = usePianoRoll()
  const { isRhythmTrack, programNumber } = useTrack(selectedTrackId)
  const { setSetting, setOpen } = useInstrumentBrowser()

  const onClickInstrument = useCallback(() => {
    setSetting({
      isRhythmTrack,
      programNumber,
    })
    setOpen(true)
  }, [isRhythmTrack, programNumber, setOpen, setSetting])

  const emoji = categoryEmojis[getCategoryIndex(programNumber ?? 0)]

  return (
    <ToolbarButton
      onMouseDown={(e) => {
        e.preventDefault()
        onClickInstrument()
      }}
    >
      <span style={{ marginRight: "0.5rem" }}>{emoji}</span>
      <span>
        <TrackInstrumentName trackId={selectedTrackId} />
      </span>
    </ToolbarButton>
  )
}
