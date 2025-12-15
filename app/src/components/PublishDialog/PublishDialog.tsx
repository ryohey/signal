import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import { useToast } from "dialog-hooks"
import OpenInNewIcon from "mdi-react/OpenInNewIcon"
import { FC, useCallback, useEffect, useState } from "react"
import { usePublishSong, useUnpublishSong } from "../../actions/cloudSong"
import { useRootView } from "../../hooks/useRootView"
import { useSong } from "../../hooks/useSong"
import { Localized, useLocalization } from "../../localize/useLocalization"
import { cloudSongRepository } from "../../services/repositories"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Alert } from "../ui/Alert"
import { Button, PrimaryButton } from "../ui/Button"
import { LinkShare } from "../ui/LinkShare"

type PublishState = "publishable" | "published" | "notPublishable"

export const PublishDialog: FC = () => {
  const { openPublishDialog: open, setOpenPublishDialog } = useRootView()
  const { cloudSongId, getSong } = useSong()
  const publishSong = usePublishSong()
  const unpublishSong = useUnpublishSong()
  const [publishState, setPublishState] =
    useState<PublishState>("notPublishable")
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()
  const theme = useTheme()
  const localized = useLocalization()

  useEffect(() => {
    ;(async () => {
      if (open) {
        setIsLoading(true)
        if (cloudSongId === null) {
          setPublishState("notPublishable")
          setIsLoading(false)
          return
        }
        const cloudSong = await cloudSongRepository.get(cloudSongId)
        setPublishState(cloudSong?.isPublic ? "published" : "publishable")
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onClose = useCallback(
    () => setOpenPublishDialog(false),
    [setOpenPublishDialog],
  )

  const onClickPublish = async () => {
    try {
      setIsLoading(true)
      await publishSong(getSong())
      setPublishState("published")
      toast.success(localized["song-published"])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const onClickUnpublish = async () => {
    try {
      setIsLoading(true)
      await unpublishSong(getSong())
      setPublishState("publishable")
      toast.success(localized["song-unpublished"])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="publish-song" />
      </DialogTitle>
      <DialogContent>
        {publishState === "publishable" && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <Localized name="publish-notice" />
            </div>
            <Alert severity="warning">
              <Localized name="publish-rules" />
            </Alert>
          </>
        )}
        {publishState === "published" && cloudSongId !== null && (
          <>
            <SongLink href={getCloudSongUrl(cloudSongId)} target="_blank">
              <Localized name="published-notice" />
              <OpenInNewIcon color={theme.secondaryTextColor} size="1rem" />
            </SongLink>
            <LinkShare
              url={getCloudSongUrl(cloudSongId)}
              text={localized["share-my-song-text"]}
            />
            <Divider />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
        {publishState === "publishable" && (
          <PrimaryButton onClick={onClickPublish} disabled={isLoading}>
            <Localized name="publish" />
          </PrimaryButton>
        )}
        {publishState === "published" && (
          <PrimaryButton onClick={onClickUnpublish} disabled={isLoading}>
            <Localized name="unpublish" />
          </PrimaryButton>
        )}
      </DialogActions>
    </Dialog>
  )
}

const SongLink = styled.a`
  display: flex;
  align-items: center;
  color: var(--color-text);
  text-decoration: none;
  margin-bottom: 1rem;

  &:hover {
    opacity: 0.8;
  }
`

const Divider = styled.div`
  margin: 1rem 0 0 0;
  height: 1px;
  background: var(--color-divider);
`

const getCloudSongUrl = (cloudSongId: string) =>
  `${window.location.origin}/songs/${cloudSongId}`
