import styled from "@emotion/styled"
import { FC } from "react"
import { useSettings } from "../../hooks/useSettings"
import {
  Language,
  Localized,
  useCurrentLanguage,
} from "../../localize/useLocalization"
import { themes, ThemeType } from "../../theme/Theme"
import { ThemeName } from "../../theme/ThemeName"
import { DialogContent, DialogTitle } from "../Dialog/Dialog"
import { Checkbox } from "../ui/Checkbox"
import { Label } from "../ui/Label"
import { Select } from "../ui/Select"

interface LanguageItem {
  label: string
  language: Language
}

const LanguageSelect: FC = () => {
  const { language, setLanguage } = useSettings()
  const currentLanguage = useCurrentLanguage()
  const items: LanguageItem[] = [
    { label: "English", language: "en" },
    { label: "French", language: "fr" },
    { label: "Japanese", language: "ja" },
    { label: "Chinese (Simplified)", language: "zh-Hans" },
    { label: "Chinese (Traditional)", language: "zh-Hant" },
  ]
  return (
    <Label>
      <Localized name="language" />
      <Select
        value={language ?? currentLanguage}
        onChange={(e) => setLanguage(e.target.value as Language)}
        style={{ marginTop: "0.5rem" }}
      >
        {items.map((item) => (
          <option key={item.language} value={item.language}>
            {item.label}
          </option>
        ))}
      </Select>
    </Label>
  )
}

const ThemeSelect: FC = () => {
  const { themeType, setThemeType } = useSettings()
  return (
    <Label>
      <Localized name="theme" />
      <Select
        value={themeType}
        onChange={(e) => setThemeType(e.target.value as ThemeType)}
        style={{ marginTop: "0.5rem" }}
      >
        {Object.keys(themes).map((themeType) => (
          <option key={themeType} value={themeType}>
            <ThemeName themeType={themeType as ThemeType} />
          </option>
        ))}
      </Select>
    </Label>
  )
}

const ShowNoteLabelCheckbox: FC = () => {
  const { showNoteLabels, setShowNoteLabels } = useSettings()

  return (
    <Checkbox
      checked={showNoteLabels}
      onCheckedChange={setShowNoteLabels}
      label={<Localized name="show-note-labels" />}
    />
  )
}

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SectionTitle = styled.div`
  font-weight: bold;
  margin: 1rem 0;
`

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
`

export const GeneralSettingsView: FC = () => {
  return (
    <>
      <DialogTitle>
        <Localized name="general" />
      </DialogTitle>
      <DialogContent>
        <Column>
          <LanguageSelect />
          <ThemeSelect />
          <SectionContent>
            <SectionTitle>
              <Localized name="appearance" />
            </SectionTitle>
            <ShowNoteLabelCheckbox />
          </SectionContent>
        </Column>
      </DialogContent>
    </>
  )
}
