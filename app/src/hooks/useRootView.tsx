import { makeObservable, observable } from "mobx"
import { createContext, useCallback, useContext, useMemo } from "react"
import { TrackEvent } from "../track"
import { useMobxSelector } from "./useMobxSelector"

class RootViewStore {
  openHelp = false
  eventEditorEvents: TrackEvent[] = []
  openSignInDialog = false
  openCloudFileDialog = false
  openSettingDialog = false
  openControlSettingDialog = false
  initializeError: Error | null = null
  openInitializeErrorDialog = false
  openPublishDialog = false
  openUserSettingsDialog = false
  openDeleteAccountDialog = false

  constructor() {
    makeObservable(this, {
      openHelp: observable,
      eventEditorEvents: observable.shallow,
      openSignInDialog: observable,
      openCloudFileDialog: observable,
      openSettingDialog: observable,
      openControlSettingDialog: observable,
      initializeError: observable,
      openInitializeErrorDialog: observable,
      openPublishDialog: observable,
      openUserSettingsDialog: observable,
      openDeleteAccountDialog: observable,
    })
  }
}

const RootViewStoreContext = createContext<RootViewStore>(null!)

export function RootViewProvider({ children }: { children: React.ReactNode }) {
  const rootViewStore = useMemo(() => new RootViewStore(), [])

  return (
    <RootViewStoreContext.Provider value={rootViewStore}>
      {children}
    </RootViewStoreContext.Provider>
  )
}

export function useRootView() {
  const rootViewStore = useContext(RootViewStoreContext)

  return {
    get openHelpDialog() {
      return useMobxSelector(() => rootViewStore.openHelp, [rootViewStore])
    },
    get eventEditorEvents() {
      return useMobxSelector(
        () => rootViewStore.eventEditorEvents,
        [rootViewStore],
      )
    },
    get openSignInDialog() {
      return useMobxSelector(
        () => rootViewStore.openSignInDialog,
        [rootViewStore],
      )
    },
    get openCloudFileDialog() {
      return useMobxSelector(
        () => rootViewStore.openCloudFileDialog,
        [rootViewStore],
      )
    },
    get openSettingDialog() {
      return useMobxSelector(
        () => rootViewStore.openSettingDialog,
        [rootViewStore],
      )
    },
    get openControlSettingDialog() {
      return useMobxSelector(
        () => rootViewStore.openControlSettingDialog,
        [rootViewStore],
      )
    },
    get initializeError() {
      return useMobxSelector(
        () => rootViewStore.initializeError,
        [rootViewStore],
      )
    },
    get openInitializeErrorDialog() {
      return useMobxSelector(
        () => rootViewStore.openInitializeErrorDialog,
        [rootViewStore],
      )
    },
    get openPublishDialog() {
      return useMobxSelector(
        () => rootViewStore.openPublishDialog,
        [rootViewStore],
      )
    },
    get openUserSettingsDialog() {
      return useMobxSelector(
        () => rootViewStore.openUserSettingsDialog,
        [rootViewStore],
      )
    },
    get openDeleteAccountDialog() {
      return useMobxSelector(
        () => rootViewStore.openDeleteAccountDialog,
        [rootViewStore],
      )
    },
    setOpenHelpDialog: useCallback(
      (open: boolean) => (rootViewStore.openHelp = open),
      [rootViewStore],
    ),
    setEventEditorEvents: useCallback(
      (events: TrackEvent[]) => (rootViewStore.eventEditorEvents = events),
      [rootViewStore],
    ),
    setOpenSignInDialog: useCallback(
      (open: boolean) => (rootViewStore.openSignInDialog = open),
      [rootViewStore],
    ),
    setOpenCloudFileDialog: useCallback(
      (open: boolean) => (rootViewStore.openCloudFileDialog = open),
      [rootViewStore],
    ),
    setOpenSettingDialog: useCallback(
      (open: boolean) => (rootViewStore.openSettingDialog = open),
      [rootViewStore],
    ),
    setOpenControlSettingDialog: useCallback(
      (open: boolean) => (rootViewStore.openControlSettingDialog = open),
      [rootViewStore],
    ),
    setInitializeError: useCallback(
      (error: Error | null) => (rootViewStore.initializeError = error),
      [rootViewStore],
    ),
    setOpenInitializeErrorDialog: useCallback(
      (open: boolean) => (rootViewStore.openInitializeErrorDialog = open),
      [rootViewStore],
    ),
    setOpenPublishDialog: useCallback(
      (open: boolean) => (rootViewStore.openPublishDialog = open),
      [rootViewStore],
    ),
    setOpenUserSettingsDialog: useCallback(
      (open: boolean) => (rootViewStore.openUserSettingsDialog = open),
      [rootViewStore],
    ),
    setOpenDeleteAccountDialog: useCallback(
      (open: boolean) => (rootViewStore.openDeleteAccountDialog = open),
      [rootViewStore],
    ),
  }
}
