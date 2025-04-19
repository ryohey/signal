import { useRenderer } from "@ryohey/webgl-react"
import { useMemo } from "react"

export type GLFallbackProps<T extends React.PropsWithChildren<object>> = {
  component: React.FC<T>
  fallback: React.FC<T>
} & T

export function GLFallback<T extends React.PropsWithChildren<object>>({
  component: Comp,
  fallback: Fallback,
  ...props
}: GLFallbackProps<T>) {
  const renderer = useRenderer()

  const isWebGL2 = useMemo(
    () => renderer?.gl instanceof WebGL2RenderingContext,
    [renderer],
  )

  return isWebGL2 ? (
    <Comp {...(props as unknown as T)} />
  ) : (
    <Fallback {...(props as unknown as T)} />
  )
}
