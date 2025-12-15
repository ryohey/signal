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
import { ArrangeViewProvider } from "../../hooks/useArrangeView"
import { AuthProvider } from "../../hooks/useAuth"
import { PianoRollProvider } from "../../hooks/usePianoRoll"
import { StoreContext } from "../../hooks/useStores"
import { TempoEditorProvider } from "../../hooks/useTempoEditor"
import { AudioImportProvider } from "../../providers/AudioImportProvider"
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

// Expose reverb controls for testing (type in browser console)
// Usage: window.setReverb(0.3) for 30% wet, window.setReverb(0) for dry
declare global {
  interface Window {
    setReverb: (mix: number) => void
    getReverb: () => number
  }
}
window.setReverb = (mix: number) => {
  rootStore.synth.setReverbMix(mix)
  console.log(`Reverb set to ${Math.round(mix * 100)}% wet`)
}
window.getReverb = () => rootStore.synth.reverbMix

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
                        <PianoRollProvider>
                          <ArrangeViewProvider>
                            <TempoEditorProvider>
                              <AudioImportProvider>
                                <GlobalCSS />
                                {isRunningInElectron() && (
                                  <ElectronCallbackHandler />
                                )}
                                <RootView />
                              </AudioImportProvider>
                            </TempoEditorProvider>
                          </ArrangeViewProvider>
                        </PianoRollProvider>
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
