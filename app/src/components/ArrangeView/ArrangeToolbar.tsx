import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import { FC, useCallback } from "react"
import { useStores } from "../../hooks/useStores"
import { Localized } from "../../localize/useLocalization"
import { AutoScrollButton } from "../Toolbar/AutoScrollButton"
import QuantizeSelector from "../Toolbar/QuantizeSelector/QuantizeSelector"
import { Toolbar } from "../Toolbar/Toolbar"

const Title = styled.div`
  font-weight: bold;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 14rem;
  min-width: 3em;
  margin-left: 0.5rem;
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

export const ArrangeToolbar: FC = observer(() => {
  const { arrangeViewStore } = useStores()
  const { quantize, autoScroll } = arrangeViewStore

  const onClickAutoScroll = useCallback(
    () => (arrangeViewStore.autoScroll = !arrangeViewStore.autoScroll),
    [arrangeViewStore],
  )

  const onSelectQuantize = useCallback(
    (denominator: number) => (arrangeViewStore.quantize = denominator),
    [arrangeViewStore],
  )

  return (
    <Toolbar>
      <Title>
        <Localized name="arrangement-view" />
      </Title>

      <FlexibleSpacer />

      <QuantizeSelector
        value={quantize}
        enabled={true}
        onSelect={onSelectQuantize}
        onClickSwitch={() => {}}
      />

      <AutoScrollButton onClick={onClickAutoScroll} selected={autoScroll} />
    </Toolbar>
  )
})
