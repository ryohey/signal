import { generateSW } from "workbox-build"

generateSW({
  swDest: "dist/service-worker.js",
  globDirectory: "dist",
  maximumFileSizeToCacheInBytes: 50000000,
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^\/.*$/,
      handler: "StaleWhileRevalidate",
    },
    {
      urlPattern: /^.+\.sf2$/,
      handler: "StaleWhileRevalidate",
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: "StaleWhileRevalidate",
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: "StaleWhileRevalidate",
    },
  ],
}).then(({ count, size, warnings }) => {
  if (warnings.length > 0) {
    console.warn(
      "Warnings encountered while generating a service worker:",
      warnings.join("\n"),
    )
  }

  console.log(
    `Generated a service worker, which will precache ${count} files, totaling ${size} bytes.`,
  )
})

