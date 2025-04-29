import styled from "@emotion/styled"
import RemoveIcon from "mdi-react/RemoveIcon"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { useStores } from "../../hooks/useStores"
import { Localized } from "../../localize/useLocalization"
import { Button } from "../ui/Button"

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`

export const SoundFontScanPathList: FC = observer(() => {
  const { soundFontStore } = useStores()
  const { scanPaths } = soundFontStore

  const removeScanPath = async (path: string) => {
    await soundFontStore.removeScanPath(path)
  }

  const onClickAddButton = async () => {
    const path = await window.electronAPI.showOpenDirectoryDialog()
    if (path) {
      soundFontStore.addScanPath(path)
    }
  }

  const onClickScanButton = () => {
    soundFontStore.scanSoundFonts()
  }

  return (
    <>
      {scanPaths.length === 0 && (
        <p>
          <i>No scan paths</i>
        </p>
      )}
      {scanPaths.map((path) => (
        <ScanPathRow
          key={path}
          path={path}
          onClickDelete={() => removeScanPath(path)}
        />
      ))}
      <Actions>
        <Button onClick={onClickAddButton}>
          <Localized name="add" />
        </Button>
        <Button onClick={onClickScanButton}>
          <Localized name="scan" />
        </Button>
      </Actions>
    </>
  )
})

const ScanPathLabel = styled.span`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
`

const Remove = styled(RemoveIcon)`
  width: 1rem;
  color: var(--color-text-secondary);
`

const RowWrapper = styled.div`
  display: flex;
  align-items: center;
`

interface ScanPathRowProps {
  path: string
  onClickDelete: () => void
}

const ScanPathRow: FC<ScanPathRowProps> = ({ path, onClickDelete }) => {
  return (
    <RowWrapper>
      <ScanPathLabel>{path}</ScanPathLabel>
      <Button
        style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
        onClick={onClickDelete}
      >
        <Remove />
      </Button>
    </RowWrapper>
  )
}
