import { createRoot } from "react-dom/client"
import { App } from "./components/App.js"

export function app() {
  const root = createRoot(document.querySelector("#root")!)
  root.render(<App />)
}
