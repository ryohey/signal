import { FC, useMemo } from "react"
import { Helmet } from "react-helmet-async"
import { useSong } from "../../hooks/useSong"

export const Head: FC = () => {
  const { filepath, name, isSaved } = useSong()

  const songName = useMemo(() => {
    if (filepath.length > 0) {
      return filepath
    }
    if (name.length > 0) {
      return name
    }
    return "New song"
  }, [filepath, name])

  return (
    <Helmet>
      <title>{`${songName}${isSaved ? "" : " *"} - PipeDream 2.0`}</title>
    </Helmet>
  )
}
