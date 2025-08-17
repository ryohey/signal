import KeyboardArrowDown from "mdi-react/KeyboardArrowDownIcon"
import { FC } from "react"
import { Localized } from "../../localize/useLocalization"
import { EditMenu } from "./EditMenu"
import { Tab } from "./Navigation"

export const EditMenuButton: FC = () => {
  return (
    <EditMenu
      trigger={
        <Tab id="tab-edit">
          <span style={{ marginLeft: "0.25rem" }}>
            <Localized name="edit" />
          </span>
          <KeyboardArrowDown style={{ width: "1rem", marginLeft: "0.25rem" }} />
        </Tab>
      }
    />
  )
}
