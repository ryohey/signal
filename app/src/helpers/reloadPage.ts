let isReloading = false

/**
 * Reloads without the "unsaved changes" prompt. In Electron that prompt would
 * close the window instead of reloading, so the caller has to warn about
 * unsaved changes itself before calling this.
 */
export const reloadPage = () => {
  isReloading = true
  window.location.reload()
}

/**
 * True once after reloadPage. Consumed on the first check, so an aborted
 * reload (Stop pressed before the new page loads) doesn't turn the prompt off
 * for the rest of the session.
 */
export const shouldSkipUnloadPrompt = () => {
  const skip = isReloading
  isReloading = false
  return skip
}
