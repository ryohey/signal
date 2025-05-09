import {
  DialogProvider,
  ProgressProvider,
  PromptProvider,
  ToastProvider,
} from "dialog-hooks"
import React from "react"
import { HelmetProvider } from "react-helmet-async"
import { ActionDialog } from "../../components/Dialog/ActionDialog"
import { isRunningInElectron } from "../../helpers/platform"
import { AuthProvider } from "../../hooks/useAuth"
import { CloudFileProvider } from "../../hooks/useCloudFile"
import { ExportProvider } from "../../hooks/useExport"
import { HistoryProvider } from "../../hooks/useHistory"
import { RouterProvider } from "../../hooks/useRouter"
import { SettingProvider } from "../../hooks/useSettings"
import { StoreContext } from "../../hooks/useStores"
import RootStore from "../../stores/RootStore"
import { ThemeProvider } from "../../theme/ThemeProvider"
import { ProgressDialog } from "../Dialog/ProgressDialog"
import { PromptDialog } from "../Dialog/PromptDialog"
import { GlobalKeyboardShortcut } from "../KeyboardShortcut/GlobalKeyboardShortcut"
import { RootView } from "../RootView/RootView"
import { GlobalCSS } from "../Theme/GlobalCSS"
import { Toast } from "../ui/Toast"
import { ElectronCallbackHandler } from "./ElectronCallbackHandler"
import { LocalizationProvider } from "./LocalizationProvider"

const rootStore = new RootStore()

export function App() {
  return (
    <React.StrictMode>
      <StoreContext.Provider value={rootStore}>
        <SettingProvider>
          <ThemeProvider>
            <HelmetProvider>
              <ToastProvider component={Toast}>
                <PromptProvider component={PromptDialog}>
                  <DialogProvider component={ActionDialog}>
                    <ProgressProvider component={ProgressDialog}>
                      <LocalizationProvider>
                        <HistoryProvider>
                          <RouterProvider>
                            <ExportProvider>
                              <CloudFileProvider>
                                <AuthProvider>
                                  <GlobalKeyboardShortcut />
                                  <GlobalCSS />
                                  {isRunningInElectron() && (
                                    <ElectronCallbackHandler />
                                  )}
                                  <RootView />
                                </AuthProvider>
                              </CloudFileProvider>
                            </ExportProvider>
                          </RouterProvider>
                        </HistoryProvider>
                      </LocalizationProvider>
                    </ProgressProvider>
                  </DialogProvider>
                </PromptProvider>
              </ToastProvider>
            </HelmetProvider>
          </ThemeProvider>
        </SettingProvider>
      </StoreContext.Provider>
    </React.StrictMode>
  )
}
