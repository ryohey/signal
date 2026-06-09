import styled from "@emotion/styled"
import { Toolbar } from "@signal-app/ui"
import { FC } from "react"
import { AutoScrollButton } from "../../../../components/Toolbar/AutoScrollButton"
import { QuantizeSelector } from "../../../../components/Toolbar/QuantizeSelector/QuantizeSelector"
import { Localized } from "../../../../localize/useLocalization"
import { TempoGraphToolSelector } from "./TempoGraphToolSelector"

const Title = styled.span`
  font-weight: bold;
  margin-right: 2em;
  font-size: 1rem;
  margin-left: 0.5rem;
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

export const TempoGraphToolbar: FC = () => {
  return (
    <Toolbar>
      <Title>
        <Localized name="tempo" />
      </Title>

      <FlexibleSpacer />

      <TempoGraphToolSelector />

      <QuantizeSelector />

      <AutoScrollButton />
    </Toolbar>
  )
}
