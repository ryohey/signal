import { css, Global, useTheme } from "@emotion/react"

export const GlobalCSS = () => {
  const theme = useTheme()
  return (
    <Global
      styles={css`
        /* theme */
        :root {
          --font-sans: ${theme.font};
          --font-canvas: ${theme.canvasFont};
          --color-theme: ${theme.themeColor};
          --color-background: ${theme.backgroundColor};
          --color-background-secondary: ${theme.secondaryBackgroundColor};
          --color-background-dark: ${theme.darkBackgroundColor};
          --color-divider: ${theme.dividerColor};
          --color-text: ${theme.textColor};
          --color-text-secondary: ${theme.secondaryTextColor};
          --color-text-tertiary: ${theme.tertiaryTextColor};
          --color-shadow: ${theme.shadowColor};
          --color-highlight: ${theme.highlightColor};
          --color-green: ${theme.greenColor};
          --color-red: ${theme.redColor};
          --color-yellow: ${theme.yellowColor};
        }

        html {
          font-size: 16px;
        }

        html,
        body {
          height: 100%;
          margin: 0;
        }

        body {
          -webkit-font-smoothing: subpixel-antialiased;
          color: ${theme.textColor};
          background-color: ${theme.backgroundColor};
          overscroll-behavior: none;
          font-family: ${theme.font};
          font-size: 0.75rem;
        }

        #root {
          height: 100%;
        }

        /* firebase */
        .firebase-emulator-warning {
          width: auto !important;
        }
      `}
    />
  )
}
