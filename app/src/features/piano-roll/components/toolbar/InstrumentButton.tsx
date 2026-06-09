import { ToolbarButton } from "@signal-app/ui"
import { type FC, useState } from "react"
import { InstrumentBrowser } from "../../../../components/InstrumentBrowser/InstrumentBrowser"
import { useTrack } from "../../../../hooks/useTrack"
import { categoryEmojis, getCategoryIndex } from "../../../../midi/GM"
import { InstrumentName } from "../../../track-list/components/InstrumentName"
import { usePianoRoll } from "../../hooks/usePianoRoll"

export const InstrumentButton: FC = () => {
  const { selectedTrackId } = usePianoRoll()
  const { isRhythmTrack, programNumber } = useTrack(selectedTrackId)
  const [isOpen, setOpen] = useState(false)

  const emoji = isRhythmTrack
    ? "🥁"
    : categoryEmojis[getCategoryIndex(programNumber ?? 0)]

  return (
    <>
      <ToolbarButton
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        <span style={{ marginRight: "0.5rem" }}>{emoji}</span>
        <span>
          <InstrumentName
            programNumber={programNumber}
            isRhythmTrack={isRhythmTrack}
          />
        </span>
      </ToolbarButton>
      <InstrumentBrowser
        isOpen={isOpen}
        onOpenChange={setOpen}
        trackId={selectedTrackId}
        showInsertButton={true}
      />
    </>
  )
}
