import { css, Global, useTheme } from "@emotion/react"
import { Layout } from "../../Constants"

export const GlobalCSS = () => {
  const theme = useTheme()
  return (
    <Global
      styles={css`
        /* theme */
        :root {
          --font-sans: ${theme.font};
          --font-mono: ${theme.monoFont};
          --font-canvas: ${theme.canvasFont};
          --color-theme: ${theme.themeColor};
          --color-on-surface: ${theme.onSurfaceColor};
          --color-background: ${theme.backgroundColor};
          --color-background-secondary: ${theme.secondaryBackgroundColor};
          --color-background-dark: ${theme.darkBackgroundColor};
          --color-editor-background: ${theme.editorBackgroundColor};
          --color-editor-grid: ${theme.editorGridColor};
          --color-editor-grid-secondary: ${theme.editorSecondaryGridColor};
          --color-divider: ${theme.dividerColor};
          --color-popup-border: ${theme.popupBorderColor};
          --color-text: ${theme.textColor};
          --color-text-secondary: ${theme.secondaryTextColor};
          --color-text-tertiary: ${theme.tertiaryTextColor};
          --color-piano-key-black: ${theme.pianoKeyBlack};
          --color-piano-key-white: ${theme.pianoKeyWhite};
          --color-piano-lane-black: ${theme.pianoBlackKeyLaneColor};
          --color-piano-lane-white: ${theme.pianoWhiteKeyLaneColor};
          --color-piano-lane-highlighted: ${theme.pianoHighlightedLaneColor};
          --color-piano-lane-edge: ${theme.pianoLaneEdgeColor};
          --color-ghost-note: ${theme.ghostNoteColor};
          --color-record: ${theme.recordColor};
          --color-shadow: ${theme.shadowColor};
          --color-highlight: ${theme.highlightColor};
          --color-green: ${theme.greenColor};
          --color-red: ${theme.redColor};
          --color-yellow: ${theme.yellowColor};
          --size-key-width: ${Layout.keyWidth}px;
          --size-key-height: ${Layout.keyHeight}px;
          --size-ruler-height: ${Layout.rulerHeight}px;
        }

        html {
          font-size: 16px;
        }

        html,
        body {
          height: 100%;
          margin: 0;
          padding: 0 !important; /* Remove unnecessary padding added by RemoveScroll in radix-ui/react-dialog */
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

        div,
        label,
        button,
        canvas,
        section,
        a,
        p,
        header,
        footer,
        ul,
        li {
          user-select: none;
          -webkit-user-select: none;
          -webkit-user-drag: none;
        }

        /* ScrollBar */

        .ScrollBar {
          background-color: ${theme.backgroundColor};
        }

        .ScrollBar .thumb {
          border: 1px solid ${theme.backgroundColor};
          background: ${theme.secondaryTextColor};
          opacity: 0.2;
        }

        .ScrollBar .thumb:hover {
          opacity: 0.3;
        }

        .ScrollBar .thumb:active {
          opacity: 0.5;
        }

        .ScrollBar .button-backward:active,
        .ScrollBar .button-backward:hover,
        .ScrollBar .button-forward:active,
        .ScrollBar .button-forward:hover {
          background: ${theme.secondaryBackgroundColor};
        }

        /* Native Scrollbar */

        &::-webkit-scrollbar {
          width: 12px;
        }

        &::-webkit-scrollbar-track,
        &::-webkit-scrollbar-corner {
          background-color: ${theme.backgroundColor};
        }

        &::-webkit-scrollbar-thumb {
          background-color: ${theme.secondaryBackgroundColor};
          border: 3px solid ${theme.backgroundColor};
          border-radius: 6px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background-color: ${theme.tertiaryTextColor};
        }

        /* firebase */
        .firebase-emulator-warning {
          display: none !important;
        }
      `}
    />
  )
}
