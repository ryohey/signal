// @signal-app/core's barrel export eagerly touches `navigator`
// (SoundFontRepository's Electron-vs-web default lookup) at module load
// time, so importing anything from it requires `navigator` to exist even
// outside a browser.
if (typeof globalThis.navigator === "undefined") {
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent: "" },
    configurable: true,
  })
}
