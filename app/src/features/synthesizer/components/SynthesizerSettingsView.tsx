import styled from "@emotion/styled"
import { type InterpolationType, InterpolationTypes } from "@signal-app/player"
import {
  Button,
  Checkbox,
  DialogContent,
  DialogSectionTitle,
  Label,
  Select,
  Slider,
  TextField,
} from "@signal-app/ui"
import type { FC } from "react"
import {
  type LocalizationKey,
  Localized,
} from "../../../localize/useLocalization"
import {
  maxGain,
  maxVoiceCap,
  type SynthesizerParameters,
  sampleRates,
} from "../../../services/synthesizerSettings"
import {
  useSynthesizerParameter,
  useSynthesizerSettings,
} from "../hooks/useSynthesizerSettings"

// sinc128 is left out because it is too slow for real time playback
const interpolationItems: {
  type: InterpolationType
  name: LocalizationKey
}[] = [
  { type: InterpolationTypes.nearestNeighbor, name: "interpolation-nearest" },
  { type: InterpolationTypes.linear, name: "interpolation-linear" },
  { type: InterpolationTypes.hermite, name: "interpolation-hermite" },
  { type: InterpolationTypes.sinc32, name: "interpolation-sinc" },
]

type GainKey = keyof Pick<
  SynthesizerParameters,
  "gain" | "reverbGain" | "chorusGain" | "gsDelayGain" | "xgVariationGain"
>
type SwitchKey = keyof Pick<
  SynthesizerParameters,
  "monophonicRetrigger" | "customVibrato" | "pitchBasedKeyShift"
>

const effectGains: { key: GainKey; name: LocalizationKey }[] = [
  { key: "reverbGain", name: "reverb" },
  { key: "chorusGain", name: "chorus" },
  { key: "gsDelayGain", name: "delay" },
  { key: "xgVariationGain", name: "variation" },
]

const switches: { key: SwitchKey; name: LocalizationKey }[] = [
  { key: "monophonicRetrigger", name: "monophonic-retrigger" },
  { key: "customVibrato", name: "custom-vibrato" },
  { key: "pitchBasedKeyShift", name: "pitch-based-key-shift" },
]

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SectionTitle = styled.div`
  font-weight: bold;
  margin-top: 0.5rem;
`

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const SliderValue = styled.span`
  min-width: 3rem;
  text-align: right;
  color: var(--color-text);
`

const SampleRateSelect: FC = () => {
  const { sampleRate, setSampleRate } = useSynthesizerSettings()
  return (
    <Label>
      <Localized name="sample-rate" />
      <Select
        value={sampleRate.chosen ?? "default"}
        onChange={(e) =>
          setSampleRate(
            e.target.value === "default" ? null : Number(e.target.value),
          )
        }
        style={{ marginTop: "0.5rem" }}
      >
        <option value="default">
          {/* The current rate is the device rate only when nothing is chosen */}
          <Localized name="sample-rate-default" />
          {sampleRate.chosen === null && ` (${sampleRate.current} Hz)`}
        </option>
        {sampleRates.map((rate) => (
          <option key={rate} value={rate}>
            {rate} Hz
          </option>
        ))}
      </Select>
    </Label>
  )
}

const InterpolationSelect: FC = () => {
  const { value, set } = useSynthesizerParameter("interpolationType")
  return (
    <Label>
      <Localized name="interpolation" />
      <Select
        value={value}
        onChange={(e) => set(Number(e.target.value) as InterpolationType)}
        style={{ marginTop: "0.5rem" }}
      >
        {interpolationItems.map((item) => (
          <option key={item.type} value={item.type}>
            <Localized name={item.name} />
          </option>
        ))}
      </Select>
    </Label>
  )
}

const VoiceCapField: FC = () => {
  const { value: voiceCap, set } = useSynthesizerParameter("voiceCap")
  return (
    <Label>
      <Localized name="voice-cap" />
      {/* Committed on blur so the field can be cleared while typing. The key
          resets it when the value changes elsewhere, like the reset button.
          Intentional: closing the dialog with Escape drops a typed value,
          since unmounting doesn't blur. Escape reads as cancel anyway */}
      <TextField
        key={voiceCap}
        type="number"
        min={1}
        max={maxVoiceCap}
        defaultValue={voiceCap}
        onBlur={(e) => {
          const value = Math.round(Number(e.currentTarget.value))
          const isValid = value >= 1 && value <= maxVoiceCap
          if (isValid) {
            set(value)
          }
          // Show what is actually used, the key alone doesn't reset the field
          // when the rounded value equals the current one
          e.currentTarget.value = (isValid ? value : voiceCap).toString()
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
          }
        }}
        style={{ marginTop: "0.5rem", width: "100%" }}
      />
    </Label>
  )
}

const GainSlider: FC<{ parameter: GainKey; name: LocalizationKey }> = ({
  parameter,
  name,
}) => {
  const { value, preview, save } = useSynthesizerParameter(parameter)
  const percent = Math.round(value * 100)
  return (
    <Label>
      <Localized name={name} />
      <SliderRow>
        <Slider
          value={percent}
          onChange={(value) => preview(value / 100)}
          onValueCommit={save}
          min={0}
          max={maxGain * 100}
          step={1}
        />
        <SliderValue>{percent}%</SliderValue>
      </SliderRow>
    </Label>
  )
}

const ParameterCheckbox: FC<{
  parameter: SwitchKey
  name: LocalizationKey
}> = ({ parameter, name }) => {
  const { value, set } = useSynthesizerParameter(parameter)
  return (
    <Checkbox
      checked={value}
      onCheckedChange={(checked) => set(checked === true)}
      label={<Localized name={name} />}
    />
  )
}

const ResetButton: FC = () => {
  const { resetParameters } = useSynthesizerSettings()
  return (
    <Button onClick={resetParameters} style={{ alignSelf: "flex-start" }}>
      <Localized name="reset" />
    </Button>
  )
}

export const SynthesizerSettingsView: FC = () => {
  return (
    <>
      <DialogSectionTitle>
        <Localized name="synthesizer" />
      </DialogSectionTitle>
      <DialogContent>
        <Column>
          <SampleRateSelect />
          <GainSlider parameter="gain" name="master-volume" />
          <InterpolationSelect />
          <VoiceCapField />
          <SectionTitle>
            <Localized name="effects" />
          </SectionTitle>
          {effectGains.map((item) => (
            <GainSlider key={item.key} parameter={item.key} name={item.name} />
          ))}
          <SectionTitle>
            <Localized name="behavior" />
          </SectionTitle>
          {switches.map((item) => (
            <ParameterCheckbox
              key={item.key}
              parameter={item.key}
              name={item.name}
            />
          ))}
          <ResetButton />
        </Column>
      </DialogContent>
    </>
  )
}
