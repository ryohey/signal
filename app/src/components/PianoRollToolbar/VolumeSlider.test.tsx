/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LocalizationContext } from "../../localize/useLocalization"
import { VolumeSlider } from "./VolumeSlider"

const setTrackVolumeMock = jest.fn()
jest.mock("../../hooks/usePianoRoll", () => ({
  usePianoRoll: jest.fn(() => ({
    currentVolume: 42,
    selectedTrackId: 1,
  })),
}))
jest.mock("../../actions", () => ({
  useSetTrackVolume: jest.fn(() => setTrackVolumeMock),
}))

describe("VolumeSlider", () => {
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
        <VolumeSlider />
      </LocalizationContext.Provider>,
    )
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("aria-valuenow", "42") // equals currentVolume
  })

  it("calls setTrackVolume when the slider value changes", async () => {
    const user = userEvent.setup()
    render(<VolumeSlider />)
    const slider = screen.getByRole("slider")
    await user.click(slider) // focus the slider
    await user.keyboard("[ArrowRight]")
    await user.keyboard("[ArrowLeft]")
    expect(setTrackVolumeMock).toHaveBeenNthCalledWith(1, 43) // arrow right: currentVolume + 1
    expect(setTrackVolumeMock).toHaveBeenNthCalledWith(2, 41) // arrow left: currentVolume - 1
  })
})
