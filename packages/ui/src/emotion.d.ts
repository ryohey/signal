import "@emotion/react"

// Theme values this package reads. The host app provides a Theme that
// includes them.
declare module "@emotion/react" {
  export interface Theme {
    themeColor: string
    backgroundColor: string
    secondaryBackgroundColor: string
  }
}
