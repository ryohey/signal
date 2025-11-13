import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import * as Portal from "@radix-ui/react-portal"
import RefreshIcon from "mdi-react/RefreshIcon"
import CloseIcon from "mdi-react/CloseIcon"
import { FC, useState } from "react"

export interface VersionUpdateToastProps {
  onUpdate: () => void
  onDismiss: () => void
  type: "available" | "updated"
  onViewChangelog?: () => void
}

const contentShow = keyframes`
  from {
    opacity: 0;
    transform: translate(0.5rem, 0) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
`

const contentHide = keyframes`
  from {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(0.5rem, 0) scale(0.96);
  }
`

const Root = styled(Portal.Root)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  z-index: 9999;
`

const Content = styled.div`
  background: var(--color-background-secondary);
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  box-shadow: 0 0.5rem 3rem var(--color-shadow);
  border: 1px solid var(--color-divider);
  min-width: 300px;
  max-width: 400px;

  animation: ${({ show }: { show: boolean }) =>
      show ? contentShow : contentHide}
    300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`

const Title = styled.div`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  border-radius: 0.25rem;

  &:hover {
    background: var(--color-hover);
  }
`

const Message = styled.div`
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
  line-height: 1.4;
`

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 0.375rem;

  ${({ variant }) =>
    variant === "primary"
      ? `
    background: var(--color-primary);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  `
      : `
    background: transparent;
    color: var(--color-text-primary);
    border: 1px solid var(--color-divider);

    &:hover {
      background: var(--color-hover);
    }
  `}
`

export const VersionUpdateToast: FC<VersionUpdateToastProps> = ({
  onUpdate,
  onDismiss,
  type,
  onViewChangelog,
}) => {
  const [show, setShow] = useState(true)

  const handleDismiss = () => {
    setShow(false)
    setTimeout(onDismiss, 300)
  }

  const handleAction = () => {
    if (type === "available") {
      onUpdate()
    } else if (onViewChangelog) {
      onViewChangelog()
    }
  }

  return (
    <Root>
      <Content show={show}>
        <Header>
          <Title>
            <RefreshIcon size={18} />
            {type === "available" ? "新しいバージョン" : "アップデート完了"}
          </Title>
          <CloseButton onClick={handleDismiss}>
            <CloseIcon size={18} />
          </CloseButton>
        </Header>
        <Message>
          {type === "available"
            ? "新しいバージョンが利用可能です。アップデートしますか？"
            : "アプリケーションが最新バージョンにアップデートされました。"}
        </Message>
        <ButtonContainer>
          {type === "available" ? (
            <>
              <Button variant="primary" onClick={onUpdate}>
                <RefreshIcon size={16} />
                アップデート
              </Button>
              <Button variant="secondary" onClick={handleDismiss}>
                後で
              </Button>
            </>
          ) : (
            <>
              {onViewChangelog && (
                <Button variant="primary" onClick={handleAction}>
                  変更履歴を見る
                </Button>
              )}
              <Button variant="secondary" onClick={handleDismiss}>
                閉じる
              </Button>
            </>
          )}
        </ButtonContainer>
      </Content>
    </Root>
  )
}
