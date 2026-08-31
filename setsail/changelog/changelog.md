# Changelog

Everything new since we first set sail.

## This Changelog! (v0.7.0)
31 August 2026

- Added: Set Sail can now tell you what's new.

## HDR Colour Correction (v0.6.0)
31 August 2026

- Added: Colour correction setting, for recordings that come out washed out on an HDR display.
- Added: Recording a window now names the file after it.
- Fixed: The screen and window pictures in the app are no longer washed out when recording with HDR enabled
- Fixed: Windows no longer draws its own yellow capture border over Set Sail's 
- Fixed: The main window no longer jumps across the screen when you drag it past the webcam bubble.
- Fixed: The webcam bubble stays where you put it when you toggle the camera off and on.
- Fixed: The webcam button no longer starts spinning forever when the camera is already on.

## Audio and Display Fixes (v0.5.1)
30 August 2026

- Fixed: A recording on a machine whose sound device runs at 96kHz no longer fails outright, losing the take.

## Bubble Animations and Windows Polish (v0.5.0)
30 August 2026

- Fixed: Dragging a bubble's corner grip no longer reverses direction part-way through.
- Fixed: The microphone no longer boosts the room when nobody is talking.
- Fixed: A change in microphone level part-way through a take no longer arrives as a jump.
- Fixed: Clicking or dragging Set Sail's window when it wasn't focused no longer hangs for half a second.
- Added: The webcam button now spins when the camera is still opening.
- Changed: The camera bubble now grows into place when it appears, and shrinks away when it goes.
- Changed: The bubble's handles slide out from its edge rather than fading in where they sit, and tuck back behind it on the way out.
- Changed: The taskbar icon no longer sits on a blue square on Windows.

## Smarter Recording Resolution (v0.4.0)
28 August 2026

- Changed: Recording resolution now follows the quality presets: 2160p at High, 1440p at Balanced, 1080p at Small.
- Fixed: MP4 no longer falls back to WebM on some Macs driving a large display.
- Fixed: Restart now keeps the camera, microphone and system audio exactly as you left them.
- Fixed: Full screen on the recording preview now fills the screen, instead of only filling the Set Sail window.
- Fixed: The Set sail button now says what it's doing while the app starts up.

## A Native Windows Title Bar (v0.3.1)
27 August 2026

- Fixed: MP4 recording now has a final software H.264 fallback.
- Fixed: The recording frame around a window now hugs its edges on Windows.
- Fixed: Opening About no longer flashes a scrollbar on Windows.
- Changed: The title bar on Windows is now custom + beautiful :)
- Changed: Toasts now sit at the bottom of the window, level with the button below them, instead of floating somewhere above it.

## Multi-Monitor Reliability (v0.3.0)
25 August 2026

- Fixed: Dragging the camera bubble between screens no longer jitters or throws it to the wrong side.
- Fixed: The camera bubble stays sharp after moving to a screen with different scaling.
- Fixed: A region drag that leaves the screen no longer records the wrong area.
- Fixed: Unplugging the screen you were recording no longer deletes the recording.
- Fixed: The camera bubble no longer swallows clicks after an interrupted drag.
- Changed: The recording status bar now appears on the screen being recorded, rather than always on the main one
- Changed: Set Sail's window now opens on the screen you're working on, instead of always on the main display.
- Changed: Set Sail now notices monitors being plugged in, unplugged, or rearranged.
