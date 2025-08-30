import NodeEnvironment from "jest-environment-node"

export default class CustomEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    // mock navigator.language
    this.global.navigator = {
      language: "en",
    } as Navigator
    this.global.location = {
      href: "https://signalmidi.app/",
    } as Location
  }
}
