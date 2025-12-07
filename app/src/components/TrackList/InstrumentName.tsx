import type { FC } from "react"
import { Localized } from "../../localize/useLocalization"

const NormalInstrumentName: FC<{ programNumber: number | undefined }> = ({
  programNumber,
}) => {
  switch (programNumber) {
    case 0:
      return <Localized name="Acoustic Grand Piano" />
    case 1:
      return <Localized name="Bright Acoustic Piano" />
    case 2:
      return <Localized name="Electric Grand Piano" />
    case 3:
      return <Localized name="Honky-tonk Piano" />
    case 4:
      return <Localized name="Electric Piano 1" />
    case 5:
      return <Localized name="Electric Piano 2" />
    case 6:
      return <Localized name="Harpsichord" />
    case 7:
      return <Localized name="Clavinet" />
    case 8:
      return <Localized name="Celesta" />
    case 9:
      return <Localized name="Glockenspiel" />
    case 10:
      return <Localized name="Music Box" />
    case 11:
      return <Localized name="Vibraphone" />
    case 12:
      return <Localized name="Marimba" />
    case 13:
      return <Localized name="Xylophone" />
    case 14:
      return <Localized name="Tubular Bells" />
    case 15:
      return <Localized name="Dulcimer" />
    case 16:
      return <Localized name="Drawbar Organ" />
    case 17:
      return <Localized name="Percussive Organ" />
    case 18:
      return <Localized name="Rock Organ" />
    case 19:
      return <Localized name="Church Organ" />
    case 20:
      return <Localized name="Reed Organ" />
    case 21:
      return <Localized name="Accordion" />
    case 22:
      return <Localized name="Harmonica" />
    case 23:
      return <Localized name="Tango Accordion" />
    case 24:
      return <Localized name="Acoustic Guitar (nylon)" />
    case 25:
      return <Localized name="Acoustic Guitar (steel)" />
    case 26:
      return <Localized name="Electric Guitar (jazz)" />
    case 27:
      return <Localized name="Electric Guitar (clean)" />
    case 28:
      return <Localized name="Electric Guitar (muted)" />
    case 29:
      return <Localized name="Overdriven Guitar" />
    case 30:
      return <Localized name="Distortion Guitar" />
    case 31:
      return <Localized name="Guitar Harmonics" />
    case 32:
      return <Localized name="Acoustic Bass" />
    case 33:
      return <Localized name="Electric Bass (finger)" />
    case 34:
      return <Localized name="Electric Bass (pick)" />
    case 35:
      return <Localized name="Fretless Bass" />
    case 36:
      return <Localized name="Slap Bass 1" />
    case 37:
      return <Localized name="Slap Bass 2" />
    case 38:
      return <Localized name="Synth Bass 1" />
    case 39:
      return <Localized name="Synth Bass 2" />
    case 40:
      return <Localized name="Violin" />
    case 41:
      return <Localized name="Viola" />
    case 42:
      return <Localized name="Cello" />
    case 43:
      return <Localized name="Contrabass" />
    case 44:
      return <Localized name="Tremolo Strings" />
    case 45:
      return <Localized name="Pizzicato Strings" />
    case 46:
      return <Localized name="Orchestral Harp" />
    case 47:
      return <Localized name="Timpani" />
    case 48:
      return <Localized name="String Ensemble 1" />
    case 49:
      return <Localized name="String Ensemble 2" />
    case 50:
      return <Localized name="Synth Strings 1" />
    case 51:
      return <Localized name="Synth Strings 2" />
    case 52:
      return <Localized name="Choir Aahs" />
    case 53:
      return <Localized name="Voice Oohs" />
    case 54:
      return <Localized name="Synth Choir" />
    case 55:
      return <Localized name="Orchestra Hit" />
    case 56:
      return <Localized name="Trumpet" />
    case 57:
      return <Localized name="Trombone" />
    case 58:
      return <Localized name="Tuba" />
    case 59:
      return <Localized name="Muted Trumpet" />
    case 60:
      return <Localized name="French Horn" />
    case 61:
      return <Localized name="Brass Section" />
    case 62:
      return <Localized name="Synth Brass 1" />
    case 63:
      return <Localized name="Synth Brass 2" />
    case 64:
      return <Localized name="Soprano Sax" />
    case 65:
      return <Localized name="Alto Sax" />
    case 66:
      return <Localized name="Tenor Sax" />
    case 67:
      return <Localized name="Baritone Sax" />
    case 68:
      return <Localized name="Oboe" />
    case 69:
      return <Localized name="English Horn" />
    case 70:
      return <Localized name="Bassoon" />
    case 71:
      return <Localized name="Clarinet" />
    case 72:
      return <Localized name="Piccolo" />
    case 73:
      return <Localized name="Flute" />
    case 74:
      return <Localized name="Recorder" />
    case 75:
      return <Localized name="Pan Flute" />
    case 76:
      return <Localized name="Blown Bottle" />
    case 77:
      return <Localized name="Shakuhachi" />
    case 78:
      return <Localized name="Whistle" />
    case 79:
      return <Localized name="Ocarina" />
    case 80:
      return <Localized name="Lead 1 (square)" />
    case 81:
      return <Localized name="Lead 2 (sawtooth)" />
    case 82:
      return <Localized name="Lead 3 (calliope)" />
    case 83:
      return <Localized name="Lead 4 (chiff)" />
    case 84:
      return <Localized name="Lead 5 (charang)" />
    case 85:
      return <Localized name="Lead 6 (voice)" />
    case 86:
      return <Localized name="Lead 7 (fifths)" />
    case 87:
      return <Localized name="Lead 8 (bass + lead)" />
    case 88:
      return <Localized name="Pad 1 (new age)" />
    case 89:
      return <Localized name="Pad 2 (warm)" />
    case 90:
      return <Localized name="Pad 3 (polysynth)" />
    case 91:
      return <Localized name="Pad 4 (choir)" />
    case 92:
      return <Localized name="Pad 5 (bowed)" />
    case 93:
      return <Localized name="Pad 6 (metallic)" />
    case 94:
      return <Localized name="Pad 7 (halo)" />
    case 95:
      return <Localized name="Pad 8 (sweep)" />
    case 96:
      return <Localized name="FX 1 (rain)" />
    case 97:
      return <Localized name="FX 2 (soundtrack)" />
    case 98:
      return <Localized name="FX 3 (crystal)" />
    case 99:
      return <Localized name="FX 4 (atmosphere)" />
    case 100:
      return <Localized name="FX 5 (brightness)" />
    case 101:
      return <Localized name="FX 6 (goblins)" />
    case 102:
      return <Localized name="FX 7 (echoes)" />
    case 103:
      return <Localized name="FX 8 (sci-fi)" />
    case 104:
      return <Localized name="Sitar" />
    case 105:
      return <Localized name="Banjo" />
    case 106:
      return <Localized name="Shamisen" />
    case 107:
      return <Localized name="Koto" />
    case 108:
      return <Localized name="Kalimba" />
    case 109:
      return <Localized name="Bagpipe" />
    case 110:
      return <Localized name="Fiddle" />
    case 111:
      return <Localized name="Shanai" />
    case 112:
      return <Localized name="Tinkle Bell" />
    case 113:
      return <Localized name="Agogo" />
    case 114:
      return <Localized name="Steel Drums" />
    case 115:
      return <Localized name="Woodblock" />
    case 116:
      return <Localized name="Taiko Drum" />
    case 117:
      return <Localized name="Melodic Tom" />
    case 118:
      return <Localized name="Synth Drum" />
    case 119:
      return <Localized name="Reverse Cymbal" />
    case 120:
      return <Localized name="Guitar Fret Noise" />
    case 121:
      return <Localized name="Breath Noise" />
    case 122:
      return <Localized name="Seashore" />
    case 123:
      return <Localized name="Bird Tweet" />
    case 124:
      return <Localized name="Telephone Ring" />
    case 125:
      return <Localized name="Helicopter" />
    case 126:
      return <Localized name="Applause" />
    case 127:
      return <Localized name="Gunshot" />
  }
  return <></>
}

const RhythmInstrumentName: FC<{ programNumber: number | undefined }> = ({
  programNumber,
}) => {
  switch (programNumber) {
    case 0:
      return <Localized name="Standard Drum Kit" />
    case 8:
      return <Localized name="Room Drum Kit" />
    case 16:
      return <Localized name="Power Drum Kit" />
    case 24:
      return <Localized name="Electronic Drum Kit" />
    case 25:
      return <Localized name="Analog Drum Kit" />
    case 32:
      return <Localized name="Jazz Drum Kit" />
    case 40:
      return <Localized name="Brush Drum Kit" />
    case 48:
      return <Localized name="Orchestra Drum Kit" />
    case 56:
      return <Localized name="SFX Drum Kit" />
    default:
      return <></>
  }
}

export const InstrumentName: FC<{
  isRhythmTrack: boolean
  programNumber: number
}> = ({ isRhythmTrack, programNumber }) => {
  if (isRhythmTrack) {
    return <RhythmInstrumentName programNumber={programNumber} />
  }
  return <NormalInstrumentName programNumber={programNumber} />
}
