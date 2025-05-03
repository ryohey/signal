import styled from "@emotion/styled"
import { CheckedState } from "@radix-ui/react-checkbox"
import { FC } from "react"
import { useInstrumentBrowser } from "../../hooks/useInstrumentBrowser"
import { Localized } from "../../localize/useLocalization"
import { getCategoryIndex } from "../../midi/GM"
import { Dialog, DialogActions, DialogContent } from "../Dialog/Dialog"
import { FancyCategoryName } from "../TrackList/CategoryName"
import { InstrumentName } from "../TrackList/InstrumentName"
import { Button, PrimaryButton } from "../ui/Button"
import { Checkbox } from "../ui/Checkbox"
import { Label } from "../ui/Label"
import { SelectBox } from "./SelectBox"

export interface InstrumentSetting {
  readonly programNumber: number
  readonly isRhythmTrack: boolean
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

export const InstrumentBrowser: FC = () => {
  const {
    isOpen,
    setOpen,
    setting: { programNumber, isRhythmTrack },
    setSetting,
    onChangeInstrument: onChange,
    onClickOK,
  } = useInstrumentBrowser()

  const { presetCategories } = useInstrumentBrowser()
  const selectedCategoryId = getCategoryIndex(programNumber)

  const onChangeRhythmTrack = (state: CheckedState) => {
    setSetting({ programNumber, isRhythmTrack: state === true })
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
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="InstrumentBrowser">
        <Finder className={isRhythmTrack ? "disabled" : ""}>
          <Left>
            <Label style={{ marginBottom: "0.5rem" }}>
              <Localized name="categories" />
            </Label>
            <SelectBox
              items={categoryOptions}
              selectedValue={selectedCategoryId}
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
            onCheckedChange={onChangeRhythmTrack}
            label={<Localized name="rhythm-track" />}
          />
        </Footer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>
          <Localized name="cancel" />
        </Button>
        <PrimaryButton onClick={onClickOK}>
          <Localized name="ok" />
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  )
}
