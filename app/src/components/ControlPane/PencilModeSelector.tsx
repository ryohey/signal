import styled from "@emotion/styled"
import { useCallback } from "react"
import { useControlPane } from "../../hooks/useControlPane"
import PencilIcon from "../../images/icons/pencil.svg"
import { Localized } from "../../localize/useLocalization"
import { Tooltip } from "../ui/Tooltip"

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  background-color: transparent;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
`

const ModeButton = styled.button<{ selected: boolean }>`
  border: none;
  outline: none;
  -webkit-appearance: none;
  width: 2rem;
  padding: 0.25rem;
  color: var(--color-text-secondary);
  background: transparent;
  text-transform: none;
  height: 2rem;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid transparent;

  ${(props) =>
    props.selected &&
    `
      color: var(--color-text);
      border-bottom: 1px solid var(--color-theme);
    `}

  &:hover {
    background: var(--color-highlight);
  }
`

// Single point icon
const SingleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="8" cy="5" r="2.5" />
    <rect x="7" y="7.5" width="2" height="6" rx="1" />
  </svg>
)

// Free-line (squiggle) icon
const _FreeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M1 11 C3 11, 3 5, 5 5 S7 11, 9 11 S11 5, 13 5 S15 8, 15 8" />
  </svg>
)

// Straight line icon
const LineIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="3" cy="13" r="2" />
    <circle cx="13" cy="3" r="2" />
    <line
      x1="4.4"
      y1="11.6"
      x2="11.6"
      y2="4.4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export function PencilModeSelector() {
  const { controlPencilMode, setControlPencilMode } = useControlPane()

  const onSelectPencilMode = useCallback(
    () => setControlPencilMode("pencil"),
    [setControlPencilMode],
  )
  const onSelectSingleMode = useCallback(
    () => setControlPencilMode("single"),
    [setControlPencilMode],
  )
  const onSelectLineMode = useCallback(
    () => setControlPencilMode("line"),
    [setControlPencilMode],
  )
  return (
    <Wrapper>
      <Tooltip title={<Localized name="control-pencil-tool" />}>
        <ModeButton
          onMouseDown={onSelectPencilMode}
          selected={controlPencilMode === "pencil"}
        >
          <PencilIcon
            style={{
              width: "1.2rem",
              height: "1.2rem",
              fill: "currentColor",
            }}
            viewBox="0 0 128 128"
          />
        </ModeButton>
      </Tooltip>
      <Tooltip title={<Localized name="control-single-tool" />}>
        <ModeButton
          onMouseDown={onSelectSingleMode}
          selected={controlPencilMode === "single"}
        >
          <SingleIcon />
        </ModeButton>
      </Tooltip>
      <Tooltip title={<Localized name="control-line-tool" />}>
        <ModeButton
          onMouseDown={onSelectLineMode}
          selected={controlPencilMode === "line"}
        >
          <LineIcon />
        </ModeButton>
      </Tooltip>
    </Wrapper>
  )
}
