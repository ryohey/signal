import { createContext, useContext } from "react"
import RootStore from "../stores/RootStore"

export const StoreContext = createContext<RootStore>(
  null as unknown as RootStore, // never use default value
)
export const useStores = () => useContext(StoreContext)
