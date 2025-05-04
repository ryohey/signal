import { observer } from "mobx-react-lite"
import { FC, PropsWithChildren } from "react"
import { useSettings } from "../../hooks/useSettings"
import { LocalizationContext } from "../../localize/useLocalization"

export const LocalizationProvider: FC<PropsWithChildren> = observer(
  ({ children }) => {
    const { language } = useSettings()
    return (
      <LocalizationContext.Provider value={{ language }}>
        {children}
      </LocalizationContext.Provider>
    )
  },
)
