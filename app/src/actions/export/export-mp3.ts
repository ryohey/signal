import { Mp3Encoder } from "@breezystack/lamejs"
import { renderAudio } from "@signal-app/player"
import { downloadBlob } from "../../helpers/Downloader"
import RootStore from "../../stores/RootStore"
import waitForAnimationFrame from "./wait-for-animation-frame"

export const exportMp3 =
  ({ song, synth, exportStore }: RootStore) =>
    async () => {
      const soundFontData = synth.loadedSoundFontData
      if (soundFontData === null) {
        return
      }

      const sampleRate = 44100

      exportStore.isCanceled = false
      exportStore.openExportProgressDialog = true
      exportStore.progress = 0

      try {
        const audioBuffer = await renderAudio(
          soundFontData,
          song.allEvents,
          song.timebase,
          sampleRate,
          {
            bufferSize: 128,
            cancel: () => exportStore.isCanceled,
            waitForEventLoop: waitForAnimationFrame,
            onProgress: (numFrames, totalFrames) =>
              (exportStore.progress = numFrames / totalFrames),
          },
        )

        exportStore.progress = 1

        const mp3Encoder = new Mp3Encoder(
          audioBuffer.numberOfChannels,
          audioBuffer.sampleRate,
          128
        )
        const mp3Data: Uint8Array[] = []

        const [left, right] = [audioBuffer.getChannelData(0), audioBuffer.getChannelData(1)]

        const l = new Int16Array(left.length);
        const r = new Int16Array(right.length);

        //Convert to required format
        for (var i = 0; i < left.length; i++) {
          l[i] = left[i] * 32767.5;
          r[i] = right[i] * 32767.5;
        }

        const sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier

        for (var i = 0; i < l.length; i += sampleBlockSize) {
          const leftChunk = l.subarray(i, i + sampleBlockSize);
          const rightChunk = r.subarray(i, i + sampleBlockSize);

          var mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);

          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }
        var mp3buf = mp3Encoder.flush();   //finish writing mp3

        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }

        const blob = new Blob(mp3Data, { type: "audio/mp3" })
        exportStore.openExportProgressDialog = false
        downloadBlob(blob, "song.mp3")
      } catch (e) {
        console.warn(e)
      }
    }


export default exportMp3;