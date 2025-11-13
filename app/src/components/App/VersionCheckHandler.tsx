import { FC, useEffect, useState } from "react"
import { isRunningInElectron } from "../../helpers/platform"
import {
  VersionInfo,
  versionCheckService,
} from "../../services/VersionCheckService"
import { ChangelogDialog } from "../ChangelogDialog/ChangelogDialog"
import { VersionUpdateToast } from "../ui/VersionUpdateToast"

const DISMISSED_VERSION_KEY = "dismissed_version_update"
const JUST_UPDATED_KEY = "app_just_updated"

export const VersionCheckHandler: FC = () => {
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null)
  const [showUpdateToast, setShowUpdateToast] = useState(false)
  const [showUpdatedToast, setShowUpdatedToast] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)

  useEffect(() => {
    // Don't check for updates in Electron
    if (isRunningInElectron()) {
      return
    }

    // Check if the app was just updated
    const justUpdated = localStorage.getItem(JUST_UPDATED_KEY)
    if (justUpdated === "true") {
      localStorage.removeItem(JUST_UPDATED_KEY)
      setShowUpdatedToast(true)
    }

    // Subscribe to version updates
    const unsubscribe = versionCheckService.onUpdateAvailable(
      (newVersionInfo) => {
        // Check if this version was already dismissed
        const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY)
        if (dismissedVersion === newVersionInfo.commitSha) {
          return
        }

        setNewVersion(newVersionInfo)
        setShowUpdateToast(true)
      },
    )

    // Start periodic version checking
    versionCheckService.startPeriodicCheck()

    return () => {
      unsubscribe()
      versionCheckService.stopPeriodicCheck()
    }
  }, [])

  const handleUpdate = () => {
    versionCheckService.reloadApp()
  }

  const handleDismissUpdate = () => {
    setShowUpdateToast(false)
    // Remember that user dismissed this version
    if (newVersion) {
      localStorage.setItem(DISMISSED_VERSION_KEY, newVersion.commitSha)
    }
  }

  const handleDismissUpdated = () => {
    setShowUpdatedToast(false)
  }

  const handleViewChangelog = () => {
    setShowChangelog(true)
  }

  const handleCloseChangelog = () => {
    setShowChangelog(false)
  }

  return (
    <>
      {showUpdateToast && (
        <VersionUpdateToast
          type="available"
          onUpdate={handleUpdate}
          onDismiss={handleDismissUpdate}
        />
      )}
      {showUpdatedToast && (
        <VersionUpdateToast
          type="updated"
          onUpdate={handleUpdate}
          onDismiss={handleDismissUpdated}
          onViewChangelog={handleViewChangelog}
        />
      )}
      <ChangelogDialog open={showChangelog} onClose={handleCloseChangelog} />
    </>
  )
}
