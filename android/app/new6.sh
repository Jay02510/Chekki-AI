#!/bin/bash

# This script pushes a sample worksheet to the emulator and triggers a media scan
# so it appears in the Gallery/Photos app.

# 1. Define the path to your image
IMAGE_PATH="/Users/jasonbenjamin/Projects/Chekki-AI-main/public/chekki-actual.png"

# Pushing to DCIM/Camera is the most reliable way to get it into the Gallery
DEST_DIR="/sdcard/DCIM/Camera"
DEST_PATH="$DEST_DIR/chekki-actual.png"

echo "Creating directory $DEST_DIR..."
adb shell mkdir -p "$DEST_DIR"

echo "Pushing $IMAGE_PATH to $DEST_PATH..."
adb push "$IMAGE_PATH" "$DEST_PATH"

# 3. Force the Android Media Store to scan the new file
echo "Triggering media scan..."
adb shell cmd media_provider scan-file "$DEST_PATH"

# Alternative scan method for newer Android versions
echo "Triggering alternative scan..."
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://$DEST_PATH"

echo "----------------------------------------------------------"
echo "Done! If it still doesn't show in 'Photos':"
echo "1. Open the 'Files' app on the emulator."
echo "2. Go to 'Internal Storage' > 'DCIM' > 'Camera'."
echo "3. Tap the image to open it once. This often forces the Gallery to 'see' it."
echo "4. Close and reopen the Photos app."
echo "----------------------------------------------------------"
