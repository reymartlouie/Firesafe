#!/usr/bin/env bash
set -euo pipefail
echo "🔧 Creating google-services.json from EAS environment variable"
mkdir -p android/app
echo "$GOOGLE_SERVICES_JSON" | base64 -d > android/app/google-services.json
FILE_SIZE=$(wc -c < android/app/google-services.json)
echo "✅ Created: $FILE_SIZE bytes"
[ "$FILE_SIZE" -lt 100 ] && echo "❌ File too small!" && exit 1
python3 -m json.tool android/app/google-services.json > /dev/null || (echo "❌ Invalid JSON!" && exit 1)
echo "✅ Valid JSON - Ready for build"
