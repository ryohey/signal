import styled from "@emotion/styled"
import { FC } from "react"
import { AIChat } from "../AIChat/AIChat"

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.backgroundColor};
`

const ChatWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  height: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`

export const InitialView: FC = () => {
  return (
    <Container>
      <ChatWrapper>
        <AIChat standalone={true} />
      </ChatWrapper>
    </Container>
  )
}
