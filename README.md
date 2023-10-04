# FlexPlayer
FlexPlayer plays multiple video files in a grid. FlexPlayer is a desktop application built in Electron.

## Features
- D&D to add video files.
- Play/stop, mute and loop playback of individual videos.
- Ctrl key + mouse wheel to adjust video displayed per line.
- Spacebar to play/stop all videos.
- Loop playback of In/Out range.
- Full screen playback.

## Codec and Container Support
See [https://www.chromium.org/audio-video/](https://www.chromium.org/audio-video/).

## Notes
- A powerful GPU is required to play large numbers of files simultaneously.
- Still in the process of being built. It is a bit of a mess and has a lot of problems.

## Screenshot
![FlexPlayer](https://raw.githubusercontent.com/ricmsd/flexplayer/main/docs/screenshot.png)

![FlexPlayer](https://raw.githubusercontent.com/ricmsd/flexplayer/main/docs/screenshot-4.png)

## How to build
### Requirements
- Node.js (Tested on v18.17.1)
- Windows OS (Tested on Windows 11, not sure if it works as expected on MacOS or Linux)

### Build
    git clone https://github.com/ricmsd/flexplayer.git
    cd flexplayer/player
    npm install
    npm run build
    cd ../electron
    npm install
    npm run forge:make

If the above is successful, the installer will output `flexplayer-X.X.X Setup.exe` (where `X.X.X` is the version number) under `flexplayer/electron/out`. Run this to install.

If you want to try it out without installing it, run `npm run start` instead of `npm run forge:make`.
