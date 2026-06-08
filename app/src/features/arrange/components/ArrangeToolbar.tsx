import styled from "@emotion/styled"
import { FC } from "react"
import { AutoScrollButton } from "../../../components/Toolbar/AutoScrollButton"
import { QuantizeSelector } from "../../../components/Toolbar/QuantizeSelector/QuantizeSelector"
import { Toolbar } from "../../../components/Toolbar/Toolbar"
import { Localized } from "../../../localize/useLocalization"

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

export const ArrangeToolbar: FC = () => {
  return (
    <Toolbar>
      <Title>
        <Localized name="arrangement-view" />
      </Title>

      <FlexibleSpacer />

      <QuantizeSelector />

      <AutoScrollButton />
    </Toolbar>
  )
}
