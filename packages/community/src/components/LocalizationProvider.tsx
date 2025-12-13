import { observer } from "mobx-react-lite"
import type { FC, PropsWithChildren } from "react"
import { LocalizationContext } from "../localize/useLocalization.js"

export const LocalizationProvider: FC<PropsWithChildren> = observer(
  ({ children }) => {
    return (
      <LocalizationContext.Provider
        value={{
          language: null, // Use the browser's language
        }}
      >
        {children}
      </LocalizationContext.Provider>
    )
  }
)
