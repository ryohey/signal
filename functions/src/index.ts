import { Midi } from "@tonejs/midi"
import axios from "axios"
import * as admin from "firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import * as functions from "firebase-functions/v1"
import { google } from "googleapis"

admin.initializeApp()

export const storeMidiFile = functions.https.onCall(async (data) => {
  const { midiFileUrl } = data

  try {
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
    const midiResponse = await axios.get(midiFileUrl, {
      responseType: "arraybuffer",
    })
    const midiData = midiResponse.data

    // Validate the MIDI file
    const midi = new Midi(midiData)
    if (!midi) {
      throw new functions.https.HttpsError("internal", "Invalid MIDI file.")
    }

    // Save to Firestore
    const docRef = await midiCollection.add({
      url: midiFileUrl,
      data: midiData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { message: "MIDI file has been stored.", docId: docRef.id }
  } catch (error) {
    console.error("An error occurred", error)
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while processing the MIDI file.",
    )
  }
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
