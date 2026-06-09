import styled from "@emotion/styled"
import type { CheckedState } from "@radix-ui/react-checkbox"
import type { TrackEventOf, TrackId } from "@signal-app/core"
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DropdownButton,
  Label,
  PrimaryButton,
} from "@signal-app/ui"
import type { ProgramChangeEvent } from "midifile-ts"
import React, {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { InstrumentName } from "../../features/track-list/components/InstrumentName"
import { useInstrumentBrowser } from "../../hooks/useInstrumentBrowser"
import { useTrack } from "../../hooks/useTrack"
import { Localized } from "../../localize/useLocalization"
import { DrumKitCategoryName, FancyCategoryName } from "./CategoryName"
import { SelectBox } from "./SelectBox"

export interface InstrumentSetting {
  readonly programNumber: number
  readonly isRhythmTrack: boolean
}

const Finder = styled.div`
  display: flex;
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

export interface InstrumentBrowserProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trackId: TrackId
  targetEventId?: number
  showInsertButton?: boolean
}

const _InstrumentBrowser: FC<InstrumentBrowserProps> = ({
  isOpen,
  onOpenChange,
  trackId,
  targetEventId,
  showInsertButton = false,
}) => {
  const {
    programNumber: initialProgramNumber,
    isRhythmTrack: initialIsRhythmTrack,
    getEventById,
    removeEvent,
  } = useTrack(trackId)
  const [setting, setSetting] = useState({
    programNumber: initialProgramNumber ?? 0,
    isRhythmTrack: initialIsRhythmTrack ?? false,
  })
  const { programNumber, isRhythmTrack } = setting
  const {
    selectedCategoryIndex,
    categoryFirstProgramEvents,
    categoryInstruments,
    insertInstrumentChangeAtCurrentPosition,
    changeInstrument,
    onClickOK,
    changeRhythmTrack,
  } = useInstrumentBrowser(setting, targetEventId)

  const targetEvent = useMemo(() => {
    if (targetEventId !== undefined) {
      return getEventById(targetEventId) as
        | TrackEventOf<ProgramChangeEvent>
        | undefined
    }
    return undefined
  }, [targetEventId, getEventById])

  useEffect(() => {
    if (isOpen) {
      if (targetEvent) {
        setSetting({
          programNumber: targetEvent.value,
          isRhythmTrack: initialIsRhythmTrack ?? false,
        })
      }
    }
  }, [isOpen, targetEvent, initialIsRhythmTrack])

  const onChange = useCallback(
    (programNumber: number) => {
      setSetting({
        programNumber,
        isRhythmTrack,
      })
      changeInstrument(programNumber)
    },
    [isRhythmTrack, changeInstrument],
  )

  const handleChangeRhythmTrack = useCallback(
    (state: CheckedState) => {
      const isRhythmTrack = state === true
      setSetting({
        programNumber: 0, // reset program number when changing rhythm track
        isRhythmTrack,
      })
      changeRhythmTrack(isRhythmTrack)
    },
    [changeRhythmTrack],
  )

  const categoryOptions = categoryFirstProgramEvents.map((preset, i) => ({
    value: i,
    label: isRhythmTrack ? (
      <DrumKitCategoryName />
    ) : (
      <FancyCategoryName programNumber={preset} />
    ),
  }))

  const instrumentOptions = categoryInstruments.map((p) => ({
    value: p,
    label: <InstrumentName programNumber={p} isRhythmTrack={isRhythmTrack} />,
  }))

  const handleClickOK = useCallback(() => {
    onClickOK()
    onOpenChange(false)
  }, [onClickOK, onOpenChange])

  const handleClickInsert = useCallback(() => {
    insertInstrumentChangeAtCurrentPosition(programNumber)
    onOpenChange(false)
  }, [onOpenChange, insertInstrumentChangeAtCurrentPosition, programNumber])

  const handleClickDelete = useCallback(() => {
    if (targetEventId !== undefined) {
      removeEvent(targetEventId)
    }
    onOpenChange(false)
  }, [targetEventId, removeEvent, onOpenChange])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="InstrumentBrowser">
        <Finder>
          <Left>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="categories" />
            </Label>
            <SelectBox
              items={categoryOptions}
              selectedValue={selectedCategoryIndex}
              onChange={(i) => onChange(i * 8)} // Choose the first instrument of the category
            />
          </Left>
          <Right>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="instruments" />
            </Label>
            <SelectBox
              items={instrumentOptions}
              selectedValue={programNumber}
              onChange={onChange}
            />
          </Right>
        </Finder>
        <Footer>
          <Checkbox
            checked={isRhythmTrack}
            onCheckedChange={handleChangeRhythmTrack}
            label={<Localized name="rhythm-track" />}
          />
        </Footer>
      </DialogContent>
      <DialogActions>
        {targetEventId !== undefined && (
          <Button onClick={handleClickDelete} style={{ marginRight: "auto" }}>
            <Localized name="delete" />
          </Button>
        )}
        <Button onClick={() => onOpenChange(false)}>
          <Localized name="cancel" />
        </Button>
        {!showInsertButton && (
          <PrimaryButton onClick={handleClickOK}>
            <Localized name="ok" />
          </PrimaryButton>
        )}
        {showInsertButton && (
          <DropdownButton
            onClick={handleClickOK}
            actions={[
              {
                label: <Localized name="insert" />,
                onClick: handleClickInsert,
              },
            ]}
          >
            <Localized name="ok" />
          </DropdownButton>
        )}
      </DialogActions>
    </Dialog>
  )
}

export const InstrumentBrowser = React.memo(_InstrumentBrowser)
