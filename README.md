![logo-github](https://github.com/ryohey/signal/assets/5355966/46834ee4-30d8-4b66-a47c-6e081cc2c09f)

[![Join the chat at https://discord.gg/XQxzNdDJse](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdiscord.com%2Fapi%2Finvites%2FXQxzNdDJse%3Fwith_counts%3Dtrue&query=%24.approximate_presence_count&suffix=%20online&style=flat&logo=discord&logoColor=white&label=discord&labelColor=%235865F2&color=%23424549)](https://discord.gg/XQxzNdDJse)
![Node.js CI](https://github.com/ryohey/signal/workflows/Node.js%20CI/badge.svg)

[signal](https://signalmidi.app) is a user-friendly music sequencer application developed using web technologies, designed for seamless, cross-platform use, released under the MIT license.

<img width="1024" alt="image" src="https://github.com/user-attachments/assets/0c64ff3d-b095-4359-ab77-9355e04a8bee" />

## Launch

https://signalmidi.app/edit

## Goals

- **Cross-Platform Compatibility:** Ensure accessibility across various devices and operating systems.
- **Simple User Interface:** Focus on an intuitive, non-complicated user interface for ease of use.
- **MIDI Compatibility:** Support for MIDI format to facilitate a wide range of music production needs.

## Concepts

signal is conceptualized not as a replacement for a Digital Audio Workstation (DAW), but as a complementary tool. It excels during the initial stages of music composition and sketching, allowing artists to quickly and efficiently lay down their musical ideas. To keep the focus on composition without distractions, signal comes with intentional limitations:

- **Basic Sound Quality:** Prioritizes simplicity over high-quality sound production.
- **No Effects (Fx):** Excludes sound effects to streamline the music creation process.
- **Lightweight Design:** Optimized for minimal resource usage, ensuring a fast and responsive user experience.

By setting these constraints, signal aims to offer a streamlined and distraction-free environment, ideal for artists focusing on the core aspects of musical composition and idea development.

## Setup Instructions

### Cloning the Repository

1. Open your terminal.
2. Clone the repository by running:
   ```sh
   git clone https://github.com/ryohey/signal.git
   ```
3. Navigate into the project directory:
   ```sh
   cd signal
   ```

### Installing Dependencies

1. In the project root directory, run the following command to install the required dependencies:
   ```sh
   npm install
   ```

### Running the Application

> [!NOTE]
> The first time you run it, you will get a build error, so please run `npm run build` once before running `npm start`.

1. To start the application, run:
   ```sh
   npm start
   ```
2. The application should now be running on [http://localhost:3000](http://localhost:3000).

### Running via Docker
> [!NOTE] 
> with docker, `npm install` and `npm run build` will not be necessary, and you will only need to install **docker**, then **clone the repository**, then run the command specified below.

1. to run via docker, run:
   ```sh
   docker compose up
   # or 
   docker compose up -d
   ```
2. The application should now be accessible on [http://localhost:3000](http://localhost:3000).

## Contribution

As the creator of signal, I, [@ryohey](https://github.com/ryohey), welcome any form of contribution to this music sequencer application. Your support, whether it's through code improvements, bug fixes, or feedback, is invaluable in enhancing and evolving signal.

### Reporting Bugs

- Encountered a bug? Please use [GitHub Issues](https://github.com/ryohey/signal/issues) to report it. Your reports are crucial in identifying and resolving problems, ensuring a smoother experience for everyone.

### Join Our Discord Community

- I've set up a [Discord community](https://discord.gg/XQxzNdDJse) for signal users. It's a space for mutual support, sharing tips, and discussing music production. Your participation would be a wonderful addition to our growing community.

### Support Through GitHub Sponsors

- signal is a personal project that I've been passionately developing. If you like what you see and wish to support my efforts, you can do so through [GitHub Sponsors](https://github.com/sponsors/ryohey). Even the smallest contribution can make a significant difference and is deeply appreciated.

Your engagement, big or small, contributes greatly to the development of signal. Thank you for being a part of this journey, and I'm eager to see the impact of your contributions on this application.

## License
MIT. See [LICENSE](/LICENSE)
