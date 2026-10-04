import type { EventListEditor } from "@signal-app/event-list-editor"
import { createContext, useContext } from "react"

// biome-ignore lint/style/noNonNullAssertion: we assume the provider is always used
const EventListEditorContext = createContext<EventListEditor>(null!)

export const EventListEditorProvider = EventListEditorContext.Provider

export function useEventListEditor() {
  return useContext(EventListEditorContext)
}
