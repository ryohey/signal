import styled from "@emotion/styled"
import { Toolbar } from "@signal-app/ui"
import type { FC } from "react"
import { AutoScrollButton } from "../../../../components/Toolbar/AutoScrollButton"
import { QuantizeSelector } from "../../../../components/Toolbar/QuantizeSelector/QuantizeSelector"
import { TrackListMenuButton } from "../../../track-list/components/TrackListMenuButton"
import { TrackNameInput } from "../../../track-list/components/TrackNameInput"
import { EventListButton } from "./EventListButton"
import { InstrumentButton } from "./InstrumentButton"
import { PanSlider } from "./PanSlider"
import { PianoRollToolSelector } from "./PianoRollToolSelector"
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

      <VolumeSlider />
      <PanSlider />

      <FlexibleSpacer />

      <PianoRollToolSelector />

      <QuantizeSelector />

      <AutoScrollButton />
    </Toolbar>
  )
}
