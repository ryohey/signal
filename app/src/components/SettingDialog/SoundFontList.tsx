import styled from "@emotion/styled"
import Color from "color"
import { useToast } from "dialog-hooks"
import RemoveIcon from "mdi-react/RemoveIcon"
import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { useStores } from "../../hooks/useStores"
import { SoundFontFile } from "../../stores/SoundFontStore"
import { Button } from "../ui/Button"
import { CircularProgress } from "../ui/CircularProgress"
import { RadioButton } from "../ui/RadioButton"

const List = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  overflow-y: auto;
`

const Overlay = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  background-color: ${({ theme }) =>
    Color(theme.backgroundColor).alpha(0.5).toString()};
  color: var(--color-text);
  width: 100%;
  height: 100%;
  z-index: 1;
`

export const SoundFontList: FC = observer(() => {
  const { soundFontStore } = useStores()
  const { files, selectedSoundFontId } = soundFontStore
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  return (
    <List>
      {files.map((file) => (
        <SoundFontRow
          key={file.id}
          isSelected={file.id === selectedSoundFontId}
          item={file}
          onClick={async () => {
            setIsLoading(true)
            try {
              await soundFontStore.load(file.id)
            } catch (e) {
              toast.error((e as Error).message)
            } finally {
              setIsLoading(false)
            }
          }}
          onClickDelete={async () => {
            await soundFontStore.removeSoundFont(file.id)
          }}
        />
      ))}
      {isLoading && (
        <Overlay>
          <CircularProgress />
        </Overlay>
      )}
    </List>
  )
})

interface SoundFontRowProps {
  item: SoundFontFile
  isSelected: boolean
  onClick: () => void
  onClickDelete: () => void
}

const Remove = styled(RemoveIcon)`
  width: 1rem;
  color: var(--color-text-secondary);
`

const RowWrapper = styled.div`
  display: flex;
  align-items: center;
`

const SoundFontRow: FC<SoundFontRowProps> = ({
  item,
  isSelected,
  onClick,
  onClickDelete,
}) => {
  return (
    <RowWrapper>
      <RadioButton
        label={item.name}
        isSelected={isSelected}
        onClick={onClick}
      />
      {item.id >= 0 && (
        <Button
          style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
          onClick={onClickDelete}
        >
          <Remove />
        </Button>
      )}
    </RowWrapper>
  )
}
