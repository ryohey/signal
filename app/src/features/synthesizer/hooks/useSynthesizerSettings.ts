import type { SoundFontSynth } from "@signal-app/player"
import { useDialog } from "dialog-hooks"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { useCallback, useMemo } from "react"
import { reloadPage } from "../../../helpers/reloadPage"
import { useStores } from "../../../hooks/useStores"
import { useLocalization } from "../../../localize/useLocalization"
import {
  defaultSynthesizerParameters,
  loadSynthesizerParameters,
  type SynthesizerParameters,
  saveSampleRate,
  saveSynthesizerParameters,
} from "../../../services/synthesizerSettings"

/**
 * One parameter, so dragging a slider only re-renders that control.
 */
export function useSynthesizerParameter<K extends keyof SynthesizerParameters>(
  key: K,
) {
  const { synth } = useStores()
  const applyParameters = useSetAtom(applyParametersAtom)
  const value = useAtomValue(
    useMemo(() => selectAtom(parametersAtom, (p) => p[key]), [key]),
  )

  return {
    value,
    // Applies right away without saving, for values that change continuously
    preview: useCallback(
      (value: SynthesizerParameters[K]) =>
        applyParameters(synth, { [key]: value }, false),
      [applyParameters, synth, key],
    ),
    save: useCallback(
      () => applyParameters(synth, {}, true),
      [applyParameters, synth],
    ),
    set: useCallback(
      (value: SynthesizerParameters[K]) =>
        applyParameters(synth, { [key]: value }, true),
      [applyParameters, synth, key],
    ),
  }
}

export function useSynthesizerSettings() {
  const rootStore = useStores()
  const dialog = useDialog()
  const localized = useLocalization()
  const applyParameters = useSetAtom(applyParametersAtom)

  return {
    // Both only change with a reload, so there is nothing to subscribe to
    sampleRate: {
      chosen: rootStore.sampleRate,
      current: rootStore.synth.sampleRate,
    },
    setSampleRate: useCallback(
      async (sampleRate: number | null) => {
        const res = await dialog.show({
          title: localized["sample-rate-reload-title"],
          message: localized["sample-rate-reload-notice"],
          actions: [
            { title: localized["reload"], key: "reload" },
            { title: localized["cancel"], key: "cancel" },
          ],
        })
        if (res !== "reload") {
          return
        }
        if (!saveSampleRate(sampleRate)) {
          // Reloading would just come back with the old rate
          await dialog.show({
            title: localized["sample-rate"],
            message: localized["sample-rate-save-failed"],
            actions: [{ title: localized["ok"], key: "ok" }],
          })
          return
        }
        // This closes the open song. A running AudioContext can't
        // change its rate and the synth state can't be moved to a new one, so
        // the warning above lists what gets lost instead. The usual autosave
        // restore may still offer a copy up to 10 seconds old afterwards, the
        // same as after any reload, and the warning describes the worst case.
        reloadPage()
      },
      [dialog, localized],
    ),
    resetParameters: useCallback(
      () =>
        applyParameters(rootStore.synth, defaultSynthesizerParameters, true),
      [applyParameters, rootStore],
    ),
  }
}

const parametersAtom = atom(loadSynthesizerParameters())

const applyParametersAtom = atom(
  null,
  (
    get,
    set,
    synth: SoundFontSynth,
    parameters: Partial<SynthesizerParameters>,
    persist: boolean,
  ) => {
    const newParameters = { ...get(parametersAtom), ...parameters }
    set(parametersAtom, newParameters)
    synth.setSystemParameters(parameters)
    if (persist) {
      saveSynthesizerParameters(newParameters)
    }
  },
)
