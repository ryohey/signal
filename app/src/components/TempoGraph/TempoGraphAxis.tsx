import styled from "@emotion/styled"
import range from "lodash/range"
import type { FC } from "react"
import type { TempoCoordTransform } from "../../entities/transform/TempoCoordTransform"
import { Positioned } from "../ui/Positioned"

const Container = styled(Positioned)`
  height: 100%;
  background: var(--color-background);
  pointer-events: none;
  border-right: 1px solid var(--color-divider);
  box-shadow: 0px 0px 5px 0 rgba(0, 0, 0, 0.1);
`

const Values = styled.div`
  position: relative;

  & > div {
    position: absolute;
    text-align: right;
    width: 100%;
    padding-right: 1em;
    box-sizing: border-box;
    font-size: 90%;
    margin-top: -0.5em;
  }
`

interface TempoGraphAxisProps {
  width: number
  transform: TempoCoordTransform
  offset: number
}

export const TempoGraphAxis: FC<TempoGraphAxisProps> = ({
  width,
  transform,
  offset,
}) => {
  return (
    <Container width={width} top={offset}>
      <Values>
        {range(30, transform.maxBPM, 30).map((t) => {
          const top = Math.round(transform.getY(t))
          return (
            <Positioned top={top} key={t}>
              {t}
            </Positioned>
          )
        })}
      </Values>
    </Container>
  )
}
