import {
  DialogProvider,
  ProgressProvider,
  PromptProvider,
  ToastProvider,
} from "dialog-hooks"
import React from "react"
import { HelmetProvider } from "react-helmet-async"
import { ActionDialog } from "../../components/Dialog/ActionDialog"
import { ArrangeViewProvider } from "../../features/arrange/hooks/useArrangeView"
import { PianoRollProvider } from "../../features/piano-roll/hooks/usePianoRoll"
import { TempoEditorProvider } from "../../features/tempo-editor/hooks/useTempoEditor"
import { isRunningInElectron } from "../../helpers/platform"
import { AuthProvider } from "../../hooks/useAuth"
import { MIDIDeviceProvider } from "../../hooks/useMIDIDevice"
import { StoreContext } from "../../hooks/useStores"
import { TrackMuteProvider } from "../../hooks/useTrackMute"
import RootStore from "../../stores/RootStore"
import { ThemeProvider } from "../../theme/ThemeProvider"
import { ProgressDialog } from "../Dialog/ProgressDialog"
import { PromptDialog } from "../Dialog/PromptDialog"
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
        <ThemeProvider>
          <HelmetProvider>
            <ToastProvider component={Toast}>
              <PromptProvider component={PromptDialog}>
                <DialogProvider component={ActionDialog}>
                  <ProgressProvider component={ProgressDialog}>
                    <LocalizationProvider>
                      <AuthProvider>
                        <MIDIDeviceProvider>
                          <TrackMuteProvider>
                            <PianoRollProvider>
                              <ArrangeViewProvider>
                                <TempoEditorProvider>
                                  <GlobalCSS />
                                  {isRunningInElectron() && (
                                    <ElectronCallbackHandler />
                                  )}
                                  <RootView />
                                </TempoEditorProvider>
                              </ArrangeViewProvider>
                            </PianoRollProvider>
                          </TrackMuteProvider>
                        </MIDIDeviceProvider>
                      </AuthProvider>
                    </LocalizationProvider>
                  </ProgressProvider>
                </DialogProvider>
              </PromptProvider>
            </ToastProvider>
          </HelmetProvider>
        </ThemeProvider>
      </StoreContext.Provider>
    </React.StrictMode>
  )
}
