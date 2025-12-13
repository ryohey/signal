import styled from "@emotion/styled"
import type { CloudSong } from "@signal-app/api"
import { useToast } from "dialog-hooks"
import Circle from "mdi-react/CircleIcon.js"
import Pause from "mdi-react/PauseIcon.js"
import PlayArrow from "mdi-react/PlayArrowIcon.js"
import { observer } from "mobx-react-lite"
import type { FC } from "react"
import { playSong } from "../actions/song.js"
import { formatTimeAgo } from "../helpers/formatTimeAgo.js"
import { useStores } from "../hooks/useStores.js"
import { Localized } from "../localize/useLocalization.js"

const Content = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
`

const Username = styled.div`
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 90%;
`

const Title = styled.div`
  word-break: break-all;
  font-weight: 600;
  font-size: 130%;
`

const PlayButtonWrapper = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  margin-right: 0.5rem;

  .arrow {
    display: none;
  }
  .circle {
    display: block;
    width: 0.5rem;
    opacity: 0.2;
  }
`

const PlayButton: FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  return (
    <PlayButtonWrapper>
      {isPlaying ? (
        <Pause />
      ) : (
        <>
          <Circle className="circle" />
          <PlayArrow className="arrow" />
        </>
      )}
    </PlayButtonWrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  padding: 0.5rem 0;
  cursor: pointer;
  border-radius: 0.5rem;

  &:hover {
    background: var(--color-highlight);

    .arrow {
      display: block;
    }
    .circle {
      display: none;
    }
  }
`

const PlayCount = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
  color: var(--color-text-secondary);
`

const Time = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  min-width: 4rem;
`

const Tag = styled.div`
  display: flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  background: var(--color-highlight);
  color: var(--color-text);
  font-size: 90%;
  margin-right: 0.5rem;
`

const Labels = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 1rem;
`

export interface SongListItemProps {
  song: CloudSong
}

export const SongListItem: FC<SongListItemProps> = observer(({ song }) => {
  const rootStore = useStores()
  const {
    player,
    songStore: { currentSong },
  } = rootStore
  const toast = useToast()

  const isPlaying = player.isPlaying && currentSong?.metadata.id === song.id
  const onClick = () => {
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

  return (
    <Wrapper onClick={onClick}>
      <PlayButton isPlaying={isPlaying} />
      <Content>
        <Labels>
          <Title>
            {song.name.length > 0 ? (
              song.name
            ) : (
              <Localized name="untitled-song" />
            )}
          </Title>
          <Username>{song.user?.name}</Username>
        </Labels>
        {!song.isPublic && <Tag>Private</Tag>}
      </Content>
      <PlayCount>
        <PlayArrow size={14} style={{ marginRight: "0.25rem" }} />
        {song.playCount ?? 0}
      </PlayCount>
      <Time>{formatTimeAgo(song.updatedAt)}</Time>
    </Wrapper>
  )
})
