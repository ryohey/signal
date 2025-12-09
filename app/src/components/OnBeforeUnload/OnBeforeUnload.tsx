import { useEffect } from "react"
import { isRunningInElectron } from "../../helpers/platform"
import { useSong } from "../../hooks/useSong"
import { useLocalization } from "../../localize/useLocalization"

export const OnBeforeUnload = () => {
  const { getSong } = useSong()
  const localized = useLocalization()

  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (!getSong().isSaved) {
        const message = localized["confirm-close"]
        if (isRunningInElectron()) {
          // do not close the window immediately
          e.returnValue = false
          e.preventDefault()
          window.electronAPI
            .showMessageBox({
              type: "question",
              message,
              buttons: [localized.close, localized.cancel],
            })
            .then((button) => {
              if (button === 0) {
                window.electronAPI.closeMainWindow()
              }
            })
        } else {
          e.returnValue = message
        }
      }
    }
    window.addEventListener("beforeunload", listener)

    return () => {
      window.removeEventListener("beforeunload", listener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <></>
}
