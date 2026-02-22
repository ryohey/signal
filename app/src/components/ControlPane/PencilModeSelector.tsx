import styled from "@emotion/styled"
import ArrowDropDownIcon from "mdi-react/ArrowDropDownIcon"
import { useCallback, useEffect, useRef, useState } from "react"
import { useControlPane } from "../../hooks/useControlPane"
import PencilIcon from "../../images/icons/pencil.svg"
import { Localized } from "../../localize/useLocalization"
import { Tooltip } from "../ui/Tooltip"
import {
  type CurveType,
  curveTypes,
} from "./Graph/MouseHandler/useCurveGesture"

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

const CurveSplitButton = styled.div<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  border-bottom: 1px solid transparent;
  position: relative;

  ${(props) =>
    props.selected &&
    `
      border-bottom: 1px solid var(--color-theme);
    `}
`

const CurveMainButton = styled.button<{ selected: boolean }>`
  border: none;
  outline: none;
  -webkit-appearance: none;
  width: 1.75rem;
  padding: 0.25rem 0.25rem 0.25rem 0.25rem;
  color: ${(props) =>
    props.selected ? "var(--color-text)" : "var(--color-text-secondary)"};
  background: transparent;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: none;

  &:hover {
    background: var(--color-highlight);
  }
`

const CurveDropdownButton = styled.button`
  border: none;
  outline: none;
  -webkit-appearance: none;
  width: 0.875rem;
  padding: 0;
  color: var(--color-text-secondary);
  background: transparent;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: none;

  &:hover {
    background: var(--color-highlight);
  }
`

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 2px);
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 9rem;
  overflow: hidden;
`

const DropdownItem = styled.button<{ selected: boolean }>`
  border: none;
  outline: none;
  -webkit-appearance: none;
  width: 100%;
  padding: 0.4rem 0.6rem;
  color: ${(props) =>
    props.selected ? "var(--color-text)" : "var(--color-text-secondary)"};
  background: ${(props) =>
    props.selected ? "var(--color-highlight)" : "transparent"};
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
  text-align: left;
  white-space: nowrap;

  &:hover {
    background: var(--color-highlight);
    color: var(--color-text);
  }
`

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

// EaseIn icon: slow start, fast end (sine-based, gradual)
const EaseInIcon = () => (
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
    <circle cx="2" cy="14" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="14" cy="2" r="1.5" fill="currentColor" stroke="none" />
    <path d="M 2 14 C 8 14 14 8 14 2" />
  </svg>
)

// EaseOut icon: fast start, slow end (sine-based, gradual)
const EaseOutIcon = () => (
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
    <circle cx="2" cy="14" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="14" cy="2" r="1.5" fill="currentColor" stroke="none" />
    <path d="M 2 14 C 2 8 8 2 14 2" />
  </svg>
)

export function PencilModeSelector() {
  const {
    controlPencilMode,
    setControlPencilMode,
    controlCurveType,
    setControlCurveType,
  } = useControlPane()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const onSelectPencilMode = useCallback(
    () => setControlPencilMode("pencil"),
    [setControlPencilMode],
  )
  const onSelectLineMode = useCallback(
    () => setControlPencilMode("line"),
    [setControlPencilMode],
  )
  const onSelectCurveMode = useCallback(
    () => setControlPencilMode("curve"),
    [setControlPencilMode],
  )
  const onSelectCurveType = useCallback(
    (type: CurveType) => {
      setControlCurveType(type)
      setControlPencilMode("curve")
      setDropdownOpen(false)
    },
    [setControlCurveType, setControlPencilMode],
  )

  const onWheelCurveButton = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const index = curveTypes.indexOf(controlCurveType)
      const nextIndex = index + (e.deltaY > 0 ? 1 : -1)
      if (nextIndex < 0 || nextIndex >= curveTypes.length) return
      setControlCurveType(curveTypes[nextIndex])
      setControlPencilMode("curve")
    },
    [controlCurveType, setControlCurveType, setControlPencilMode],
  )

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [dropdownOpen])

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
      <Tooltip title={<Localized name="control-line-tool" />}>
        <ModeButton
          onMouseDown={onSelectLineMode}
          selected={controlPencilMode === "line"}
        >
          <LineIcon />
        </ModeButton>
      </Tooltip>
      <Tooltip title={<Localized name="control-curve-tool" />}>
        <CurveSplitButton
          selected={controlPencilMode === "curve"}
          ref={dropdownRef}
          onWheel={onWheelCurveButton}
        >
          <CurveMainButton
            onMouseDown={onSelectCurveMode}
            selected={controlPencilMode === "curve"}
          >
            <CurveIcon type={controlCurveType} />
          </CurveMainButton>
          <CurveDropdownButton
            onMouseDown={(e) => {
              e.stopPropagation()
              setDropdownOpen((v) => !v)
            }}
          >
            <ArrowDropDownIcon />
          </CurveDropdownButton>
          {dropdownOpen && (
            <DropdownMenu>
              {curveTypes.map((type) => {
                return (
                  <DropdownItem
                    key={type}
                    selected={controlCurveType === type}
                    onMouseDown={() => onSelectCurveType(type)}
                  >
                    <CurveIcon type={type} />
                    <CurveLabel type={type} />
                  </DropdownItem>
                )
              })}
            </DropdownMenu>
          )}
        </CurveSplitButton>
      </Tooltip>
    </Wrapper>
  )
}

function CurveIcon({ type }: { type: CurveType }) {
  switch (type) {
    case "easeIn":
      return <EaseInIcon />
    case "easeOut":
      return <EaseOutIcon />
  }
}

function CurveLabel({ type }: { type: CurveType }) {
  switch (type) {
    case "easeIn":
      return <Localized name="curve-ease-in" />
    case "easeOut":
      return <Localized name="curve-ease-out" />
  }
}
