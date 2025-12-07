import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import type { CloudSong } from "@signal-app/api"
import { useToast } from "dialog-hooks"
import ArrowDownward from "mdi-react/ArrowDownwardIcon"
import ArrowDropDown from "mdi-react/ArrowDropDownIcon"
import ArrowUpward from "mdi-react/ArrowUpwardIcon"
import { type FC, useEffect } from "react"
import { useSetSong } from "../../actions"
import { useLoadSong } from "../../actions/cloudSong"
import { useCloudFile } from "../../hooks/useCloudFile"
import { useRootView } from "../../hooks/useRootView"
import { Localized, useLocalization } from "../../localize/useLocalization"
import { CircularProgress } from "../ui/CircularProgress"
import { IconButton } from "../ui/IconButton"
import { Menu, MenuItem } from "../ui/Menu"
import { CloudFileRow } from "./CloudFileRow"

const ArrowUp = styled(ArrowUpward)`
  width: 1.1rem;
  height: 1.1rem;
`

const ArrowDown = styled(ArrowDownward)`
  width: 1.1rem;
  height: 1.1rem;
`

const HeaderCell = styled.div`
  display: flex;
  align-items: center;
  background: var(--color-background);
  cursor: pointer;
  padding: 0 1rem;
  box-sizing: border-box;

  &:hover {
    background: var(--color-background-secondary);
  }

  &[data-selected="true"] {
    font-weight: bold;
  }
`

const NameCell = styled(HeaderCell)`
  flex-grow: 1;
`

const DateCell = styled(HeaderCell)`
  width: 12rem;
`

const MenuCell = styled(HeaderCell)`
  width: 4rem;
`

const Body = styled.div`
  max-height: 20rem;
  overflow-y: auto;

  tr:hover td {
    background: var(--color-background-secondary);
  }
`

const SortButton: FC<{ sortAscending: boolean }> = ({ sortAscending }) =>
  sortAscending ? <ArrowDown /> : <ArrowUp />

const Container = styled.div``

const Header = styled.div`
  display: flex;
  height: 2.5rem;
`

export const CloudFileList = () => {
  const {
    isLoading,
    dateType,
    files,
    selectedColumn,
    sortAscending,
    loadFiles,
    setDateType,
    setSelectedColumn,
    setSortAscending,
  } = useCloudFile()
  const { setOpenCloudFileDialog } = useRootView()
  const setSong = useSetSong()
  const loadSong = useLoadSong()
  const toast = useToast()
  const theme = useTheme()
  const localized = useLocalization()

  useEffect(() => {
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onClickSong = async (song: CloudSong) => {
    try {
      const midiSong = await loadSong(song)
      setSong(midiSong)
      setOpenCloudFileDialog(false)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (isLoading) {
    return <CircularProgress />
  }

  if (files.length === 0) {
    return <Localized name="no-files" />
  }

  const sortLabel = (() => {
    switch (dateType) {
      case "created":
        return localized["created-date"]
      case "updated":
        return localized["modified-date"]
    }
  })()

  return (
    <Container>
      <Header>
        <NameCell
          onClick={() => {
            if (selectedColumn === "name") {
              setSortAscending(!sortAscending)
            } else {
              setSelectedColumn("name")
            }
          }}
          data-selected={selectedColumn === "name"}
        >
          <Localized name="name" />
          <div style={{ width: "0.5rem" }}></div>
          {selectedColumn === "name" && (
            <SortButton sortAscending={sortAscending} />
          )}
        </NameCell>
        <DateCell
          onClick={() => {
            if (selectedColumn === "date") {
              setSortAscending(!sortAscending)
            } else {
              setSelectedColumn("date")
            }
          }}
          data-selected={selectedColumn === "date"}
        >
          {sortLabel}
          <Menu
            trigger={
              <IconButton
                style={{
                  marginLeft: "0.2em",
                }}
              >
                <ArrowDropDown style={{ fill: theme.secondaryTextColor }} />
              </IconButton>
            }
          >
            <MenuItem onClick={() => setDateType("created")}>
              <Localized name="created-date" />
            </MenuItem>
            <MenuItem onClick={() => setDateType("updated")}>
              <Localized name="modified-date" />
            </MenuItem>
          </Menu>
          {selectedColumn === "date" && (
            <SortButton sortAscending={sortAscending} />
          )}
        </DateCell>
        <MenuCell></MenuCell>
      </Header>
      <Body>
        {files.map((song) => (
          <CloudFileRow
            key={song.id}
            song={song}
            dateType={dateType}
            onClick={() => onClickSong(song)}
          />
        ))}
      </Body>
    </Container>
  )
}
