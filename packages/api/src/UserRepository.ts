import { Auth, deleteUser } from "firebase/auth"
import {
  Firestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  where,
} from "firebase/firestore"
import { AuthUser, IUserRepository, User } from "./IUserRepository.js"

export const createUserRepository = (
  firestore: Firestore,
  auth: Auth,
): IUserRepository => new UserRepository(firestore, auth)

export interface FirestoreUser {
  name: string
  bio: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

class UserRepository implements IUserRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly auth: Auth,
  ) {}
  private get userCollection() {
    return collection(this.firestore, "users").withConverter(userConverter)
  }

  private get userRef() {
    if (this.auth.currentUser === null) {
      throw new Error("You must be logged in to get the current user")
    }
    return doc(this.userCollection, this.auth.currentUser.uid)
  }

  async create(data: Pick<User, "name" | "bio">): Promise<void> {
    await runTransaction(this.firestore, async (transaction) => {
      transaction.set(this.userRef, {
        name: data.name,
        bio: data.bio,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    })
  }

  async update(data: Pick<User, "name" | "bio">): Promise<void> {
    await runTransaction(this.firestore, async (transaction) => {
      transaction.update(this.userRef, {
        name: data.name,
        bio: data.bio,
        updatedAt: Timestamp.now(),
      })
    })
  }

  async delete(): Promise<void> {
    if (this.auth.currentUser === null) {
      throw new Error("You must be logged in to delete the current user")
    }
    await runTransaction(this.firestore, async (transaction) => {
      transaction.delete(this.userRef)
    })
    deleteUser(this.auth.currentUser)
  }

  async getCurrentUser() {
    const userDoc = await getDoc(this.userRef)
    if (!userDoc.exists()) {
      return null
    }
    return toUser(userDoc)
  }

  async get(id: string): Promise<User | null> {
    const userDoc = await getDoc(doc(this.userCollection, id))
    if (!userDoc.exists()) {
      return null
    }
    return toUser(userDoc)
  }

  async getByUsername(username: string): Promise<User | null> {
    const q = query(this.userCollection, where("name", "==", username))
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return null
    }
    const user = snapshot.docs[0]
    return toUser(user)
  }

  observeCurrentUser(callback: (user: User | null) => void) {
    try {
      return onSnapshot(this.userRef, (snapshot) => {
        snapshot.exists() ? callback(toUser(snapshot)) : callback(null)
      })
    } catch (e) {
      console.warn(e)
      return () => {}
    }
  }

  observeAuthUser(callback: (user: AuthUser | null) => void): () => void {
    // If Firebase initialization fails, auth will be null, so use optional chaining to do nothing in that case.
    return this.auth?.onAuthStateChanged((user) => {
      callback(user)
    })
  }
}

export const convertUser = (id: string, data: FirestoreUser): User => ({
  id: id,
  name: data.name,
  bio: data.bio,
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt.toDate(),
})

const toUser = (snapshot: QueryDocumentSnapshot<FirestoreUser>): User => {
  const data = snapshot.data()
  return convertUser(snapshot.id, data)
}

const userConverter: FirestoreDataConverter<FirestoreUser> = {
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options) as FirestoreUser
    return data
  },
  toFirestore(user) {
    return user
  },
}
