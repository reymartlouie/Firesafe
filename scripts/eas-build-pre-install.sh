#!/usr/bin/env bash

set -euo pipefail

echo "🔧 Setting up google-services.json from EAS secret..."

# Check if the secret exists
if [ -z "${GOOGLE_SERVICES_JSON:-}" ]; then
    echo "❌ Error: GOOGLE_SERVICES_JSON environment variable not set"
    exit 1
fi

# Create directory if it doesn't exist
mkdir -p android/app

# Decode base64 and write to file
echo "$GOOGLE_SERVICES_JSON" | base64 -d > android/app/google-services.json

# Verify the file was created
if [ -f android/app/google-services.json ]; then
    echo "✅ google-services.json created successfully"
    echo "📄 File size: $(wc -c < android/app/google-services.json) bytes"
else
    echo "❌ Failed to create google-services.json"
    exit 1
fi
