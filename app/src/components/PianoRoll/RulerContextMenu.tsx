import { FC, useCallback, useState } from "react"
import { useAddTimeSignature } from "../../actions"
import { useConductorTrack } from "../../hooks/useConductorTrack"
import { usePlayer } from "../../hooks/usePlayer"
import { useRuler } from "../../hooks/useRuler"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuHotKey as HotKey,
} from "../ContextMenu/ContextMenu"
import { MenuItem } from "../ui/Menu"
import { TimeSignatureDialog } from "./TimeSignatureDialog"

export interface RulerContextMenuProps extends ContextMenuProps {
  tick: number
}

export const RulerContextMenu: FC<RulerContextMenuProps> = ({
  tick,
  ...props
}) => {
  const { handleClose } = props
  const { setLoopBegin, setLoopEnd } = usePlayer()
  const { selectedTimeSignatureEventIds } = useRuler()
  const { removeEvents } = useConductorTrack()
  const addTimeSignature = useAddTimeSignature()
  const [isOpenTimeSignatureDialog, setOpenTimeSignatureDialog] =
    useState(false)

  const isTimeSignatureSelected = selectedTimeSignatureEventIds.length > 0

  const onClickAddTimeSignature = useCallback(() => {
    setOpenTimeSignatureDialog(true)
    handleClose()
  }, [])

  const onClickRemoveTimeSignature = useCallback(() => {
    removeEvents(selectedTimeSignatureEventIds)
    handleClose()
  }, [removeEvents, selectedTimeSignatureEventIds])

  const onClickSetLoopStart = useCallback(() => {
    setLoopBegin(tick)
    handleClose()
  }, [tick, setLoopBegin])

  const onClickSetLoopEnd = useCallback(() => {
    setLoopEnd(tick)
    handleClose()
  }, [tick, setLoopEnd])

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
}
