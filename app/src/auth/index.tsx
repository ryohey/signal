import { configure } from "mobx"
import { createRoot } from "react-dom/client"
import { App } from "./App"

configure({
  enforceActions: "never",
})

const rootElement = document.createElement("div")

if (!rootElement) {
  throw new Error("Root element not found")
}

const root = createRoot(rootElement)
root.render(<App />)
