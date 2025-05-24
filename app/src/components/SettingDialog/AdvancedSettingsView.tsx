import { FC } from "react"
import { useSettings } from "../../hooks/useSettings"
import { Localized } from "../../localize/useLocalization"
import { DialogContent, DialogTitle } from "../Dialog/Dialog"
import { Checkbox } from "../ui/Checkbox"

export const AdvancedSettingsView: FC = () => {
  const { showNoteLabels, setShowNoteLabels } = useSettings()
  return (
    <>
      <DialogTitle>
        <Localized name="advanced" />
      </DialogTitle>
      <DialogContent>
        <Checkbox
          checked={showNoteLabels}
          onCheckedChange={setShowNoteLabels}
          label={<Localized name="show-note-labels" />}
        />
      </DialogContent>
    </>
  )
}
