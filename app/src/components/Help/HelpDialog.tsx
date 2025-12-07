import styled from "@emotion/styled"
import type { FC, ReactNode } from "react"
import { useRootView } from "../../hooks/useRootView"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button } from "../ui/Button"

interface HotKeyProps {
  hotKeys: string[][]
  text: ReactNode
}

const HotKeyContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;

  span {
    margin: 0 0.3em;
  }
`

const Key = styled.div`
  display: inline-block;
  border: 1px solid white;
  border-radius: 4px;
  padding: 0.1em 0.5em 0.2em 0.5em;
  background: var(--color-text);
  color: var(--color-background);
  box-shadow: inset 0 -2px 0 0px #0000006b;
`

const HotKeyText = styled.div`
  margin-left: 1em;
`

const HotKey: FC<HotKeyProps> = ({ hotKeys, text }) => {
  return (
    <HotKeyContainer>
      {hotKeys
        .map((c, i1) =>
          c
            .map<ReactNode>((k, i2) => <Key key={i1 * 10000 + i2}>{k}</Key>)
            .reduce((a, b) => [a, <span key={"plus"}>+</span>, b])
        )
        .reduce((a, b) => [a, <span key={"slash"}>/</span>, b])}
      <HotKeyText>{text}</HotKeyText>
    </HotKeyContainer>
  )
}

export const HelpDialog: FC = () => {
  const { openHelpDialog, setOpenHelpDialog } = useRootView()
  const close = () => setOpenHelpDialog(false)

  return (
    <Dialog open={openHelpDialog} onOpenChange={close}>
      <DialogTitle>
        <Localized name="help" />
      </DialogTitle>
      <DialogContent>
        <h3>
          <Localized name="keyboard-shortcut" />
        </h3>
        <HotKey
          hotKeys={[[envString.altOrOption, "N"]]}
          text={<Localized name="new-song" />}
        />
        <HotKey
          hotKeys={[[envString.cmdOrCtrl, "O"]]}
          text={<Localized name="open-song" />}
        />
        <HotKey
          hotKeys={[[envString.cmdOrCtrl, "S"]]}
          text={<Localized name="save-song" />}
        />
        <HotKey
          hotKeys={[[envString.cmdOrCtrl, "Shift", "S"]]}
          text={<Localized name="save-as" />}
        />
        <HotKey hotKeys={[["Space"]]} text={<Localized name="play-pause" />} />
        <HotKey hotKeys={[["Enter"]]} text={<Localized name="stop" />} />
        <HotKey
          hotKeys={[["A"], ["D"]]}
          text={<Localized name="forward-rewind" />}
        />
        <HotKey
          hotKeys={[["R"]]}
          text={<Localized name="start-stop-recording" />}
        />
        <HotKey
          hotKeys={[["S"], ["W"]]}
          text={<Localized name="next-previous-track" />}
        />
        <HotKey
          hotKeys={[["N"], ["M"], [","]]}
          text={<Localized name="solo-mute-ghost" />}
        />
        <HotKey hotKeys={[["T"]]} text={<Localized name="transpose" />} />
        <HotKey hotKeys={[["1"]]} text={<Localized name="pencil-tool" />} />
        <HotKey hotKeys={[["2"]]} text={<Localized name="selection-tool" />} />
        <HotKey
          hotKeys={[["↑"], ["↓"]]}
          text={<Localized name="move-selection" />}
        />
        <HotKey
          hotKeys={[["←"], ["→"]]}
          text={<Localized name="select-note" />}
        />
        <HotKey
          hotKeys={[
            [envString.cmdOrCtrl, "1"],
            [envString.cmdOrCtrl, "2"],
            [envString.cmdOrCtrl, "3"],
          ]}
          text={<Localized name="switch-tab" />}
        />
        <HotKey
          hotKeys={[
            [envString.cmdOrCtrl, "↑"],
            [envString.cmdOrCtrl, "↓"],
          ]}
          text={<Localized name="scroll-vertically" />}
        />
        <HotKey
          hotKeys={[
            [envString.cmdOrCtrl, "←"],
            [envString.cmdOrCtrl, "→"],
          ]}
          text={<Localized name="scroll-horizontally" />}
        />
        <HotKey
          hotKeys={[[envString.cmdOrCtrl, "Z"]]}
          text={<Localized name="undo" />}
        />
        <HotKey
          hotKeys={[
            [envString.cmdOrCtrl, "Y"],
            [envString.cmdOrCtrl, "Shift", "Z"],
          ]}
          text={<Localized name="redo" />}
        />
        <HotKey
          hotKeys={[[envString.cmdOrCtrl, "C"]]}
          text={<Localized name="copy-selection" />}
        />
        <HotKey
          hotKeys={[["Delete"], ["Backspace"]]}
          text={<Localized name="delete-selection" />}
        />
        <HotKey
          hotKeys={[[envString.cmdOrCtrl, "X"]]}
          text={<Localized name="cut-selection" />}
        />
        <HotKey
          hotKeys={[[envString.cmdOrCtrl, "V"]]}
          text={<Localized name="paste-selection" />}
        />
        <HotKey
          hotKeys={[[envString.cmdOrCtrl, "A"]]}
          text={<Localized name="select-all" />}
        />
        <HotKey hotKeys={[["?"]]} text={<Localized name="open-help" />} />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
