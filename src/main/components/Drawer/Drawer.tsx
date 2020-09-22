import React, { FC } from "react"
import {
  Drawer as MaterialDrawer,
  Divider,
  ListSubheader,
} from "@material-ui/core"
import { useObserver } from "mobx-react"
import { SongList } from "./SongList"
import { useStores } from "main/hooks/useStores"
import styled from "styled-components"
import { TrackList } from "./TrackList/TrackList"

export const Drawer: FC = () => {
  const { rootStore } = useStores()
  const { open, onClose } = useObserver(() => ({
    open: rootStore.rootViewStore.openDrawer,
    onClose: () => (rootStore.rootViewStore.openDrawer = false),
  }))
  return (
    <MaterialDrawer open={open} onClose={onClose}>
      <SongList />
      <Divider />
      <TrackList />
    </MaterialDrawer>
  )
}

export const ListHeader = styled(ListSubheader)`
  background: var(--background-color);
`