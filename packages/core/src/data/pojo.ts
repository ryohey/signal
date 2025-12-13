import { custom } from "serializr"

// https://github.com/mobxjs/serializr/issues/50#issuecomment-310831516
export const pojo = custom(
  (val) => val,
  (val) => val
)
