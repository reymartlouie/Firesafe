#!/usr/bin/env bash
set -e

echo "🔧 EAS Build Pre-Install: Creating google-services.json"

if [ -z "$GOOGLE_SERVICES_JSON" ]; then
    echo "❌ ERROR: GOOGLE_SERVICES_JSON environment variable is not set"
    exit 1
fi

echo "📁 Creating android/app directory..."
mkdir -p android/app

echo "📝 Decoding and writing google-services.json..."
echo "$GOOGLE_SERVICES_JSON" | base64 -d > android/app/google-services.json

if [ -f android/app/google-services.json ]; then
    FILE_SIZE=$(wc -c < android/app/google-services.json)
    echo "✅ SUCCESS: google-services.json created ($FILE_SIZE bytes)"
    ls -lh android/app/google-services.json
else
    echo "❌ ERROR: Failed to create google-services.json"
    exit 1
fi
