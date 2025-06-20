import { Theme as BaseTheme } from "../theme/Theme"

declare module "@emotion/react" {
  export interface Theme extends BaseTheme {}
}
