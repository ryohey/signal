import styled from "@emotion/styled"
import { CloudSong } from "@signal-app/api"
import { useToast } from "dialog-hooks"
import DownloadIcon from "mdi-react/DownloadIcon.js"
import PlayArrow from "mdi-react/PlayArrowIcon.js"
import ShareIcon from "mdi-react/ShareIcon.js"
import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { Helmet } from "react-helmet-async"
import { Link } from "wouter"
import { playSong } from "../actions/song.js"
import { Alert } from "../components/Alert.js"
import { BigPlayButton } from "../components/BigPlayButton.js"
import { Button } from "../components/Button.js"
import { CircularProgress } from "../components/CircularProgress.js"
import { ShareDialog } from "../components/ShareDialog.js"
import { downloadBlob } from "../helpers/downloadBlob.js"
import { useAsyncEffect } from "../hooks/useAsyncEffect.js"
import { useStores } from "../hooks/useStores.js"
import { PageLayout, PageTitle } from "../layouts/PageLayout.js"
import { Localized } from "../localize/useLocalization.js"

export interface SongPageProps {
  songId: string
}

export const SongTitle = styled.h1`
  margin: 0;
  font-size: 300%;
`

const Author = styled.p`
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
`

const AuthorLink = styled.a`
  color: currentColor;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  margin-top: 4rem;
`

const HeaderRight = styled.div`
  margin-left: 1rem;
`

const Content = styled.div``

const Metadata = styled.div`
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
`

const Actions = styled.div`
  display: flex;
  margin-bottom: 1rem;
`

const ActionButton = styled(Button)`
  background: var(--color-background-secondary);
  margin-right: 0.5rem;
`

const Stats = styled.div`
  margin-bottom: 1rem;
`

const PlayCount = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
  color: var(--color-text-secondary);
`

export const SongPage: FC<SongPageProps> = observer(({ songId }) => {
  const rootStore = useStores()
  const {
    cloudSongRepository,
    cloudSongDataRepository,
    player,
    songStore: { currentSong },
  } = rootStore

  const [isLoading, setIsLoading] = useState(true)
  const [song, setSong] = useState<CloudSong | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const toast = useToast()

  const isPlaying =
    player.isPlaying && song !== null && currentSong?.metadata.id === song.id
  const onClickPlay = () => {
    if (song === null) {
      return
    }
    if (player.isPlaying && currentSong?.metadata.id === song.id) {
      player.stop()
    } else {
      try {
        playSong(rootStore)(song)
      } catch (e) {
        toast.error(`Failed to play: ${(e as Error).message}`)
      }
    }
  }

  const onClickDownload = async () => {
    if (song === null) {
      return
    }
    const songData = await cloudSongDataRepository.get(song.songDataId)
    const uint8Array = new Uint8Array(songData)
    const blob = new Blob([uint8Array], { type: "application/octet-stream" })
    const sanitizedFileName = song.name.replace(/[\\/:"*?<>|]/g, "_")
    const filename = `${sanitizedFileName}.mid`
    downloadBlob(blob, filename)
  }

  useAsyncEffect(async () => {
    try {
      const song = await cloudSongRepository.get(songId)
      setSong(song)
      setIsLoading(false)
    } catch (e) {
      setError(e as Error)
    }
  }, [songId])

  if (isLoading) {
    return (
      <PageLayout>
        <PageTitle>Song</PageTitle>
        <CircularProgress /> Loading...
      </PageLayout>
    )
  }

  if (error !== null) {
    return (
      <PageLayout>
        <PageTitle>Song</PageTitle>
        <Alert severity="warning">Failed to load song: {error.message}</Alert>
      </PageLayout>
    )
  }

  if (song === null) {
    return (
      <PageLayout>
        <PageTitle>Song</PageTitle>
        <Alert severity="warning">
          <Localized name="song-not-found" />
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Helmet>
        <title>{`${song.name} - signal`}</title>
      </Helmet>
      <Header>
        <BigPlayButton isPlaying={isPlaying} onMouseDown={onClickPlay} />
        <HeaderRight>
          <SongTitle style={{ marginBottom: 0 }}>{song.name}</SongTitle>
          {song.user && (
            <Author>
              by{" "}
              <Link
                href={`/users/${song.user.id}`}
                style={{ color: "currentColor", textDecoration: "none" }}
              >
                <AuthorLink>{song.user.name}</AuthorLink>
              </Link>
            </Author>
          )}
        </HeaderRight>
      </Header>
      <Content>
        <Stats>
          <PlayCount>
            <PlayArrow size={14} style={{ marginRight: "0.25rem" }} />
            {song.playCount ?? 0}{" "}
            {song.playCount === 1 ? (
              <Localized name="play-count-1" />
            ) : (
              <Localized name="play-count" />
            )}
          </PlayCount>
        </Stats>
        <Actions>
          <ActionButton onClick={onClickDownload}>
            <DownloadIcon size="1rem" style={{ marginRight: "0.5rem" }} />
            <Localized name="download" />
          </ActionButton>
          <ActionButton onClick={() => setIsShareDialogOpen(true)}>
            <ShareIcon size="1rem" style={{ marginRight: "0.5rem" }} />
            <Localized name="share" />
          </ActionButton>
        </Actions>
        <Metadata>
          <Localized name="created-at" /> {song.createdAt.toLocaleString()}
        </Metadata>
        {song.publishedAt && (
          <Metadata>
            <Localized name="published-at" />{" "}
            {song.publishedAt.toLocaleString()}
          </Metadata>
        )}
        <Metadata>
          <Localized name="updated-at" /> {song.updatedAt.toLocaleString()}
        </Metadata>
      </Content>
      <ShareDialog
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        song={song}
      />
    </PageLayout>
  )
})
