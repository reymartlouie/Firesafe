#!/bin/bash
set -e

if [ -z "$GOOGLE_SERVICES_JSON_BASE64" ]; then
  echo "ERROR: GOOGLE_SERVICES_JSON_BASE64 is not set. Push notifications will not work."
  exit 1
fi

echo "Decoding google-services.json from EAS secret..."
mkdir -p android/app
echo "$GOOGLE_SERVICES_JSON_BASE64" | base64 --decode > android/app/google-services.json
echo "google-services.json written successfully."
ls -la android/app/google-services.json
