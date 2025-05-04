import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { useSettings } from "../../hooks/useSettings"
import { useStores } from "../../hooks/useStores"
import {
  Language,
  Localized,
  useCurrentLanguage,
} from "../../localize/useLocalization"
import { themes, ThemeType } from "../../theme/Theme"
import { ThemeName } from "../../theme/ThemeName"
import { DialogContent, DialogTitle } from "../Dialog/Dialog"
import { Label } from "../ui/Label"
import { Select } from "../ui/Select"

interface LanguageItem {
  label: string
  language: Language
}

const LanguageSelect: FC = observer(() => {
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
})

const ThemeSelect: FC = observer(() => {
  const { themeStore } = useStores()
  const { themeType } = themeStore
  return (
    <Label>
      <Localized name="theme" />
      <Select
        value={themeType}
        onChange={(e) => (themeStore.themeType = e.target.value as ThemeType)}
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
})

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

export const GeneralSettingsView: FC = observer(() => {
  return (
    <>
      <DialogTitle>
        <Localized name="general" />
      </DialogTitle>
      <DialogContent>
        <Column>
          <LanguageSelect />
          <ThemeSelect />
        </Column>
      </DialogContent>
    </>
  )
})
