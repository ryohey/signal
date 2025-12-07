import type { FC } from "react"
import { Localized } from "../../localize/useLocalization"
import { categoryEmojis, getCategoryIndex } from "../../midi/GM"

const CategoryName: FC<{ programNumber: number }> = ({ programNumber }) => {
  switch (getCategoryIndex(programNumber)) {
    case 0:
      return <Localized name="Piano" />
    case 1:
      return <Localized name="Chromatic Percussion" />
    case 2:
      return <Localized name="Organ" />
    case 3:
      return <Localized name="Guitar" />
    case 4:
      return <Localized name="Bass" />
    case 5:
      return <Localized name="Strings" />
    case 6:
      return <Localized name="Ensemble" />
    case 7:
      return <Localized name="Brass" />
    case 8:
      return <Localized name="Reed" />
    case 9:
      return <Localized name="Pipe" />
    case 10:
      return <Localized name="Synth Lead" />
    case 11:
      return <Localized name="Synth Pad" />
    case 12:
      return <Localized name="Synth Effects" />
    case 13:
      return <Localized name="Ethnic" />
    case 14:
      return <Localized name="Percussive" />
    case 15:
      return <Localized name="Sound Effects" />
  }
  return <></>
}

export const FancyCategoryName: FC<{ programNumber: number }> = ({
  programNumber,
}) => {
  const emoji = categoryEmojis[getCategoryIndex(programNumber)]
  return (
    <>
      {emoji} <CategoryName programNumber={programNumber} />
    </>
  )
}

export const DrumKitCategoryName: FC = () => {
  return (
    <>
      🥁 <Localized name="Drum Kits" />
    </>
  )
}
