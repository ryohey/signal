// Check if we are running in Electron using the user agent
export function isRunningInElectron() {
  return navigator.userAgent.toLowerCase().indexOf(" electron/") > -1
}
