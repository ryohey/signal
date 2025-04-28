import styled from "@emotion/styled"
import { DialogTitle } from "@radix-ui/react-dialog"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { useStores } from "../../hooks/useStores"
import { Localized } from "../../localize/useLocalization"
import { Dialog, DialogActions, DialogContent } from "../Dialog/Dialog"
import { Button } from "../ui/Button"

const UserIcon = styled.img`
  width: 3rem;
  height: 3rem;
  border-radius: 1.5rem;
  border: 2px solid var(--color-divider);
  box-sizing: border-box;
`

const UserCardWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const UserCard = observer(() => {
  const {
    authStore: { authUser: user },
  } = useStores()

  if (user === null) {
    return <></>
  }

  return (
    <UserCardWrapper>
      <UserIcon src={user.photoURL ?? undefined} />
      <p>{user.displayName}</p>
    </UserCardWrapper>
  )
})

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const DeleteButton = styled(Button)`
  color: var(--color-red);
`

export const UserSettingsDialog: FC = observer(() => {
  const {
    rootViewStore,
    authStore: { authUser: user },
  } = useStores()

  const onClickCancel = () => {
    rootViewStore.openUserSettingsDialog = false
  }

  const onClickDelete = async () => {
    rootViewStore.openUserSettingsDialog = false
    rootViewStore.openDeleteAccountDialog = true
  }

  const onClickProfile = () => {
    if (user !== null) {
      window.open(`https://signal.vercel.app/users/${user.uid}`)
    }
  }

  return (
    <Dialog
      open={rootViewStore.openUserSettingsDialog}
      style={{ minWidth: "30rem" }}
    >
      <DialogTitle>
        <Localized name="user-settings" />
      </DialogTitle>
      <DialogContent>
        <Content>
          <UserCard />
          <Button onClick={onClickProfile}>
            <Localized name="profile" />
          </Button>
          <DeleteButton onClick={onClickDelete}>
            <Localized name="delete-account" />
          </DeleteButton>
        </Content>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClickCancel}>
          <Localized name="cancel" />
        </Button>
      </DialogActions>
    </Dialog>
  )
})
