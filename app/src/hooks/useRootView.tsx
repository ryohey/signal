import { makeObservable, observable } from "mobx"
import { createContext, useContext, useMemo } from "react"
import { TrackEvent } from "../track"
import { useMobxGetter, useMobxSetter } from "./useMobxSelector"

class RootViewStore {
  openFileDrawer = false
  openEditDrawer = false
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
      openFileDrawer: observable,
      openEditDrawer: observable,
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
    get openFileDrawer() {
      return useMobxGetter(rootViewStore, "openFileDrawer")
    },
    get openEditDrawer() {
      return useMobxGetter(rootViewStore, "openEditDrawer")
    },
    get openHelpDialog() {
      return useMobxGetter(rootViewStore, "openHelp")
    },
    get eventEditorEvents() {
      return useMobxGetter(rootViewStore, "eventEditorEvents")
    },
    get openSignInDialog() {
      return useMobxGetter(rootViewStore, "openSignInDialog")
    },
    get openCloudFileDialog() {
      return useMobxGetter(rootViewStore, "openCloudFileDialog")
    },
    get openSettingDialog() {
      return useMobxGetter(rootViewStore, "openSettingDialog")
    },
    get openControlSettingDialog() {
      return useMobxGetter(rootViewStore, "openControlSettingDialog")
    },
    get initializeError() {
      return useMobxGetter(rootViewStore, "initializeError")
    },
    get openInitializeErrorDialog() {
      return useMobxGetter(rootViewStore, "openInitializeErrorDialog")
    },
    get openPublishDialog() {
      return useMobxGetter(rootViewStore, "openPublishDialog")
    },
    get openUserSettingsDialog() {
      return useMobxGetter(rootViewStore, "openUserSettingsDialog")
    },
    get openDeleteAccountDialog() {
      return useMobxGetter(rootViewStore, "openDeleteAccountDialog")
    },
    setOpenFileDrawer: useMobxSetter(rootViewStore, "openFileDrawer"),
    setOpenEditDrawer: useMobxSetter(rootViewStore, "openEditDrawer"),
    setOpenHelpDialog: useMobxSetter(rootViewStore, "openHelp"),
    setEventEditorEvents: useMobxSetter(rootViewStore, "eventEditorEvents"),
    setOpenSignInDialog: useMobxSetter(rootViewStore, "openSignInDialog"),
    setOpenCloudFileDialog: useMobxSetter(rootViewStore, "openCloudFileDialog"),
    setOpenSettingDialog: useMobxSetter(rootViewStore, "openSettingDialog"),
    setOpenControlSettingDialog: useMobxSetter(
      rootViewStore,
      "openControlSettingDialog",
    ),
    setInitializeError: useMobxSetter(rootViewStore, "initializeError"),
    setOpenInitializeErrorDialog: useMobxSetter(
      rootViewStore,
      "openInitializeErrorDialog",
    ),
    setOpenPublishDialog: useMobxSetter(rootViewStore, "openPublishDialog"),
    setOpenUserSettingsDialog: useMobxSetter(
      rootViewStore,
      "openUserSettingsDialog",
    ),
    setOpenDeleteAccountDialog: useMobxSetter(
      rootViewStore,
      "openDeleteAccountDialog",
    ),
  }
}
