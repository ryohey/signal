import isEqual from "lodash/isEqual"
import React, { FC, useCallback } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { TrackEvent } from "../../track"
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
    const { selectedTrack } = usePianoRoll()

    const controller = getEventController(item)

    const onDelete = useCallback(
      (e: TrackEvent) => {
        selectedTrack?.removeEvent(e.id)
      },
      [selectedTrack],
    )

    const onChangeTick = useCallback(
      (input: string) => {
        const value = parseInt(input)
        if (!isNaN(value)) {
          selectedTrack?.updateEvent(item.id, { tick: Math.max(0, value) })
        }
      },
      [selectedTrack, item],
    )

    const onChangeGate = useCallback(
      (value: string) => {
        if (controller.gate === undefined) {
          return
        }
        const obj = controller.gate.update(value)
        if (obj !== null) {
          selectedTrack?.updateEvent(item.id, obj)
        }
      },
      [controller, selectedTrack, item],
    )

    const onChangeValue = useCallback(
      (value: string) => {
        if (controller.value === undefined) {
          return
        }
        const obj = controller.value.update(value)
        if (obj !== null) {
          selectedTrack?.updateEvent(item.id, obj)
        }
      },
      [controller, selectedTrack, item],
    )

    return (
      <Row
        style={style}
        onClick={useCallback((e: React.MouseEvent) => onClick(e, item), [item])}
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
          [item],
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
