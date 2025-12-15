import styled from "@emotion/styled"
import Warning from "mdi-react/AlertIcon"
import Info from "mdi-react/InformationIcon"
import { CSSProperties, FC } from "react"

const Wrapper = styled.div`
  background: var(--color-background-secondary);
  display: flex;
  padding: 1rem;
  border-radius: 0.5rem;
  line-height: 1.5;
`

export type Severity = "info" | "warning"

const SeverityIcon: FC<{ severity: Severity; style: CSSProperties }> = ({
  severity,
  ...props
}) => {
  switch (severity) {
    case "info":
      return <Info {...props} />
    case "warning":
      return <Warning {...props} />
  }
}

const Content = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
`

export const Alert: FC<
  React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > & { severity: Severity }
> = ({ children, severity, ...props }) => {
  return (
    <Wrapper {...props}>
      <SeverityIcon
        severity={severity}
        style={{ marginRight: "1rem", flexShrink: "0" }}
      />
      <Content>{children}</Content>
    </Wrapper>
  )
}
