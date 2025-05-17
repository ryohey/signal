import styled from "@emotion/styled"
import { FC } from "react"
import { useInstrumentBrowser } from "../../hooks/useInstrumentBrowser"
import { Localized } from "../../localize/useLocalization"
import { Dialog, DialogActions, DialogContent } from "../Dialog/Dialog"
import { InstrumentName } from "../TrackList/InstrumentName"
import { Button, PrimaryButton } from "../ui/Button"
import { Checkbox } from "../ui/Checkbox"
import { Label } from "../ui/Label"
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

export const InstrumentBrowser: FC = () => {
  const {
    isOpen,
    setOpen,
    setting: { programNumber, isRhythmTrack },
    selectedCategoryIndex,
    categoryFirstProgramEvents,
    categoryInstruments,
    onChangeInstrument: onChange,
    onClickOK,
    onChangeRhythmTrack,
  } = useInstrumentBrowser()

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

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
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
            onCheckedChange={(state) => onChangeRhythmTrack(state === true)}
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
