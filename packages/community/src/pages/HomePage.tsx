import type { FC } from "react"
import { RecentSongList } from "../components/RecentSongList.js"
import { PageLayout, PageTitle } from "../layouts/PageLayout.js"
import { Localized } from "../localize/useLocalization.js"

export const HomePage: FC = () => {
  return (
    <PageLayout>
      <PageTitle>
        <Localized name="recent-tracks" />
      </PageTitle>
      <RecentSongList />
    </PageLayout>
  )
}
