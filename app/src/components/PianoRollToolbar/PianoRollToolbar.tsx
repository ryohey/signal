import styled from "@emotion/styled"
import { FC } from "react"
import { InstrumentBrowser } from "../InstrumentBrowser/InstrumentBrowser"
import { Toolbar } from "../Toolbar/Toolbar"
import { TrackListMenuButton } from "../TrackList/TrackListMenuButton"
import { EventListButton } from "./EventListButton"
import { InstrumentButton } from "./InstrumentButton"
import { PanSlider } from "./PanSlider"
import { PianoRollAutoScrollButton } from "./PianoRollAutoScrollButton"
import { PianoRollQuantizeSelector } from "./PianoRollQuantizeSelector"
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
  return (
    <Toolbar>
      <TrackListMenuButton />

      <TrackNameInput />

      <EventListButton />

      <Spacer />

      <InstrumentButton />
      <InstrumentBrowser />

      <VolumeSlider />
      <PanSlider />

      <FlexibleSpacer />

      <PianoRollToolSelector />

      <PianoRollQuantizeSelector />

      <PianoRollAutoScrollButton />
    </Toolbar>
  )
}
