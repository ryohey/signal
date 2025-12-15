import styled from "@emotion/styled"
import React, { FC } from "react"

const Parent = styled.div`
  text-align: right;
  padding-right: 0.3em;
  box-sizing: border-box;
`

const Values = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const Value = styled.div`
  padding: 0.3em;
  font-size: 90%;
  color: var(--color-text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--color-highlight);
  }
`

export interface GraphAxisProps {
  width: number
  values: number[]
  valueFormatter?: (value: number) => string
  onClick: (value: number) => void
}

export const GraphAxis: FC<GraphAxisProps> = React.memo(
  ({
    width,
    values,
    valueFormatter = (v: number) => v.toString(),
    onClick,
  }) => {
    return (
      <Parent style={{ width }}>
        <Values>
          {values
            .slice()
            .reverse()
            .map((value) => (
              <Value
                key={value}
                className="AxisValue"
                onClick={() => onClick(value)}
              >
                {valueFormatter(value)}
              </Value>
            ))}
        </Values>
      </Parent>
    )
  },
)
