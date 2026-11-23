import type { GlobalSystemParameter } from "spessasynth_core"
import type { WorkletSynthesizer } from "spessasynth_lib"

export type { GlobalSystemParameter, InterpolationType } from "spessasynth_core"
export {
  DEFAULT_GLOBAL_SYSTEM_PARAMETERS,
  InterpolationTypes,
} from "spessasynth_core"

/**
 * Sends every defined parameter to the synthesizer.
 */
export const applySystemParameters = (
  synth: WorkletSynthesizer,
  parameters: Partial<GlobalSystemParameter>,
) => {
  for (const key of Object.keys(
    parameters,
  ) as (keyof GlobalSystemParameter)[]) {
    const value = parameters[key]
    if (value !== undefined) {
      synth.setSystemParameter(key, value)
    }
  }
}
