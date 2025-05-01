import { useCallback } from "react"
import { TrackEvent } from "../track"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useRootView() {
  const { rootViewStore } = useStores()

  return {
    get openFileDrawer() {
      return useMobxStore(({ rootViewStore }) => rootViewStore.openFileDrawer)
    },
    get openEditDrawer() {
      return useMobxStore(({ rootViewStore }) => rootViewStore.openEditDrawer)
    },
    get openHelpDialog() {
      return useMobxStore(({ rootViewStore }) => rootViewStore.openHelp)
    },
    get eventEditorEvents() {
      return useMobxStore(
        ({ rootViewStore }) => rootViewStore.eventEditorEvents,
      )
    },
    get openSignInDialog() {
      return useMobxStore(({ rootViewStore }) => rootViewStore.openSignInDialog)
    },
    get openCloudFileDialog() {
      return useMobxStore(
        ({ rootViewStore }) => rootViewStore.openCloudFileDialog,
      )
    },
    get openSettingDialog() {
      return useMobxStore(
        ({ rootViewStore }) => rootViewStore.openSettingDialog,
      )
    },
    get openControlSettingDialog() {
      return useMobxStore(
        ({ rootViewStore }) => rootViewStore.openControlSettingDialog,
      )
    },
    get initializeError() {
      return useMobxStore(({ rootViewStore }) => rootViewStore.initializeError)
    },
    get openInitializeErrorDialog() {
      return useMobxStore(
        ({ rootViewStore }) => rootViewStore.openInitializeErrorDialog,
      )
    },
    get openPublishDialog() {
      return useMobxStore(
        ({ rootViewStore }) => rootViewStore.openPublishDialog,
      )
    },
    get openUserSettingsDialog() {
      return useMobxStore(
        ({ rootViewStore }) => rootViewStore.openUserSettingsDialog,
      )
    },
    get openDeleteAccountDialog() {
      return useMobxStore(
        ({ rootViewStore }) => rootViewStore.openDeleteAccountDialog,
      )
    },
    setOpenFileDrawer: useCallback(
      (open: boolean) => (rootViewStore.openFileDrawer = open),
      [rootViewStore],
    ),
    setOpenEditDrawer: useCallback(
      (open: boolean) => (rootViewStore.openEditDrawer = open),
      [rootViewStore],
    ),
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
