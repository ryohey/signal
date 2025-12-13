import styled from "@emotion/styled"
import { composeEventHandlers } from "@radix-ui/primitive"
import * as Popover from "@radix-ui/react-popover"
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
  type ReactNode,
  useRef,
} from "react"
import { Localized } from "../../../localize/useLocalization"
import { Checkbox } from "../../ui/Checkbox"
import { NumberPicker } from "./NumberPicker"

export interface QuantizePopupProps {
  value: number
  values: number[]
  triplet: boolean
  dotted: boolean
  trigger: ReactNode
  onChangeValue: (value: number) => void
  onChangeTriplet: (value: boolean) => void
  onChangeDotted: (value: boolean) => void
}

const Container = styled.div`
  background: var(--color-background-secondary);
  border: 1px solid var(--color-popup-border);
  box-shadow: 0 1rem 3rem var(--color-shadow);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  position: relative;
  top: 1rem;
  left: 0.25rem;

  &::before {
    content: "";
    width: 1rem;
    height: 1rem;
    background: var(--color-background-secondary);
    position: absolute;
    top: -0.5rem;
    left: calc(50% - 1rem);
    transform: rotate(45deg);
  }

  .button-up {
    margin-bottom: -0.4rem;
  }

  .button-down {
    margin-top: -0.1rem;
  }
`

const Right = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 1rem;
`

export function QuantizePopup({
  value = 8,
  values,
  triplet,
  dotted,
  onChangeValue,
  onChangeTriplet,
  onChangeDotted,
  trigger,
}: QuantizePopupProps) {
  const prevValue = () => {
    const index = Math.max(values.indexOf(value) - 1, 0)
    return values[index]
  }
  const nextValue = () => {
    const index = Math.min(values.indexOf(value) + 1, values.length - 1)
    return values[index]
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <FocusFixedContent>
          <Container>
            <NumberPicker
              value={value}
              prevValue={prevValue}
              nextValue={nextValue}
              onChange={onChangeValue}
            />
            <Right>
              <Checkbox
                onCheckedChange={(state) => onChangeTriplet(state === true)}
                checked={triplet}
                label={<Localized name="triplet" />}
                style={{ marginBottom: "0.5rem" }}
              />
              <Checkbox
                onCheckedChange={(state) => onChangeDotted(state === true)}
                checked={dotted}
                label={<Localized name="dotted" />}
              />
            </Right>
          </Container>
        </FocusFixedContent>
      </Popover.Portal>
    </Popover.Root>
  )
}

// https://github.com/radix-ui/primitives/discussions/3319#discussioncomment-11844283
const FocusFixedContent = forwardRef<
  ElementRef<typeof Popover.Content>,
  ComponentPropsWithoutRef<typeof Popover.Content>
>(({ ...props }, ref) => {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  return (
    <Popover.Content
      onOpenAutoFocus={composeEventHandlers(props.onOpenAutoFocus, () => {
        previousActiveElement.current = document.activeElement as HTMLElement
      })}
      onCloseAutoFocus={composeEventHandlers(props.onCloseAutoFocus, () => {
        // Return focus to the previously active element
        // Radix will immediately follow this callback and attempt to focus the DialogTrigger if it's provided
        previousActiveElement.current?.focus()
      })}
      ref={ref}
      {...props}
    />
  )
})
