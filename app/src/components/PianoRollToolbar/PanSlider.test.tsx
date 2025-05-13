/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LocalizationContext } from "../../localize/useLocalization"
import { PanSlider } from "./PanSlider"

const setTrackPanMock = jest.fn()
jest.mock("../../hooks/usePanSlider", () => ({
  usePanSlider: jest.fn(() => ({
    value: 42,
    setValue: setTrackPanMock,
    defaultValue: 64,
  })),
}))

describe("PanSlider", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.HTMLElement.prototype.hasPointerCapture = jest.fn()
    window.HTMLElement.prototype.releasePointerCapture = jest.fn()
    window.HTMLElement.prototype.setPointerCapture = jest.fn()
  })

  it("renders the slider with the correct initial value", () => {
    render(
      <LocalizationContext.Provider value={{ language: "en" }}>
        <PanSlider />
      </LocalizationContext.Provider>,
    )
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("aria-valuenow", "42") // equals currentPan
  })

  it("calls setTrackPan when the slider value changes", async () => {
    const user = userEvent.setup()
    render(<PanSlider />)
    const slider = screen.getByRole("slider")
    await user.click(slider) // focus the slider
    await user.keyboard("[ArrowRight]")
    await user.keyboard("[ArrowLeft]")
    expect(setTrackPanMock).toHaveBeenNthCalledWith(1, 43) // arrow right: currentPan + 1
    expect(setTrackPanMock).toHaveBeenNthCalledWith(2, 41) // arrow left: currentPan - 1
  })

  it("calls setTrackPan with PAN_CENTER on double click", async () => {
    const user = userEvent.setup()
    render(
      <LocalizationContext.Provider value={{ language: "en" }}>
        <PanSlider />
      </LocalizationContext.Provider>,
    )
    const slider = screen.getByRole("slider")
    await user.dblClick(slider)
    expect(setTrackPanMock).toHaveBeenCalledWith(64)
  })
})
