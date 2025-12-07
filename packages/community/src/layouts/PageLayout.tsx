import styled from "@emotion/styled"
import type { FC, PropsWithChildren } from "react"
import { BottomPlayer } from "../components/BottomPlayer.js"
import { Navigation } from "../components/Navigation.js"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const Content = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  flex-basis: 0;
  padding-bottom: 2rem;
`

const Inner = styled.div`
  width: 80%;
  max-width: 60rem;
  margin: 0 auto;
`

export const PageTitle = styled.h1`
  font-size: 2rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
`

export type PageLayoutProps = {}

export const PageLayout: FC<PropsWithChildren<PageLayoutProps>> = ({
  children,
}) => {
  return (
    <Container>
      <Navigation />
      <Content>
        <Inner>{children}</Inner>
      </Content>
      <BottomPlayer />
    </Container>
  )
}
