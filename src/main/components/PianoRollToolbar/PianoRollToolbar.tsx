import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import { FC, useCallback } from "react"
import { useStores } from "../../hooks/useStores"
import InstrumentBrowser from "../InstrumentBrowser/InstrumentBrowser"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"
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

export const PianoRollToolbar: FC = observer(() => {
  const { pianoRollStore } = useStores()

  const {
    quantize,
    autoScroll,
    isQuantizeEnabled,
    selectedTrack,
    selectedTrackId,
  } = pianoRollStore

  const onClickAutoScroll = useCallback(() => {
    pianoRollStore.autoScroll = !pianoRollStore.autoScroll
  }, [pianoRollStore])

  const onSelectQuantize = useCallback(
    (denominator: number) => {
      pianoRollStore.quantize = denominator
    },
    [pianoRollStore],
  )

  const onClickQuantizeSwitch = useCallback(() => {
    pianoRollStore.isQuantizeEnabled = !pianoRollStore.isQuantizeEnabled
  }, [pianoRollStore])

  if (selectedTrack === undefined) {
    return <></>
  }

  return (
    <Toolbar>
      <TrackListMenuButton />

      <TrackNameInput />

      <EventListButton />

      <Spacer />

      <InstrumentButton />
      <InstrumentBrowser />

      <VolumeSlider trackId={selectedTrackId} />
      <PanSlider trackId={selectedTrackId} />

      <FlexibleSpacer />

      <PianoRollToolSelector />

      <QuantizeSelector
        value={quantize}
        enabled={isQuantizeEnabled}
        onSelect={onSelectQuantize}
        onClickSwitch={onClickQuantizeSwitch}
      />

      <AutoScrollButton onClick={onClickAutoScroll} selected={autoScroll} />
    </Toolbar>
  )
})
