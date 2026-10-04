import { createRoot } from "react-dom/client"
import { App } from "./components/App.js"

export function app() {
  const rootElement = document.querySelector("#root")

  if (rootElement === null) {
    throw new Error("Root element '#root' was not found")
  }

  const root = createRoot(rootElement)
  root.render(<App />)
}
