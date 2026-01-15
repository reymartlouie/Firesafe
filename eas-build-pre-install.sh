#!/bin/bash

# Create google-services.json from base64 environment variable
if [ -n "$GOOGLE_SERVICES_JSON_BASE64" ]; then
  echo "Creating google-services.json from environment variable..."
  echo "$GOOGLE_SERVICES_JSON_BASE64" | base64 --decode > ./google-services.json
  echo "✅ google-services.json created in project root"
fi
