import { atom, useAtomValue, useSetAtom } from "jotai"

export function useRootView() {
  return {
    get openHelpDialog() {
      return useAtomValue(openHelpAtom)
    },
    get openSignInDialog() {
      return useAtomValue(openSignInDialogAtom)
    },
    get openCloudFileDialog() {
      return useAtomValue(openCloudFileDialogAtom)
    },
    get openSettingDialog() {
      return useAtomValue(openSettingDialogAtom)
    },
    get openControlSettingDialog() {
      return useAtomValue(openControlSettingDialogAtom)
    },
    get initializeError() {
      return useAtomValue(initializeErrorAtom)
    },
    get openInitializeErrorDialog() {
      return useAtomValue(openInitializeErrorDialogAtom)
    },
    get openPublishDialog() {
      return useAtomValue(openPublishDialogAtom)
    },
    get openUserSettingsDialog() {
      return useAtomValue(openUserSettingsDialogAtom)
    },
    get openDeleteAccountDialog() {
      return useAtomValue(openDeleteAccountDialogAtom)
    },
    setOpenHelpDialog: useSetAtom(openHelpAtom),
    setOpenSignInDialog: useSetAtom(openSignInDialogAtom),
    setOpenCloudFileDialog: useSetAtom(openCloudFileDialogAtom),
    setOpenSettingDialog: useSetAtom(openSettingDialogAtom),
    setOpenControlSettingDialog: useSetAtom(openControlSettingDialogAtom),
    setInitializeError: useSetAtom(initializeErrorAtom),
    setOpenInitializeErrorDialog: useSetAtom(openInitializeErrorDialogAtom),
    setOpenPublishDialog: useSetAtom(openPublishDialogAtom),
    setOpenUserSettingsDialog: useSetAtom(openUserSettingsDialogAtom),
    setOpenDeleteAccountDialog: useSetAtom(openDeleteAccountDialogAtom),
  }
}

// atoms
const openHelpAtom = atom<boolean>(false)
const openSignInDialogAtom = atom<boolean>(false)
const openCloudFileDialogAtom = atom<boolean>(false)
const openSettingDialogAtom = atom<boolean>(false)
const openControlSettingDialogAtom = atom<boolean>(false)
const initializeErrorAtom = atom<Error | null>(null)
const openInitializeErrorDialogAtom = atom<boolean>(false)
const openPublishDialogAtom = atom<boolean>(false)
const openUserSettingsDialogAtom = atom<boolean>(false)
const openDeleteAccountDialogAtom = atom<boolean>(false)
