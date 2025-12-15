import { observer } from "mobx-react-lite"
import { FC } from "react"
import { Route } from "wouter"
import { EditProfilePage } from "../pages/EditProfilePage.js"
import { HomePage } from "../pages/HomePage.js"
import { SongPage } from "../pages/SongPage.js"
import { UserPage } from "../pages/UserPage.js"
import { SignInDialog } from "./SignInDialog/SignInDialog.js"

const Routes: FC = observer(() => {
  return (
    <>
      <Route path="/home" component={HomePage} />
      <Route path="/profile" component={EditProfilePage} />
      <Route path="/users/:userId">
        {(params) => <UserPage userId={params.userId} />}
      </Route>
      <Route path="/songs/:songId">
        {(params) => <SongPage songId={params.songId} />}
      </Route>
    </>
  )
})

export const RootView: FC = observer(() => {
  return (
    <>
      <Routes />
      <SignInDialog />
    </>
  )
})
