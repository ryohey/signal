import styled from "@emotion/styled"
import { CheckedState } from "@radix-ui/react-checkbox"
import { groupBy, map } from "lodash"
import difference from "lodash/difference"
import range from "lodash/range"
import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { useSetTrackInstrument, useStartNote, useStopNote } from "../../actions"
import { isNotUndefined } from "../../helpers/array"
import { useSong } from "../../hooks/useSong"
import { useStores } from "../../hooks/useStores"
import { Localized } from "../../localize/useLocalization"
import { getCategoryIndex } from "../../midi/GM"
import { programChangeMidiEvent } from "../../midi/MidiEvent"
import { Dialog, DialogActions, DialogContent } from "../Dialog/Dialog"
import { FancyCategoryName } from "../TrackList/CategoryName"
import { InstrumentName } from "../TrackList/InstrumentName"
import { Button, PrimaryButton } from "../ui/Button"
import { Checkbox } from "../ui/Checkbox"
import { Label } from "../ui/Label"
import { SelectBox } from "./SelectBox"

export interface InstrumentSetting {
  programNumber: number
  isRhythmTrack: boolean
}

export interface InstrumentBrowserProps {
  isOpen: boolean
  setting: InstrumentSetting
  presetCategories: PresetCategory[]
  onChange: (setting: InstrumentSetting) => void
  onClickOK: () => void
  onClickCancel: () => void
}

export interface PresetItem {
  programNumber: number
}

export interface PresetCategory {
  presets: PresetItem[]
}

const Finder = styled.div`
  display: flex;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`

const Left = styled.div`
  width: 15rem;
  display: flex;
  flex-direction: column;
`

const Right = styled.div`
  width: 21rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Footer = styled.div`
  margin-top: 1rem;
`

const InstrumentBrowser: FC<InstrumentBrowserProps> = ({
  onClickCancel,
  onClickOK,
  isOpen,
  presetCategories,
  onChange,
  setting: { programNumber, isRhythmTrack },
}) => {
  const selectedCategoryId = getCategoryIndex(programNumber)

  const onChangeRhythmTrack = (state: CheckedState) => {
    onChange({ programNumber, isRhythmTrack: state === true })
  }

  const instruments =
    presetCategories.length > selectedCategoryId
      ? presetCategories[selectedCategoryId].presets
      : []

  const categoryOptions = presetCategories.map((preset, i) => ({
    value: i,
    label: (
      <FancyCategoryName programNumber={preset.presets[0].programNumber} />
    ),
  }))

  const instrumentOptions = instruments.map((p) => ({
    value: p.programNumber,
    label: <InstrumentName programNumber={p.programNumber} />,
  }))

  return (
    <Dialog open={isOpen} onOpenChange={onClickCancel}>
      <DialogContent className="InstrumentBrowser">
        <Finder className={isRhythmTrack ? "disabled" : ""}>
          <Left>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="categories" />
            </Label>
            <SelectBox
              items={categoryOptions}
              selectedValue={selectedCategoryId}
              onChange={(i) =>
                onChange({
                  programNumber: i * 8, // Choose the first instrument of the category
                  isRhythmTrack,
                })
              }
            />
          </Left>
          <Right>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="instruments" />
            </Label>
            <SelectBox
              items={instrumentOptions}
              selectedValue={programNumber}
              onChange={(programNumber) =>
                onChange({ programNumber, isRhythmTrack })
              }
            />
          </Right>
        </Finder>
        <Footer>
          <Checkbox
            checked={isRhythmTrack}
            onCheckedChange={onChangeRhythmTrack}
            label={<Localized name="rhythm-track" />}
          />
        </Footer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClickCancel}>
          <Localized name="cancel" />
        </Button>
        <PrimaryButton onClick={onClickOK}>
          <Localized name="ok" />
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  )
}

const InstrumentBrowserWrapper: FC = observer(() => {
  const {
    pianoRollStore: {
      selectedTrack: track,
      instrumentBrowserSetting,
      openInstrumentBrowser,
    },
    pianoRollStore,
    player,
  } = useStores()
  const song = useSong()
  const startNote = useStartNote()
  const stopNote = useStopNote()
  const setTrackInstrumentAction = useSetTrackInstrument()

  const [stopNoteTimeout, setStopNoteTimeout] = useState<NodeJS.Timeout | null>(
    null,
  )

  if (track === undefined) {
    return <></>
  }

  const close = () => (pianoRollStore.openInstrumentBrowser = false)
  const setTrackInstrument = (programNumber: number) =>
    setTrackInstrumentAction(track.id, programNumber)

  const presets: PresetItem[] = range(0, 128).map((programNumber) => ({
    programNumber,
    name: <InstrumentName programNumber={programNumber} />,
  }))

  const presetCategories = map(
    groupBy(presets, (p) => getCategoryIndex(p.programNumber)),
    (presets) => ({ presets }),
  )

  const onChange = (setting: InstrumentSetting) => {
    const channel = track.channel
    if (channel === undefined) {
      return
    }
    player.sendEvent(programChangeMidiEvent(0, channel, setting.programNumber))
    if (!player.isPlaying) {
      const noteNumber = 64

      // if note is already playing, stop it immediately and cancel the timeout
      if (stopNoteTimeout !== null) {
        clearTimeout(stopNoteTimeout)
        stopNote({
          noteNumber,
          channel,
        })
      }

      startNote({
        noteNumber,
        velocity: 100,
        channel,
      })
      const timeout = setTimeout(() => {
        stopNote({
          noteNumber,
          channel,
        })
        setStopNoteTimeout(null)
      }, 500)

      setStopNoteTimeout(timeout)
    }
    pianoRollStore.instrumentBrowserSetting = setting
  }

  return (
    <InstrumentBrowser
      isOpen={openInstrumentBrowser}
      setting={instrumentBrowserSetting}
      onChange={onChange}
      onClickCancel={() => {
        close()
      }}
      onClickOK={() => {
        if (instrumentBrowserSetting.isRhythmTrack) {
          track.channel = 9
          setTrackInstrument(0)
        } else {
          if (track.isRhythmTrack) {
            // 適当なチャンネルに変える
            const channels = range(16)
            const usedChannels = song.tracks
              .filter((t) => t !== track)
              .map((t) => t.channel)
            const availableChannel =
              Math.min(
                ...difference(channels, usedChannels).filter(isNotUndefined),
              ) || 0
            track.channel = availableChannel
          }
          setTrackInstrument(instrumentBrowserSetting.programNumber)
        }

        close()
      }}
      presetCategories={presetCategories}
    />
  )
})

export default InstrumentBrowserWrapper
