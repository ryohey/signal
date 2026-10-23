import { Midi } from "@tonejs/midi"
import * as admin from "firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import * as functions from "firebase-functions/v1"
import { google } from "googleapis"
import {
  fetchExternalFile,
  InvalidUrlError,
  trimToDeclaredChunks,
  validateExternalUrl,
} from "./fetchExternalMidi"

admin.initializeApp()

export const storeMidiFile = functions.https.onCall(async (data) => {
  let midiFileUrl: string
  try {
    midiFileUrl = validateExternalUrl(data?.midiFileUrl).toString()
  } catch (error) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      error instanceof InvalidUrlError ? error.message : "Invalid URL",
    )
  }

  // Check if the file already exists in Firestore
  const midiCollection = admin.firestore().collection("midis")
  const existingMidi = await midiCollection
    .where("url", "==", midiFileUrl)
    .limit(1)
    .get()

  if (!existingMidi.empty) {
    return {
      message: "This MIDI file is already stored.",
      docId: existingMidi.docs[0].id,
    }
  }

  // Download the MIDI file
  let downloaded: Buffer
  try {
    downloaded = await fetchExternalFile(new URL(midiFileUrl))
  } catch (error) {
    console.error("Failed to download the MIDI file", error)
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while downloading the MIDI file.",
    )
  }

  // Validate the MIDI file
  let midiData: Buffer
  try {
    midiData = trimToDeclaredChunks(downloaded)
    new Midi(midiData)
  } catch {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid MIDI file.",
    )
  }

  // Save to Firestore
  const docRef = await midiCollection.add({
    url: midiFileUrl,
    data: midiData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return { message: "MIDI file has been stored.", docId: docRef.id }
})

export const disableApp = functions.pubsub
  .topic("budget-alert")
  .onPublish(async (m) => {
    const data = JSON.parse(Buffer.from(m.data, "base64").toString()) as {
      costAmount: number
      budgetAmount: number
    }
    if (data.costAmount <= data.budgetAmount) {
      console.info(`No action necessary. (Current cost: ${data.costAmount})`)
      return null
    }

    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    })
    google.options({ auth })
    const projectId = await auth.getProjectId()

    await google.appengine("v1").apps.patch({
      appsId: projectId,
      updateMask: "serving_status",
      requestBody: { servingStatus: "USER_DISABLED" },
    })
    console.info(`App ${projectId} disabled`)

    return null
  })

export const syncUserToSongs = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data()
    const userId = context.params.userId

    const songsRef = admin.firestore().collection("songs")
    const snapshot = await songsRef.where("userId", "==", userId).get()

    if (snapshot.empty) {
      console.log("No matching documents.")
      return null
    }

    return admin.firestore().runTransaction(async (transaction) => {
      snapshot.docs.forEach((doc) => {
        transaction.update(doc.ref, { user: newValue })
      })
    })
  })
