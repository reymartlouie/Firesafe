#!/bin/bash

# Create google-services.json from base64 environment variable
if [ -n "$GOOGLE_SERVICES_JSON_BASE64" ]; then
  echo "Creating google-services.json from environment variable..."
  echo "$GOOGLE_SERVICES_JSON_BASE64" | base64 --decode > ./google-services.json
  echo "google-services.json created in project root"

  # Also copy to android/app/ where Gradle expects it
  if [ -d "./android/app" ]; then
    cp ./google-services.json ./android/app/google-services.json
    echo "google-services.json copied to android/app/"
  fi
fi
