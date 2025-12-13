import * as Sentry from "@sentry/browser"
import { configure } from "mobx"
import { createRoot } from "react-dom/client"
import { App } from "./components/App/App"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
})

configure({
  enforceActions: "never",
})

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Root element not found")
}

const root = createRoot(rootElement)
root.render(<App />)

if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/edit" })
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}
