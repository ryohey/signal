export interface VersionInfo {
  commitSha: string
  buildTime: string
  version: string
}

export type VersionCheckListener = (newVersion: VersionInfo) => void

export class VersionCheckService {
  private currentVersion: VersionInfo | null = null
  private listeners: VersionCheckListener[] = []
  private checkInterval: number | null = null
  private isChecking = false

  // Check for updates every 5 minutes
  private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000

  constructor() {
    this.loadCurrentVersion()
  }

  private async loadCurrentVersion() {
    try {
      const response = await fetch("/version.json", {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        console.warn("Failed to load version.json")
        return
      }

      this.currentVersion = await response.json()
      console.log("Current version loaded:", this.currentVersion)
    } catch (error) {
      console.warn("Error loading current version:", error)
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (this.isChecking || !this.currentVersion) {
      return false
    }

    this.isChecking = true

    try {
      const response = await fetch("/version.json", {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        console.warn("Failed to fetch version.json for update check")
        return false
      }

      const latestVersion: VersionInfo = await response.json()

      // Check if there's a new version
      if (
        latestVersion.commitSha !== this.currentVersion.commitSha &&
        latestVersion.commitSha !== "development"
      ) {
        console.log("New version detected:", latestVersion)
        this.notifyListeners(latestVersion)
        return true
      }

      return false
    } catch (error) {
      console.warn("Error checking for updates:", error)
      return false
    } finally {
      this.isChecking = false
    }
  }

  startPeriodicCheck() {
    if (this.checkInterval !== null) {
      return // Already started
    }

    console.log("Starting periodic version check")

    // Check immediately
    setTimeout(() => this.checkForUpdates(), 10000) // Wait 10s before first check

    // Then check periodically
    this.checkInterval = window.setInterval(() => {
      this.checkForUpdates()
    }, this.CHECK_INTERVAL_MS)
  }

  stopPeriodicCheck() {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  onUpdateAvailable(listener: VersionCheckListener) {
    this.listeners.push(listener)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(newVersion: VersionInfo) {
    this.listeners.forEach((listener) => {
      try {
        listener(newVersion)
      } catch (error) {
        console.error("Error in version check listener:", error)
      }
    })
  }

  getCurrentVersion(): VersionInfo | null {
    return this.currentVersion
  }

  reloadApp() {
    // Store that we just updated
    localStorage.setItem("app_just_updated", "true")
    localStorage.setItem("app_updated_at", new Date().toISOString())

    // Reload the page to get the new version
    window.location.reload()
  }
}

// Singleton instance
export const versionCheckService = new VersionCheckService()
