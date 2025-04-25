import { observer } from "mobx-react-lite"
import { FC, useCallback, useState } from "react"
import { useAddTimeSignature } from "../../actions"
import { useSong } from "../../hooks/useSong"
import { useStores } from "../../hooks/useStores"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import { RulerStore } from "../../stores/RulerStore"
import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuHotKey as HotKey,
} from "../ContextMenu/ContextMenu"
import { MenuItem } from "../ui/Menu"
import { TimeSignatureDialog } from "./TimeSignatureDialog"

export interface RulerContextMenuProps extends ContextMenuProps {
  rulerStore: RulerStore
  tick: number
}

export const RulerContextMenu: FC<RulerContextMenuProps> = observer(
  ({ rulerStore, tick, ...props }) => {
    const { handleClose } = props
    const { player } = useStores()
    const song = useSong()
    const addTimeSignature = useAddTimeSignature()
    const [isOpenTimeSignatureDialog, setOpenTimeSignatureDialog] =
      useState(false)

    const isTimeSignatureSelected =
      rulerStore.selectedTimeSignatureEventIds.length > 0

    const onClickAddTimeSignature = useCallback(() => {
      setOpenTimeSignatureDialog(true)
      handleClose()
    }, [])

    const onClickRemoveTimeSignature = useCallback(() => {
      song.conductorTrack?.removeEvents(
        rulerStore.selectedTimeSignatureEventIds,
      )
      handleClose()
    }, [song])

    const onClickSetLoopStart = useCallback(() => {
      player.setLoopBegin(tick)
      handleClose()
    }, [tick, player])

    const onClickSetLoopEnd = useCallback(() => {
      player.setLoopEnd(tick)
      handleClose()
    }, [tick, player])

    const closeOpenTimeSignatureDialog = useCallback(() => {
      setOpenTimeSignatureDialog(false)
    }, [])

    return (
      <>
        <ContextMenu {...props}>
          <MenuItem onClick={onClickSetLoopStart}>
            <Localized name="set-loop-start" />
            <HotKey>{envString.cmdOrCtrl}+Click</HotKey>
          </MenuItem>
          <MenuItem onClick={onClickSetLoopEnd}>
            <Localized name="set-loop-end" />
            <HotKey>Alt+Click</HotKey>
          </MenuItem>
          <MenuItem onClick={onClickAddTimeSignature}>
            <Localized name="add-time-signature" />
          </MenuItem>
          <MenuItem
            onClick={onClickRemoveTimeSignature}
            disabled={!isTimeSignatureSelected}
          >
            <Localized name="remove-time-signature" />
          </MenuItem>
        </ContextMenu>
        <TimeSignatureDialog
          open={isOpenTimeSignatureDialog}
          onClose={closeOpenTimeSignatureDialog}
          onClickOK={({ numerator, denominator }) => {
            addTimeSignature(tick, numerator, denominator)
          }}
        />
      </>
    )
  },
)
