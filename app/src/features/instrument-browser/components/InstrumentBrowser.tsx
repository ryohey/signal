import styled from "@emotion/styled";
import type { CheckedState } from "@radix-ui/react-checkbox";
import type { TrackEventOf, TrackId } from "@signal-app/core";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DropdownButton,
  Label,
  PrimaryButton,
  VisuallyHidden
} from "@signal-app/ui";
import type { ProgramChangeEvent } from "midifile-ts";
import React, { type FC, useCallback } from "react";
import { Localized } from "../../../localize/useLocalization";
import { InstrumentName } from "../../track-list/components/InstrumentName";
import { useInstrumentBrowser } from "../hooks/useInstrumentBrowser";
import { DrumKitCategoryName, FancyCategoryName } from "./CategoryName";
import { SelectBox } from "./SelectBox";

const Finder = styled.div`
  display: flex;
`

const Left = styled.div`
  width: 13rem;
  display: flex;
  flex-direction: column;
`

const Right = styled.div`
  width: 16rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Bank = styled.div`
  width: 13rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const BankNumber = styled.span`
  display: inline-block;
  min-width: 2rem;
  color: var(--color-text-secondary);
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

const dialogStyle = { maxWidth: "calc(100vw - 2rem)" }

const _InstrumentBrowser: FC<InstrumentBrowserProps> = ({
  isOpen,
  onOpenChange,
  ...props
}) => (
  <Dialog
    open={isOpen}
    onOpenChange={onOpenChange}
    aria-describedby={undefined}
    // The bank lists make the dialog wider than the default max width
    style={dialogStyle}
  >
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
    patch,
    isRhythmTrack,
    selectedCategoryIndex,
    categoryIndices,
    categoryInstruments,
    bankMSBs,
    bankLSBs,
    choosePatch,
    selectCategory,
    selectInstrument,
    selectBankMSB,
    selectBankLSB,
    changeRhythmTrack,
    applyInstrument,
    insertInstrumentAtCurrentPosition,
    deleteTargetEvent,
  } = useInstrumentBrowser(trackId, targetEvent)

  const handleChangeRhythmTrack = useCallback(
    (state: CheckedState) => changeRhythmTrack(state === true),
    [changeRhythmTrack],
  )

  const categoryOptions = categoryIndices.map((i) => ({
    value: i,
    label: isRhythmTrack ? (
      <DrumKitCategoryName />
    ) : (
      <FancyCategoryName programNumber={i * 8} />
    ),
  }))

  const instrumentOptions = categoryInstruments.map((p) => ({
    value: p,
    label: (
      <InstrumentName
        {...(p === patch.programNumber ? patch : choosePatch(p))}
        isRhythmTrack={isRhythmTrack}
      />
    ),
  }))

  const bankMSBOptions = bankMSBs.map((bankMSB) => ({
    value: bankMSB,
    label: (
      <>
        <BankNumber>{bankMSB}</BankNumber>
        <InstrumentName
          {...(bankMSB === patch.bankMSB
            ? patch
            : choosePatch(patch.programNumber, bankMSB))}
          isRhythmTrack={isRhythmTrack}
        />
      </>
    ),
  }))

  const bankLSBOptions = bankLSBs.map((bankLSB) => ({
    value: bankLSB,
    label: (
      <>
        <BankNumber>{bankLSB}</BankNumber>
        <InstrumentName
          programNumber={patch.programNumber}
          bankMSB={patch.bankMSB}
          bankLSB={bankLSB}
          isRhythmTrack={isRhythmTrack}
        />
      </>
    ),
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
      <VisuallyHidden>
        <DialogTitle>
          <Localized name="select-instrument" />
        </DialogTitle>
      </VisuallyHidden>
      <DialogContent className="InstrumentBrowser">
        <Finder>
          <Left>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="categories" />
            </Label>
            <SelectBox
              items={categoryOptions}
              selectedValue={selectedCategoryIndex}
              onChange={selectCategory}
            />
          </Left>
          <Right>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="instruments" />
            </Label>
            <SelectBox
              items={instrumentOptions}
              selectedValue={patch.programNumber}
              onChange={selectInstrument}
            />
          </Right>
          {bankMSBOptions.length > 0 && (
            <Bank>
              <Label style={{ marginBottom: "0.5rem" }}>
                <Localized name="bank-msb" />
              </Label>
              <SelectBox
                items={bankMSBOptions}
                selectedValue={patch.bankMSB}
                onChange={selectBankMSB}
              />
            </Bank>
          )}
          {bankLSBOptions.length > 0 && (
            <Bank>
              <Label style={{ marginBottom: "0.5rem" }}>
                <Localized name="bank-lsb" />
              </Label>
              <SelectBox
                items={bankLSBOptions}
                selectedValue={patch.bankLSB}
                onChange={selectBankLSB}
              />
            </Bank>
          )}
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
