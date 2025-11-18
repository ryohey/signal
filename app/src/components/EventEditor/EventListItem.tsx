import { TrackEvent } from "@signal-app/core"
import isEqual from "lodash/isEqual"
import React, { FC, useCallback } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useTrack } from "../../hooks/useTrack"
import { getEventController } from "./EventController"
import { Cell, Row } from "./EventList"
import { EventListInput } from "./EventListInput"

interface EventListItemProps {
  item: TrackEvent
  style?: React.CSSProperties
  onClick: (e: React.MouseEvent, ev: TrackEvent) => void
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
    const { selectedTrackId } = usePianoRoll()
    const { removeEvent, updateEvent } = useTrack(selectedTrackId)

    const controller = getEventController(item)

    const onDelete = useCallback(
      (e: TrackEvent) => {
        removeEvent(e.id)
      },
      [removeEvent],
    )

    const onChangeTick = useCallback(
      (input: string) => {
        const value = parseInt(input)
        if (!isNaN(value)) {
          updateEvent(item.id, { tick: Math.max(0, value) })
        }
      },
      [updateEvent, item],
    )

    const onChangeGate = useCallback(
      (value: string) => {
        if (controller.gate === undefined) {
          return
        }
        const obj = controller.gate.update(value)
        if (obj !== null) {
          updateEvent(item.id, obj)
        }
      },
      [controller, updateEvent, item],
    )

    const onChangeValue = useCallback(
      (value: string) => {
        if (controller.value === undefined) {
          return
        }
        const obj = controller.value.update(value)
        if (obj !== null) {
          updateEvent(item.id, obj)
        }
      },
      [controller, updateEvent, item],
    )

    return (
      <Row
        style={style}
        onClick={useCallback(
          (e: React.MouseEvent) => onClick(e, item),
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
