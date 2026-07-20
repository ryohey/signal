import { TrackEventsMutator } from "./type"

export const combineMutators =
  <T>(...mutators: readonly TrackEventsMutator<T>[]): TrackEventsMutator<T[]> =>
  (events) => {
    return mutators.map((mutator) => mutator(events))
  }
