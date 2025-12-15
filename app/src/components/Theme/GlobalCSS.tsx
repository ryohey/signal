import { css, Global, useTheme } from "@emotion/react"
import { Layout } from "../../Constants"

export const GlobalCSS = () => {
  const theme = useTheme()
  return (
    <Global
      styles={css`
        /* Import Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600&display=swap');

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
          --size-key-height: ${Layout.keyHeight}px;
          --size-ruler-height: ${Layout.rulerHeight}px;
          
          /* Animation variables */
          --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
          --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
          --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
          --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
        }

        html {
          font-size: 16px;
        }

        html,
        body {
          height: 100%;
          margin: 0;
          padding: 0 !important;
        }

        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          color: ${theme.textColor};
          background-color: ${theme.backgroundColor};
          overscroll-behavior: none;
          font-family: ${theme.font};
          font-size: 0.8125rem;
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1.5;
        }

        #root {
          height: 100%;
        }

        /* Smooth transitions for all interactive elements */
        *,
        *::before,
        *::after {
          box-sizing: border-box;
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

        /* Interactive elements with smooth transitions - hand cursor */
        button,
        a,
        input,
        select,
        textarea,
        label,
        canvas,
        [role="button"],
        [role="slider"],
        [role="checkbox"],
        [role="radio"],
        [role="menuitem"],
        [role="option"],
        [role="tab"],
        [role="listbox"],
        [role="combobox"],
        [role="switch"],
        [role="spinbutton"],
        [role="scrollbar"],
        [tabindex]:not([tabindex="-1"]),
        [onclick],
        [onmousedown],
        [data-clickable],
        .clickable,
        summary {
          cursor: pointer !important;
          transition: all var(--transition-fast);
        }

        /* Ensure divs with click handlers show hand cursor */
        div[onclick],
        div[onmousedown],
        span[onclick],
        span[onmousedown] {
          cursor: pointer !important;
        }

        /* Buttons with hover lift effect */
        button:not(:disabled):hover,
        [role="button"]:not([aria-disabled="true"]):hover {
          transform: translateY(-1px);
        }

        button:not(:disabled):active,
        [role="button"]:not([aria-disabled="true"]):active {
          transform: translateY(0) scale(0.98);
        }

        input[type="text"],
        input[type="number"],
        input[type="email"],
        input[type="password"],
        textarea {
          cursor: text;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: var(--color-theme);
          box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.15);
        }

        input:disabled,
        button:disabled,
        select:disabled,
        textarea:disabled,
        [disabled] {
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* Modern Scrollbar */
        .ScrollBar {
          background-color: transparent;
        }

        .ScrollBar .thumb {
          border: none;
          background: var(--color-text-secondary);
          opacity: 0.15;
          border-radius: 4px;
          transition: opacity var(--transition-fast);
        }

        .ScrollBar .thumb:hover {
          opacity: 0.25;
        }

        .ScrollBar .thumb:active {
          opacity: 0.4;
        }

        .ScrollBar .button-backward,
        .ScrollBar .button-forward {
          display: none;
        }

        /* Native Scrollbar - Minimal */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-corner {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          transition: background-color var(--transition-fast);
        }

        ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        /* Selection styling */
        ::selection {
          background: rgba(0, 212, 170, 0.3);
          color: inherit;
        }

        /* Focus visible for accessibility */
        :focus-visible {
          outline: 2px solid var(--color-theme);
          outline-offset: 2px;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(8px);
        }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Utility classes */
        .animate-fade-in {
          animation: fadeIn var(--transition-normal) var(--ease-out-expo);
        }

        .animate-slide-up {
          animation: slideUp var(--transition-normal) var(--ease-out-expo);
        }

        .animate-scale-in {
          animation: scaleIn var(--transition-fast) var(--ease-out-expo);
        }
      `}
    />
  )
}
