import { createRoot } from "react-dom/client"
import { App } from "./App"

const rootElement = document.querySelector("#root")

if (rootElement === null) {
  throw new Error("Root element '#root' was not found")
}

const root = createRoot(rootElement)
root.render(<App />)
