const appJson = require('./app.json');
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const appConfig = { ...appJson.expo };

  // Add googleServicesFile if it exists (created by eas-build-pre-install.sh)
  const googleServicesPath = path.join(__dirname, 'google-services.json');
  if (fs.existsSync(googleServicesPath)) {
    appConfig.android = {
      ...appConfig.android,
      googleServicesFile: './google-services.json',
    };
    console.log('✅ googleServicesFile added to config');
  }

  return appConfig;
};
