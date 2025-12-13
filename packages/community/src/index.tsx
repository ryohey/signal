import { createRoot } from "react-dom/client"
import { App } from "./components/App.js"

export function app() {
  const rootElement = document.querySelector("#root")
  if (!rootElement) {
    throw new Error("Root element not found")
  }
  const root = createRoot(rootElement)
  root.render(<App />)
}
