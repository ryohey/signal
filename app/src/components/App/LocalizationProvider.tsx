import { FC, PropsWithChildren } from "react"
import { useSettings } from "../../features/setting/hooks/useSettings"
import { LocalizationContext } from "../../localize/useLocalization"

export const LocalizationProvider: FC<PropsWithChildren> = ({ children }) => {
  const { language } = useSettings()
  return (
    <LocalizationContext.Provider value={{ language }}>
      {children}
    </LocalizationContext.Provider>
  )
}
