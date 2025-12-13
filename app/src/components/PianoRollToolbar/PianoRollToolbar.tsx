import styled from "@emotion/styled"
import { FC } from "react"
import { useEditorMode } from "../../hooks/useEditorMode"
import { InstrumentBrowser } from "../InstrumentBrowser/InstrumentBrowser"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"
import { QuantizeSelector } from "../Toolbar/QuantizeSelector/QuantizeSelector"
import { Toolbar } from "../Toolbar/Toolbar"
import { TrackListMenuButton } from "../TrackList/TrackListMenuButton"
import { EventListButton } from "./EventListButton"
import { InstrumentButton } from "./InstrumentButton"
import { PanSlider } from "./PanSlider"
import { PianoRollToolSelector } from "./PianoRollToolSelector"
import { TrackNameInput } from "./TrackNameInput"
import { VolumeSlider } from "./VolumeSlider"

const Spacer = styled.div`
  width: 1rem;
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

export const PianoRollToolbar: FC = () => {
  const { isAdvanced } = useEditorMode()

  return (
    <Toolbar>
      <TrackListMenuButton />

      <TrackNameInput />

      {isAdvanced && <EventListButton />}

      <Spacer />

      <InstrumentButton />
      <InstrumentBrowser />

      <VolumeSlider />
      {isAdvanced && <PanSlider />}

      <FlexibleSpacer />

      <PianoRollToolSelector />

      {isAdvanced && <QuantizeSelector />}

      <AutoScrollButton />
    </Toolbar>
  )
}
