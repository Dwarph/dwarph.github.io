# Changelog

Everything new since we first set sail.

## Transcripts + New Player (v0.12.0)
17 September 2026

- Added: Transcripts.
- Changed: The recording preview has its own player controls.
- Changed: The window on macOS now wears Set Sail's own title bar, the way it already did on Windows: a plain band in the app's colour, no title, and the traffic lights where they have always been.
- Changed: The window can no longer be resized by dragging it.
- Fixed: Flipping the camera, microphone, or system audio chip mid-recording did not persist after the take ended.

## Quick Record Fix (v0.11.1)
16 September 2026

- Fixed: Turning the camera, microphone, or system audio on from the Quick Record bar could get left out of the recording it started.

## Feedback + Audio Levels (v0.11.0)
15 September 2026

- Added: Send a bug report or a feature request without leaving the app.
- Added: Optional crash reports and usage stats, to help fix and improve Set Sail.
- Added: Set your microphone and system audio levels before you record.
- Fixed: Slider values in Settings are readable in dark mode when the bar fills in behind them.
- Fixed: Dragging the volume slider on a finished recording's preview no longer starts dragging the file out of the app.
- Fixed: With background blur on, your webcam no longer appears before the blur does.
- Removed: The Enhance microphone switch, and the processing behind it.

## Quick Toggles, Copy + Drag Videos, Overhauled Settings (v0.10.0)
10 September 2026

- Added: Copy or drag a finished recording straight off the Land ahoy screen.
- Added: Turn the webcam, microphone and system audio on or off from the Quick Record bar.
- Fixed: The preview of what you're about to record stays up to date.
- Fixed: Clicking Set Sail's icon in the Windows notification area now opens the app.
- Fixed: Double-clicking the recording bar no longer flings it to the bottom of the screen.
- Fixed: The start controls no longer jump the last stretch when you leave Area mode.
- Fixed: Choosing Area from Quick Record no longer brings up the Set Sail window.
- Fixed: Quick Record starts sooner on Windows.
- Changed: Settings is no longer one long list.
- Changed: Light, dark and system now sit in the Settings header, as three small icons in the top right, instead of as a row in the list.
- Changed: The webcam's shadow controls only appear when the shadow is on.
- Changed: Clearer wording on the "Show Set Sail UI while recording" setting.
- Changed: The recording bar's mic and system-audio meters are easier to read.
- Changed: The Quick Record bar shows that your recording is getting ready.
- Removed: The hint under Launch at startup on Windows, which only repeated the label.

## A New Look (v0.9.0)
5 September 2026

- Changed: Set Sail has a new look: the warm cream and beige are replaced by a cleaner, quieter palette in both light and dark.

## Quiet Windows Startup (v0.8.1)
4 September 2026

- Changed: On Windows startup, Set Sail opens to the taskbar, and doesn't show its window.

## Quick Record, Taskbar Icons, And Smaller Recordings (v0.8.0)
4 September 2026

- Added: Quick Record: start a take from anywhere, without going to Set Sail.
- Added: A menu bar icon on macOS, and a taskbar icon on Windows.
- Added: On Windows, Set Sail can now launch automatically at login and run like a proper background service.
- Added: A confirmed region can now be moved and edge-resized, not just corner-resized.
- Added: Messages worth interrupting a recording for now appear on the status bar.
- Changed: MP4 recordings are much smaller.
- Changed: Improved the webcam bubble's grow/shrink animation performance on Windows.
- Changed: The Quality setting is now High / Medium / Low, was High / Balanced / Small, with a line under it saying what each one caps the picture at.
- Changed: The Region capture mode is now called Area, matching the "Select area…" / "Record area" language already used throughout that flow.
- Changed: Deleting a take on Land ahoy now says so in words, not just in colour.
- Fixed: On Windows, switching modes or leaving a recording's preview no longer stalls the cursor for a moment.
- Fixed: Turning the webcam off during a recording now shows it shrinking away in the recorded file, not just on your own screen.
- Fixed: The window picker's thumbnails no longer flash when you open Pick Window
- Fixed: With Show Set Sail while recording on, a screen or area take's first frames no longer catch the countdown's fading "1".
- Fixed: The camera and microphone now follow along when the hardware changes, not just at the moment a stream first opens.
- Fixed: The screen picker and the idle screen's preview no longer show Set Sail's own window sitting on top of the desktop they're previewing. Both now leave Set Sail's window out of the capture, the same way its actual recordings already did.
- Fixed: Improved support for scaled displays on Windows.
- Fixed: Windows no longer draws its yellow capture border over your recordings.
- Fixed: The webcam bubble's resize handles and close button no longer end up in your recordings.
- Fixed: The webcam, microphone and system-audio chips no longer go blank while an area recording is getting ready.
- Fixed: Esc now cancels a region selection immediately, without a click first.
- Removed: Colour correction, the Settings screen that let you dial in a levels correction for recordings coming out washed out on an HDR display, added in 0.6.0.

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
