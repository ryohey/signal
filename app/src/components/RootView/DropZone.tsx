import styled from "@emotion/styled"
import { type FC, type PropsWithChildren, useCallback } from "react"
import { useSetSong } from "../../actions"
import { songFromFile } from "../../actions/file"
import { useSong } from "../../hooks/useSong"
import { useLocalization } from "../../localize/useLocalization"

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
`

export const DropZone: FC<PropsWithChildren> = ({ children }) => {
  const { isSaved } = useSong()
  const localized = useLocalization()
  const setSong = useSetSong()

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file.type !== "audio/midi" && file.type !== "audio/mid") {
        return
      }
      if (isSaved || confirm(localized["confirm-open"])) {
        const newSong = await songFromFile(file)
        setSong(newSong)
      }
    },
    [isSaved, setSong, localized]
  )

  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      {children}
    </Container>
  )
}
