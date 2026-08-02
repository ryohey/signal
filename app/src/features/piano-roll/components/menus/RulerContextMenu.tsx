import { removeEvents } from "@signal-app/core"
import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuHotKey as HotKey,
  MenuItem,
} from "@signal-app/ui"
import React, { FC, useCallback, useState } from "react"
import { useMutateConductorTrack } from "../../../../hooks/useCommand"
import { usePlayer } from "../../../../hooks/usePlayer"
import { envString } from "../../../../localize/envString"
import { Localized } from "../../../../localize/useLocalization"
import { useAddTimeSignature } from "../../hooks/useAddTimeSignature"
import { TimeSignatureDialog } from "../dialogs/TimeSignatureDialog"

export interface RulerContextMenuProps extends ContextMenuProps {
  tick: number
  selectedTimeSignatureEventIds: Set<number>
}

const _RulerContextMenu: FC<RulerContextMenuProps> = ({
  tick,
  selectedTimeSignatureEventIds,
  ...props
}) => {
  const { setLoopBegin, setLoopEnd } = usePlayer()
  const mutate = useMutateConductorTrack()
  const addTimeSignature = useAddTimeSignature()
  const [isOpenTimeSignatureDialog, setOpenTimeSignatureDialog] =
    useState(false)

  const isTimeSignatureSelected = selectedTimeSignatureEventIds.size > 0

  const onClickAddTimeSignature = useCallback(() => {
    setOpenTimeSignatureDialog(true)
  }, [])

  const onClickRemoveTimeSignature = useCallback(() => {
    mutate(removeEvents(Array.from(selectedTimeSignatureEventIds)))
  }, [mutate, selectedTimeSignatureEventIds])

  const onClickSetLoopStart = useCallback(() => {
    setLoopBegin(tick)
  }, [tick, setLoopBegin])

  const onClickSetLoopEnd = useCallback(() => {
    setLoopEnd(tick)
  }, [tick, setLoopEnd])

  const closeOpenTimeSignatureDialog = useCallback(() => {
    setOpenTimeSignatureDialog(false)
  }, [])

  const _addTimeSignature = useCallback(
    ({
      numerator,
      denominator,
    }: {
      numerator: number
      denominator: number
    }) => {
      addTimeSignature(tick, numerator, denominator)
    },
    [tick, addTimeSignature],
  )

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
        onClickOK={_addTimeSignature}
      />
    </>
  )
}

export const RulerContextMenu = React.memo(_RulerContextMenu)
