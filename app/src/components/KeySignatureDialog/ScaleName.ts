import type { FC } from "react"
import type { Scale } from "../../entities/scale/Scale"
import { useLocalization } from "../../localize/useLocalization"

export const ScaleName: FC<{ scale: Scale }> = ({ scale }) => {
  const localized = useLocalization()
  switch (scale) {
    case "major":
      return localized["scale-major"]
    case "minor":
      return localized["scale-minor"]
    case "harmonicMinor":
      return localized["scale-harmonic-minor"]
    case "harmonicMajor":
      return localized["scale-harmonic-major"]
    case "melodicMinor":
      return localized["scale-melodic-minor"]
    case "ionian":
      return localized["scale-ionian"]
    case "dorian":
      return localized["scale-dorian"]
    case "phrygian":
      return localized["scale-phrygian"]
    case "lydian":
      return localized["scale-lydian"]
    case "mixolydian":
      return localized["scale-mixolydian"]
    case "aeolian":
      return localized["scale-aeolian"]
    case "locrian":
      return localized["scale-locrian"]
    case "majorPentatonic":
      return localized["scale-major-pentatonic"]
    case "minorPentatonic":
      return localized["scale-minor-pentatonic"]
    case "majorBlues":
      return localized["scale-major-blues"]
    case "minorBlues":
      return localized["scale-minor-blues"]
    case "halfWholeDiminished":
      return localized["scale-half-whole-diminished"]
    case "wholeHalfDiminished":
      return localized["scale-whole-half-diminished"]
    case "wholeTone":
      return localized["scale-whole-tone"]
  }
}
