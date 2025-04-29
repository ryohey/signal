import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import { CloudSong } from "@signal-app/api"
import { useToast } from "dialog-hooks"
import DotsHorizontalIcon from "mdi-react/DotsHorizontalIcon"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { useStores } from "../../hooks/useStores"
import { Localized, useLocalization } from "../../localize/useLocalization"
import { IconButton } from "../ui/IconButton"
import { Menu, MenuItem } from "../ui/Menu"

const Container = styled.div`
  display: flex;
  cursor: pointer;
  height: 2.5rem;
  overflow: hidden;

  &:hover {
    background: var(--color-background-secondary);
  }
`

const Cell = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1rem;
  box-sizing: border-box;
`

const NameCell = styled(Cell)`
  overflow: hidden;
  flex-grow: 1;
`

const DateCell = styled(Cell)`
  width: 12rem;
  flex-shrink: 0;
`

const MenuCell = styled(Cell)`
  width: 4rem;
  flex-shrink: 0;
`

const NoWrapText = styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

export interface CloudFileRowProps {
  onClick: () => void
  song: CloudSong
  dateType: "created" | "updated"
}

export const CloudFileRow: FC<CloudFileRowProps> = observer(
  ({ song, onClick, dateType }) => {
    const theme = useTheme()
    const toast = useToast()
    const localized = useLocalization()
    const { cloudFileStore } = useStores()
    const date: Date = (() => {
      switch (dateType) {
        case "created":
          return song.createdAt
        case "updated":
          return song.updatedAt
      }
    })()
    const songName =
      song.name.length > 0 ? song.name : localized["untitled-song"]
    const dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString()
    return (
      <Container onClick={onClick}>
        <NameCell>
          <NoWrapText>{songName}</NoWrapText>
        </NameCell>
        <DateCell>{dateStr}</DateCell>
        <MenuCell>
          <Menu
            trigger={
              <IconButton
                style={{
                  marginLeft: "0.2em",
                }}
              >
                <DotsHorizontalIcon
                  style={{ fill: theme.secondaryTextColor }}
                />
              </IconButton>
            }
          >
            <MenuItem
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  await cloudFileStore.deleteSong(song)
                  toast.info(localized["song-deleted"])
                } catch (e) {
                  console.error(e)
                  toast.error(localized["song-delete-failed"])
                }
              }}
            >
              <Localized name="delete" />
            </MenuItem>
          </Menu>
        </MenuCell>
      </Container>
    )
  },
)
