import type { CloudSong } from "@signal-app/api"
import { observer } from "mobx-react-lite"
import type { FC } from "react"
import { Localized } from "../localize/useLocalization.js"
import { Button } from "./Button.js"
import { Dialog, DialogActions, DialogContent, DialogTitle } from "./Dialog.js"
import { LinkShare } from "./LinkShare.js"

export interface ShareDialogProps {
  song: CloudSong
  open: boolean
  onClose: () => void
}

export const ShareDialog: FC<ShareDialogProps> = observer(
  ({ song, open, onClose }) => {
    return (
      <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
        <DialogTitle>
          <Localized name="share" />
        </DialogTitle>
        <DialogContent>
          <LinkShare
            url={getCloudSongUrl(song.id)}
            text={`🎶 ${song.name} by ${song.user?.name} from @signalmidi\n#midi #signalmidi`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            <Localized name="close" />
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
)

const getCloudSongUrl = (cloudSongId: string) =>
  `${window.location.origin}/songs/${cloudSongId}`
