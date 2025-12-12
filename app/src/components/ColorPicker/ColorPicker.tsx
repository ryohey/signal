import styled from "@emotion/styled"
import { DialogTitle } from "@radix-ui/react-dialog"
import range from "lodash/range"
import { FC } from "react"
import { Localized } from "../../localize/useLocalization"
import { Dialog, DialogActions, DialogContent } from "../Dialog/Dialog"
import { Button } from "../ui/Button"

const VisuallyHiddenTitle = styled(DialogTitle)`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`

export interface ColorPickerProps {
  open: boolean
  onSelect: (color: string | null) => void
  onClose: () => void
}

const ColorItem = styled.div`
  height: 2rem;

  &:hover {
    z-index: 2;
    box-shadow: 0 0 0 2px white;
  }
`

const Container = styled.div`
  display: grid;
  padding: 2px;
  grid-template-columns: repeat(8, 2rem);
`

export const ColorPicker: FC<ColorPickerProps> = ({
  open,
  onSelect,
  onClose,
}) => {
  const _onSelect = (color: string | null) => {
    onSelect(color)
    onClose()
  }

  const hues = [-5, 25, 45, 155, 190, 230, 260, 335]
  const saturation = 70
  const luminances = [65, 55, 39]

  const colors = range(0, luminances.length).flatMap((y) =>
    range(0, hues.length).map(
      (x) =>
        `hsl(
          ${hues[x].toFixed()}deg
          ${saturation}%
          ${luminances[y].toFixed()}%
        )`,
    ),
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <VisuallyHiddenTitle>Color Picker</VisuallyHiddenTitle>
      <DialogContent>
        <Container>
          {colors.map((color) => (
            <ColorItem
              key={color}
              style={{ backgroundColor: color }}
              onClick={() => _onSelect(color)}
            />
          ))}
        </Container>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => _onSelect(null)}>
          <Localized name="reset" />
        </Button>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
