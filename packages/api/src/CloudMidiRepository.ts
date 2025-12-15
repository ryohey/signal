import {
  Bytes,
  Firestore,
  FirestoreDataConverter,
  Timestamp,
  collection,
  doc,
  getDoc,
} from "firebase/firestore"
import { Functions, httpsCallable } from "firebase/functions"
import { ICloudMidiRepository } from "./ICloudMidiRepository.js"

export const createCloudMidiRepository = (
  firestore: Firestore,
  functions: Functions,
): ICloudMidiRepository => new CloudMidiRepository(firestore, functions)

class CloudMidiRepository implements ICloudMidiRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly functions: Functions,
  ) {}

  async get(id: string): Promise<Uint8Array> {
    const midiCollection = collection(this.firestore, "midis")
    const snapshot = await getDoc(
      doc(midiCollection, id).withConverter(midiConverter),
    )
    const data = snapshot.data()?.data
    if (data === undefined) {
      throw new Error("Midi data does not exist")
    }
    return data.toUint8Array()
  }

  async storeMidiFile(midiFileUrl: string): Promise<string> {
    const storeMidiFile = httpsCallable<
      { midiFileUrl: string },
      StoreMidiFileResponse
    >(this.functions, "storeMidiFile")
    const res = await storeMidiFile({ midiFileUrl })
    return res.data.docId
  }
}

interface FirestoreMidi {
  url: string
  data: Bytes
  createdAt: Timestamp
  updatedAt: Timestamp
}

const midiConverter: FirestoreDataConverter<FirestoreMidi> = {
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return data as FirestoreMidi
  },
  toFirestore(midi) {
    return midi
  },
}

interface StoreMidiFileResponse {
  message: string
  docId: string
}
