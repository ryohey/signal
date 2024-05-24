import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import { FC, useCallback } from "react"
import { Localized } from "../../../components/Localized"
import { useStores } from "../../hooks/useStores"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"
import { ToolSelector } from "../Toolbar/ToolSelector"
import { Toolbar } from "../Toolbar/Toolbar"

const Title = styled.span`
  font-weight: bold;
  margin-right: 2em;
  font-size: 1rem;
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

export const TempoGraphToolbar: FC = observer(() => {
  const { tempoEditorStore } = useStores()
  const { autoScroll, quantize, isQuantizeEnabled, mouseMode } =
    tempoEditorStore

  const onSelectQuantize = useCallback(
    (denominator: number) => (tempoEditorStore.quantize = denominator),
    [tempoEditorStore],
  )

  const onClickQuantizeSwitch = useCallback(() => {
    tempoEditorStore.isQuantizeEnabled = !tempoEditorStore.isQuantizeEnabled
  }, [tempoEditorStore])

  return (
    <Toolbar>
      <Title>
        <Localized default="Tempo">tempo</Localized>
      </Title>

      <FlexibleSpacer />

      <ToolSelector
        mouseMode={mouseMode}
        onSelect={useCallback(
          (mouseMode: any) => (tempoEditorStore.mouseMode = mouseMode),
          [],
        )}
      />

      <QuantizeSelector
        value={quantize}
        enabled={isQuantizeEnabled}
        onSelect={onSelectQuantize}
        onClickSwitch={onClickQuantizeSwitch}
      />

      <AutoScrollButton
        onClick={() => (tempoEditorStore.autoScroll = !autoScroll)}
        selected={autoScroll}
      />
    </Toolbar>
  )
})
