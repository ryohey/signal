import styled from "@emotion/styled"
import { CloudSong } from "@signal-app/api"
import { FC } from "react"
import { Link } from "wouter"
import { Localized } from "../localize/useLocalization.js"

const Avatar = styled.img`
  border: 1px var(--color-divider) solid;
  border-radius: 999px;
  width: 2rem;
  height: 2rem;
  margin-right: 0.5rem;
`

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  width: 15rem;
  flex-shrink: 0;
`

const Author = styled.a`
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 90%;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

const Title = styled.a`
  color: var(--color-text);
  display: block;
  font-weight: 600;
  font-size: 130%;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

export interface SongListItemProps {
  song: CloudSong
}

export const BottomPlayerSong: FC<SongListItemProps> = ({ song }) => {
  return (
    <Wrapper>
      <div>
        <Link
          href={`/songs/${song.id}`}
          style={{ color: "currentColor", textDecoration: "none" }}
        >
          <Title>
            {song.name.length > 0 ? (
              song.name
            ) : (
              <Localized name="untitled-song" />
            )}
          </Title>
        </Link>
        {song.user && (
          <Link
            href={`/users/${song.user.id}`}
            style={{ color: "currentColor", textDecoration: "none" }}
          >
            <Author>{song.user.name}</Author>
          </Link>
        )}
      </div>
    </Wrapper>
  )
}
