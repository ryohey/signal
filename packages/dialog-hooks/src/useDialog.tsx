import { createContext, FC, ReactNode, useContext, useState } from "react"

type KeyType = string | number | symbol | boolean

export interface DialogProviderProps<Keys extends KeyType> {
  children: ReactNode
  component: FC<DialogProps<Keys>>
}

export const DialogProvider = <Keys extends KeyType>({
  children,
  component: ActionDialog,
}: DialogProviderProps<Keys>) => {
  const [dialog, setDialog] = useState<DialogProps<any> | null>(null)

  return (
    <DialogContext.Provider value={{ setDialog }}>
      {children}
      {dialog !== null && <ActionDialog {...dialog} />}
    </DialogContext.Provider>
  )
}

export interface DialogOptions<Keys extends KeyType> {
  title: string
  message?: string
  actions: DialogAction<Keys>[]
}

export interface DialogAction<Key extends KeyType> {
  title: string
  key: Key
}

export type DialogProps<Keys extends KeyType> = DialogOptions<Keys> & {
  callback: (key: Keys | null) => void
}

export const DialogContext = createContext<{
  setDialog: (props: DialogProps<any> | null) => void
}>(null as never)

export const useDialog = () => {
  const { setDialog } = useContext(DialogContext)

  return {
    async show<Keys extends KeyType>(
      options: DialogOptions<Keys>,
    ): Promise<Keys> {
      return new Promise((resolve, _reject) => {
        setDialog({
          ...options,
          callback: (key) => resolve(key),
        })
      })
    },
  }
}
