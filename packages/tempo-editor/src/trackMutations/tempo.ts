import {
  addEvent,
  TrackEventOf,
  type TrackEventsMutator,
  updateEvent,
} from "@signal-app/core"
import { SetTempoEvent } from "midifile-ts"
import { TempoItem } from "../entities"
import {
  setTempoEventToTempoItem,
  tempoItemToSetTempoEvent,
} from "../entities/tempo/transform"

export const addTempoItem =
  (item: Omit<TempoItem, "id">): TrackEventsMutator<TempoItem> =>
  (context) => {
    const event = tempoItemToSetTempoEvent({ id: 0, ...item })
    const addedEvent = addEvent<TrackEventOf<SetTempoEvent>>(event)(context)
    return setTempoEventToTempoItem(addedEvent)
  }

export const addTempoItems =
  (items: readonly Omit<TempoItem, "id">[]): TrackEventsMutator<TempoItem[]> =>
  (context) =>
    items.map((item) => addTempoItem(item)(context))

export const updateTempoItem =
  (item: TempoItem): TrackEventsMutator<void> =>
  (context) => {
    updateEvent(item.id, tempoItemToSetTempoEvent(item))(context)
  }

export const updateTempoItems =
  (items: readonly TempoItem[]): TrackEventsMutator<void> =>
  (context) =>
    items.map((item) => updateTempoItem(item)(context))
