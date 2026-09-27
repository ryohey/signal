import type { EventListItem as EventListItemData } from "@signal-app/event-list-editor"
import isEqual from "lodash/isEqual"
import React, { FC, useCallback } from "react"
import { useEventListEditor } from "../hooks/useEventListEditor"
import { Cell, Row } from "./EventList"
import { EventListInput } from "./EventListInput"

interface EventListItemProps {
  item: EventListItemData
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent, item: EventListItemData) => void
}

const equalEventListItemProps = (
  a: EventListItemProps,
  b: EventListItemProps,
) =>
  isEqual(a.item, b.item) &&
  isEqual(a.style, b.style) &&
  a.onClick === b.onClick

export const EventListItem: FC<EventListItemProps> = React.memo(
  ({ item, style, onClick }) => {
    const editor = useEventListEditor()
    const { controller } = item

    const onDelete = useCallback(
      (target: EventListItemData) => {
        editor.removeEvent(target.id)
      },
      [editor],
    )

    const onChangeTick = useCallback(
      (input: string) => {
        const value = parseInt(input, 10)
        if (!Number.isNaN(value)) {
          editor.updateEvent(item.id, { tick: Math.max(0, value) })
        }
      },
      [editor, item],
    )

    const onChangeGate = useCallback(
      (value: string) => {
        if (controller.gate === undefined) {
          return
        }
        const obj = controller.gate.update(value)
        if (obj !== null) {
          editor.updateEvent(item.id, obj)
        }
      },
      [controller, editor, item],
    )

    const onChangeValue = useCallback(
      (value: string) => {
        if (controller.value === undefined) {
          return
        }
        const obj = controller.value.update(value)
        if (obj !== null) {
          editor.updateEvent(item.id, obj)
        }
      },
      [controller, editor, item],
    )

    return (
      <Row
        style={style}
        onClick={useCallback(
          (e: React.MouseEvent) => onClick?.(e, item),
          [item, onClick],
        )}
        onKeyDown={useCallback(
          (e: React.KeyboardEvent) => {
            if (
              e.target === e.currentTarget &&
              (e.key === "Delete" || e.key === "Backspace")
            ) {
              onDelete(item)
              e.stopPropagation()
            }
          },
          [item, onDelete],
        )}
        tabIndex={-1}
      >
        <Cell>
          <EventListInput
            value={item.tick.toFixed(0)}
            type="number"
            onChange={onChangeTick}
          />
        </Cell>
        <Cell
          style={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
        >
          {controller.name}
        </Cell>
        <Cell>
          {controller.gate !== undefined && (
            <EventListInput {...controller.gate} onChange={onChangeGate} />
          )}
        </Cell>
        <Cell>
          {controller.value !== undefined && (
            <EventListInput {...controller.value} onChange={onChangeValue} />
          )}
        </Cell>
      </Row>
    )
  },
  equalEventListItemProps,
)
