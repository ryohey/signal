import { removeEvents, TrackEvent, updateEvent } from "@signal-app/core"
import isEqual from "lodash/isEqual"
import React, { FC, useCallback } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { getEventController } from "../lib/EventController"
import { Cell, Row } from "./EventList"
import { EventListInput } from "./EventListInput"

interface EventListItemProps {
  item: TrackEvent
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent, ev: TrackEvent) => void
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
    const mutate = useMutateTrack(selectedTrackId)

    const controller = getEventController(item)

    const onDelete = useCallback(
      (e: TrackEvent) => {
        mutate(removeEvents([e.id]))
      },
      [mutate],
    )

    const onChangeTick = useCallback(
      (input: string) => {
        const value = parseInt(input, 10)
        if (!Number.isNaN(value)) {
          mutate(updateEvent(item.id, { tick: Math.max(0, value) }))
        }
      },
      [mutate, item],
    )

    const onChangeGate = useCallback(
      (value: string) => {
        if (controller.gate === undefined) {
          return
        }
        const obj = controller.gate.update(value)
        if (obj !== null) {
          mutate(updateEvent(item.id, obj))
        }
      },
      [controller, mutate, item],
    )

    const onChangeValue = useCallback(
      (value: string) => {
        if (controller.value === undefined) {
          return
        }
        const obj = controller.value.update(value)
        if (obj !== null) {
          mutate(updateEvent(item.id, obj))
        }
      },
      [controller, mutate, item],
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
