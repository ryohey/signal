import {
  DEFAULT_GLOBAL_SYSTEM_PARAMETERS,
  type GlobalSystemParameter,
  InterpolationTypes,
} from "@signal-app/player"

export type SynthesizerParameters = Pick<
  GlobalSystemParameter,
  | "gain"
  | "interpolationType"
  | "voiceCap"
  | "reverbGain"
  | "chorusGain"
  | "gsDelayGain"
  | "xgVariationGain"
  | "monophonicRetrigger"
  | "customVibrato"
  | "pitchBasedKeyShift"
>

export const defaultSynthesizerParameters: SynthesizerParameters = {
  gain: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.gain,
  interpolationType: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.interpolationType,
  voiceCap: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.voiceCap,
  reverbGain: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.reverbGain,
  chorusGain: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.chorusGain,
  gsDelayGain: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.gsDelayGain,
  xgVariationGain: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.xgVariationGain,
  monophonicRetrigger: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.monophonicRetrigger,
  customVibrato: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.customVibrato,
  pitchBasedKeyShift: DEFAULT_GLOBAL_SYSTEM_PARAMETERS.pitchBasedKeyShift,
}

// The rates offered in the settings. Anything else in storage is ignored, so
// the menu always shows the rate in use.
export const sampleRates = [22050, 32000, 44100, 48000, 88200, 96000]

// Each voice allocates memory up front, so keep this from going wild
export const maxVoiceCap = 4096
// For the master volume and the effect levels, 2 is 200%
export const maxGain = 2

const isValidParameter = (key: keyof SynthesizerParameters, value: unknown) => {
  switch (key) {
    case "voiceCap":
      return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= maxVoiceCap
      )
    case "interpolationType":
      // sinc128 is too slow for real time, the menu doesn't offer it either
      return (
        Object.values<unknown>(InterpolationTypes).includes(value) &&
        value !== InterpolationTypes.sinc128
      )
    case "monophonicRetrigger":
    case "customVibrato":
    case "pitchBasedKeyShift":
      return typeof value === "boolean"
    default:
      return typeof value === "number" && value >= 0 && value <= maxGain
  }
}

const PARAMETERS_KEY = "SynthesizerParameters"
const SAMPLE_RATE_KEY = "SynthesizerSampleRate"

export const loadSynthesizerParameters = () => {
  const parameters = { ...defaultSynthesizerParameters }
  try {
    const data = localStorage.getItem(PARAMETERS_KEY)
    if (data === null) {
      return parameters
    }
    const stored = JSON.parse(data) as Record<string, unknown>
    // Only take known keys with sane values, so a broken or outdated entry
    // can't send garbage to the synth. Anything else keeps the default.
    for (const key of Object.keys(
      parameters,
    ) as (keyof SynthesizerParameters)[]) {
      if (isValidParameter(key, stored[key])) {
        Object.assign(parameters, { [key]: stored[key] })
      }
    }
  } catch {
    // Unreadable data, keep the defaults
  }
  return parameters
}

export const saveSynthesizerParameters = (
  parameters: SynthesizerParameters,
) => {
  try {
    localStorage.setItem(PARAMETERS_KEY, JSON.stringify(parameters))
  } catch (e) {
    // The settings still apply for this session, so a full or blocked
    // storage shouldn't break the controls
    console.warn("Failed to save synthesizer parameters", e)
  }
}

/**
 * The stored sample rate, or null to let the browser pick the device rate.
 */
export const loadSampleRate = () => {
  try {
    const value = Number(localStorage.getItem(SAMPLE_RATE_KEY))
    return sampleRates.includes(value) ? value : null
  } catch {
    return null
  }
}

/**
 * Returns false when storage is full or blocked.
 */
export const saveSampleRate = (sampleRate: number | null) => {
  try {
    if (sampleRate === null) {
      localStorage.removeItem(SAMPLE_RATE_KEY)
    } else {
      localStorage.setItem(SAMPLE_RATE_KEY, sampleRate.toString())
    }
    return true
  } catch (e) {
    console.warn("Failed to save sample rate", e)
    return false
  }
}
