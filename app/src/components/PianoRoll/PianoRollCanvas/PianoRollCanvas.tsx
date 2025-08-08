import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { FC, MouseEventHandler, useCallback, useEffect, useMemo } from "react"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useContextMenu } from "../../../hooks/useContextMenu"
import { useKeyScroll } from "../../../hooks/useKeyScroll"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useRuler } from "../../../hooks/useRuler"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { Selection } from "../../GLNodes/Selection"
import { useNoteMouseGesture } from "../MouseHandler/useNoteMouseGesture"
import { PianoRollStageProps } from "../PianoRollStage"
import { PianoSelectionContextMenu } from "../PianoSelectionContextMenu"
import { GhostNotes } from "./GhostNotes"
import { Lines } from "./Lines"
import { Notes } from "./Notes"

export const PianoRollCanvas: FC<PianoRollStageProps> = ({ width, height }) => {
  const { notesCursor, selectionBounds, ghostTrackIds, mouseMode } =
    usePianoRoll()
  const { beats } = useRuler()
  const { cursorX, setCanvasWidth, scrollLeft } = useTickScroll()
  const { scrollTop, setCanvasHeight } = useKeyScroll()

  const mouseHandler = useNoteMouseGesture()

  const { onContextMenu, menuProps } = useContextMenu()

  const theme = useTheme()

  const handleContextMenu: MouseEventHandler = useCallback(
    (e) => {
      // Ctrl + Click is used to copy the selected notes
      if (e.ctrlKey) {
        return
      }

      if (mouseMode === "selection") {
        e.stopPropagation()
        onContextMenu(e)
        return
      }
    },
    [mouseMode, onContextMenu],
  )

  useEffect(() => {
    setCanvasWidth(width)
  }, [width, setCanvasWidth])

  useEffect(() => {
    setCanvasHeight(height)
  }, [height, setCanvasHeight])

  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, 0),
    [scrollLeft],
  )

  const scrollYMatrix = useMemo(
    () => matrixFromTranslation(0, -scrollTop),
    [scrollTop],
  )

  const scrollXYMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, -scrollTop),
    [scrollLeft, scrollTop],
  )

  return (
    <>
      <GLCanvas
        width={width}
        height={height}
        style={{
          cursor: notesCursor,
          background: theme.pianoWhiteKeyLaneColor,
        }}
        onContextMenu={handleContextMenu}
        onMouseDown={mouseHandler.onMouseDown}
        onMouseMove={mouseHandler.onMouseMove}
        onMouseUp={mouseHandler.onMouseUp}
      >
        <Transform matrix={scrollYMatrix}>
          <Lines zIndex={0} />
        </Transform>
        <Transform matrix={scrollXMatrix}>
          <Beats height={height} beats={beats} zIndex={1} />
          <Cursor x={cursorX} height={height} zIndex={5} />
        </Transform>
        <Transform matrix={scrollXYMatrix}>
          {ghostTrackIds.map((trackId) => (
            <GhostNotes key={trackId} trackId={trackId} zIndex={2} />
          ))}
          <Notes zIndex={3} />
          <Selection rect={selectionBounds} zIndex={4} />
        </Transform>
      </GLCanvas>
      <PianoSelectionContextMenu {...menuProps} />
    </>
  )
}
