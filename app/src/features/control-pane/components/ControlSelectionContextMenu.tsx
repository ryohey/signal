import styled from "@emotion/styled"
import { ValueEventType } from "@signal-app/control-editor"
import {
  ContextMenu,
  type ContextMenuProps,
  ContextMenuHotKey as HotKey,
  MenuDivider,
  MenuItem,
} from "@signal-app/ui"
import { type FC, useCallback, useState } from "react"
import { StyledNumberInput } from "../../../components/ui/StyledNumberInput"
import { envString } from "../../../localize/envString"
import { Localized } from "../../../localize/useLocalization"
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  useDuplicateControlSelection,
  usePasteControlSelection,
  useUpdateControlEventsValue,
} from "../hooks/control"
import { useControlEditor } from "../hooks/useControlEditor"
import { useControlPane } from "../hooks/useControlPane"

const ValueRow = styled.li`
  font-size: 0.8rem;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 1rem;
`

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation()

// Edits the value of the selected points in place. Keyboard and clipboard
// events must not reach the control pane's shortcuts: Backspace would delete
// the selected points, and copy/paste would act on the points.
const SetValueItem: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { selectedEventIds } = useControlPane()
  const controlEditor = useControlEditor()
  const updateControlEventsValue = useUpdateControlEventsValue()
  const { type } = controlEditor
  const { min, max } = ValueEventType.getDisplayValueRange(type)

  // start from the value of the first selected point
  const [item] = controlEditor.getItemsByIds(selectedEventIds)
  const [value, setValue] = useState(
    item !== undefined ? ValueEventType.toDisplayValue(type, item.value) : 0,
  )

  const apply = useCallback(() => {
    updateControlEventsValue(
      selectedEventIds,
      Math.max(min, Math.min(max, value)),
    )
    onDone()
  }, [updateControlEventsValue, selectedEventIds, value, min, max, onDone])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    // let Escape reach the menu so that it closes
    if (e.key !== "Escape") {
      e.stopPropagation()
    }
  }, [])

  const selectOnFocus = useCallback((e: React.FocusEvent) => {
    if (e.target instanceof HTMLInputElement) {
      e.target.select()
    }
  }, [])

  return (
    <ValueRow
      onKeyDown={onKeyDown}
      onCopy={stopPropagation}
      onCut={stopPropagation}
      onPaste={stopPropagation}
      onFocus={selectOnFocus}
    >
      <Localized name="set-value" />
      <StyledNumberInput
        value={value}
        onChange={setValue}
        onEnter={apply}
        allowNegative={min < 0}
        style={{
          width: "5rem",
          height: "1.75rem",
          padding: "0 0.5rem",
          fontSize: "0.8rem",
          textAlign: "right",
        }}
      />
    </ValueRow>
  )
}

export const ControlSelectionContextMenu: FC<ContextMenuProps> = (props) => {
  const { handleClose } = props
  const { selectedEventIds } = useControlPane()
  const isEventSelected = selectedEventIds.length > 0
  const copyControlSelection = useCopyControlSelection()
  const deleteControlSelection = useDeleteControlSelection()
  const duplicateControlSelection = useDuplicateControlSelection()
  const pasteControlSelection = usePasteControlSelection()

  const onClickCut = useCallback(() => {
    copyControlSelection()
    deleteControlSelection()
  }, [copyControlSelection, deleteControlSelection])

  const onClickCopy = useCallback(() => {
    copyControlSelection()
  }, [copyControlSelection])

  const onClickPaste = useCallback(() => {
    pasteControlSelection()
  }, [pasteControlSelection])

  const onClickDuplicate = useCallback(() => {
    duplicateControlSelection()
  }, [duplicateControlSelection])

  const onClickDelete = useCallback(() => {
    deleteControlSelection()
  }, [deleteControlSelection])

  return (
    <ContextMenu {...props}>
      <MenuItem onClick={onClickCut} disabled={!isEventSelected}>
        <Localized name="cut" />
        <HotKey>{envString.cmdOrCtrl}+X</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickCopy} disabled={!isEventSelected}>
        <Localized name="copy" />
        <HotKey>{envString.cmdOrCtrl}+C</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickPaste}>
        <Localized name="paste" />
        <HotKey>{envString.cmdOrCtrl}+V</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickDuplicate} disabled={!isEventSelected}>
        <Localized name="duplicate" />
        <HotKey>{envString.cmdOrCtrl}+D</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickDelete} disabled={!isEventSelected}>
        <Localized name="delete" />
        <HotKey>Del</HotKey>
      </MenuItem>
      <MenuDivider />
      {isEventSelected ? (
        <SetValueItem onDone={handleClose} />
      ) : (
        <MenuItem disabled>
          <Localized name="set-value" />
        </MenuItem>
      )}
    </ContextMenu>
  )
}
