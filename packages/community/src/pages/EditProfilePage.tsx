import styled from "@emotion/styled"
import { useToast } from "dialog-hooks"
import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { Alert } from "../components/Alert.js"
import { PrimaryButton } from "../components/Button.js"
import { CircularProgress } from "../components/CircularProgress.js"
import { TextArea } from "../components/TextArea.js"
import { TextField } from "../components/TextField.js"
import { useAsyncEffect } from "../hooks/useAsyncEffect.js"
import { useStores } from "../hooks/useStores.js"
import { PageLayout, PageTitle } from "../layouts/PageLayout.js"
import { Localized } from "../localize/useLocalization.js"

const Form = styled.div`
  display: flex;
  flex-direction: column;
`

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
`

const Action = styled.div`
  margin-top: 1rem;
`

export const EditProfilePage: FC = observer(() => {
  const {
    authStore: { authUser },
    userRepository,
  } = useStores()

  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const toast = useToast()

  useAsyncEffect(async () => {
    if (authUser) {
      try {
        const user = await userRepository.getCurrentUser()
        if (user !== null) {
          setName(user.name)
          setBio(user.bio)
        } else {
          const newUserData = {
            name: authUser.displayName ?? "",
            bio: "",
          }
          await userRepository.create(newUserData)
          setName(newUserData.name)
          setBio(newUserData.bio)
        }
        setIsLoading(false)
      } catch (e) {
        toast.error(`Failed to load user profile: ${(e as Error)?.message}`)
      }
    }
  }, [authUser])

  const onClickSave = async () => {
    try {
      await userRepository.update({
        name,
        bio,
      })
      toast.success("Successfully updated profile")
    } catch (e) {
      toast.error(`Failed to update profile: ${(e as Error)?.message}`)
    }
  }

  if (!authUser) {
    return (
      <PageLayout>
        <PageTitle>
          <Localized name="edit-profile" />
        </PageTitle>
        <Alert severity="warning">
          <Localized name="signin-to-edit-profile" />
        </Alert>
      </PageLayout>
    )
  }

  if (isLoading) {
    return (
      <PageLayout>
        <PageTitle>
          <Localized name="edit-profile" />
        </PageTitle>
        <CircularProgress />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageTitle>
        <Localized name="edit-profile" />
      </PageTitle>
      <Form>
        <Label>
          <Localized name="display-name" />
        </Label>
        <TextField
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
          }}
        />

        <Label>
          <Localized name="bio" />
        </Label>
        <TextArea
          value={bio}
          onChange={(e) => {
            setBio(e.target.value)
          }}
        />
        <Action>
          <PrimaryButton onClick={onClickSave}>
            <Localized name="save" />
          </PrimaryButton>
        </Action>
      </Form>
    </PageLayout>
  )
})
