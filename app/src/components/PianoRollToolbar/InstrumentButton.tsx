import { observer } from "mobx-react-lite"
import { FC, useCallback } from "react"
import { useInstrumentBrowser } from "../../hooks/useInstrumentBrowser"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { categoryEmojis, getCategoryIndex } from "../../midi/GM"
import { ToolbarButton } from "../Toolbar/ToolbarButton"
import { TrackInstrumentName } from "../TrackList/InstrumentName"

// we still need to use observer to track selectedTrack changes
export const InstrumentButton: FC = observer(() => {
  const { selectedTrack } = usePianoRoll()
  const { setSetting, setOpen } = useInstrumentBrowser()

  const onClickInstrument = useCallback(() => {
    const track = selectedTrack
    if (track === undefined) {
      return
    }
    const programNumber = track.programNumber
    setSetting({
      isRhythmTrack: track.isRhythmTrack,
      programNumber: programNumber ?? 0,
    })
    setOpen(true)
  }, [selectedTrack, setOpen, setSetting])

  if (selectedTrack === undefined) {
    return <></>
  }

  const { programNumber } = selectedTrack
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
        <TrackInstrumentName track={selectedTrack} />
      </span>
    </ToolbarButton>
  )
})
