#!/usr/bin/env sh
# Tunnel host Next (3000) + API (4000) into the Android emulator.
# Reverses reset after emulator cold boot / ADB reconnect — re-run before opening Shelf.
set -e
ADB="${ADB:-adb}"
if ! command -v "$ADB" >/dev/null 2>&1; then
  ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
fi
if ! command -v "$ADB" >/dev/null 2>&1 && [ ! -x "$ADB" ]; then
  echo "adb not found. Install Android platform-tools or set ADB=/path/to/adb" >&2
  exit 1
fi
"$ADB" reverse tcp:3000 tcp:3000
"$ADB" reverse tcp:4000 tcp:4000
echo "adb reverse:"
"$ADB" reverse --list
