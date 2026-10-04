interface LocalSoundFont {
  type: "local"
  data: ArrayBuffer
}

interface RemoteSoundFont {
  type: "remote"
  url: string
}

// electron only feature
interface FileSoundFont {
  type: "file"
  path: string
}

export interface Metadata {
  name: string
  scanPath?: string // FileSoundFont scan path
}

export type SoundFontFile = Metadata & { id: number }

export type SoundFontItem = LocalSoundFont | RemoteSoundFont | FileSoundFont
