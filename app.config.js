const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

if (process.env.GOOGLE_SERVICES_JSON && process.env.EAS_BUILD === 'true') {
  const filePath = path.join(__dirname, 'android/app/google-services.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const content = Buffer.from(process.env.GOOGLE_SERVICES_JSON, 'base64').toString('utf-8');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ google-services.json created');
}

module.exports = ({ config }) => ({ ...appJson.expo });
