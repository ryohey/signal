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
import React, { type FC, useCallback } from "react"
import { Localized } from "../../../localize/useLocalization"
import { InstrumentName } from "../../track-list/components/InstrumentName"
import { useInstrumentBrowser } from "../hooks/useInstrumentBrowser"
import { DrumKitCategoryName, FancyCategoryName } from "./CategoryName"
import { SelectBox } from "./SelectBox"

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
  targetEvent?: TrackEventOf<ProgramChangeEvent>
  showInsertButton?: boolean
}

const _InstrumentBrowser: FC<InstrumentBrowserProps> = ({
  isOpen,
  onOpenChange,
  ...props
}) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    {isOpen && (
      <InstrumentBrowserContent
        {...props}
        onClose={() => onOpenChange(false)}
      />
    )}
  </Dialog>
)

export const InstrumentBrowser = React.memo(_InstrumentBrowser)

// Mounted only while open, so the draft state starts from the latest track state
const InstrumentBrowserContent: FC<
  Omit<InstrumentBrowserProps, "isOpen" | "onOpenChange"> & {
    onClose: () => void
  }
> = ({ trackId, targetEvent, showInsertButton = false, onClose }) => {
  const {
    programNumber,
    isRhythmTrack,
    selectedCategoryIndex,
    categoryFirstProgramEvents,
    categoryInstruments,
    selectInstrument,
    changeRhythmTrack,
    applyInstrument,
    insertInstrumentAtCurrentPosition,
    deleteTargetEvent,
  } = useInstrumentBrowser(trackId, targetEvent)

  const handleChangeRhythmTrack = useCallback(
    (state: CheckedState) => changeRhythmTrack(state === true),
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
    applyInstrument()
    onClose()
  }, [applyInstrument, onClose])

  const handleClickInsert = useCallback(() => {
    insertInstrumentAtCurrentPosition()
    onClose()
  }, [insertInstrumentAtCurrentPosition, onClose])

  const handleClickDelete = useCallback(() => {
    deleteTargetEvent()
    onClose()
  }, [deleteTargetEvent, onClose])

  return (
    <>
      <DialogContent className="InstrumentBrowser">
        <Finder>
          <Left>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="categories" />
            </Label>
            <SelectBox
              items={categoryOptions}
              selectedValue={selectedCategoryIndex}
              onChange={(i) => selectInstrument(i * 8)} // Choose the first instrument of the category
            />
          </Left>
          <Right>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="instruments" />
            </Label>
            <SelectBox
              items={instrumentOptions}
              selectedValue={programNumber}
              onChange={selectInstrument}
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
        {targetEvent && (
          <Button onClick={handleClickDelete} style={{ marginRight: "auto" }}>
            <Localized name="delete" />
          </Button>
        )}
        <Button onClick={onClose}>
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
    </>
  )
}
