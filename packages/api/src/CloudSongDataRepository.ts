import type { Auth } from "firebase/auth"
import {
  Bytes,
  collection,
  doc,
  type Firestore,
  type FirestoreDataConverter,
  getDoc,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import type {
  CloudSongData,
  ICloudSongDataRepository,
} from "./ICloudSongDataRepository.js"

export const createCloudSongDataRepository = (
  firestore: Firestore,
  auth: Auth
): ICloudSongDataRepository => new CloudSongDataRepository(firestore, auth)

export class CloudSongDataRepository implements ICloudSongDataRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly auth: Auth
  ) {}

  private get songDataCollection() {
    return songDataCollection(this.firestore)
  }

  private songDataRef(id: string) {
    return doc(this.songDataCollection, id)
  }

  async create(data: Pick<CloudSongData, "data">): Promise<string> {
    if (this.auth.currentUser === null) {
      throw new Error("You must be logged in to save songs to the cloud")
    }
    const userId = this.auth.currentUser.uid
    const dataDoc = doc(this.songDataCollection)

    await runTransaction(this.firestore, async (transaction) => {
      transaction.set(dataDoc, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        data: Bytes.fromUint8Array(data.data),
        userId,
      })
    })

    return dataDoc.id
  }

  async get(id: string): Promise<Uint8Array> {
    const ref = this.songDataRef(id)

    const snapshot = await getDoc(ref)
    const data = snapshot.data()?.data
    if (data === undefined) {
      throw new Error("Song data does not exist")
    }
    return data.toUint8Array()
  }

  async update(id: string, data: Pick<CloudSongData, "data">): Promise<void> {
    const ref = this.songDataRef(id)

    await runTransaction(this.firestore, async (transaction) => {
      transaction.update(ref, {
        updatedAt: serverTimestamp(),
        data: Bytes.fromUint8Array(data.data),
      })
    })
  }

  async publish(id: string): Promise<void> {
    const ref = this.songDataRef(id)

    await runTransaction(this.firestore, async (transaction) => {
      transaction.update(ref, {
        isPublic: true,
      })
    })
  }

  async unpublish(id: string): Promise<void> {
    const ref = this.songDataRef(id)

    await runTransaction(this.firestore, async (transaction) => {
      transaction.update(ref, {
        isPublic: false,
      })
    })
  }

  async delete(id: string): Promise<void> {
    await runTransaction(this.firestore, async (transaction) => {
      transaction.delete(this.songDataRef(id))
    })
  }
}

interface FirestoreSongData {
  createdAt: Timestamp
  updatedAt: Timestamp
  data?: Bytes
  userId: string
  isPublic?: boolean
}

const songDataConverter: FirestoreDataConverter<FirestoreSongData> = {
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return data as FirestoreSongData
  },
  toFirestore(song) {
    return song
  },
}

export const songDataCollection = (firestore: Firestore) =>
  collection(firestore, "songData").withConverter(songDataConverter)
