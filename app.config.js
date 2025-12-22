const fs = require('fs');
const path = require('path');

// Read the existing app.json
const appJson = require('./app.json');

module.exports = ({ config }) => {
  // During EAS Build, create google-services.json from environment variable
  if (process.env.GOOGLE_SERVICES_JSON) {
    console.log('🔧 Creating google-services.json from environment variable...');
    
    try {
      const googleServicesPath = path.join(__dirname, 'android/app/google-services.json');
      
      // Decode base64
      const googleServicesContent = Buffer.from(
        process.env.GOOGLE_SERVICES_JSON,
        'base64'
      ).toString('utf-8');
      
      // Ensure directory exists
      const dir = path.dirname(googleServicesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('📁 Created android/app directory');
      }
      
      // Write the file
      fs.writeFileSync(googleServicesPath, googleServicesContent, 'utf-8');
      
      const stats = fs.statSync(googleServicesPath);
      console.log(`✅ google-services.json created successfully (${stats.size} bytes)`);
      
      // Verify it's valid JSON
      const parsed = JSON.parse(googleServicesContent);
      console.log(`✅ Verified: Contains project_id: ${parsed.project_info?.project_id}`);
    } catch (error) {
      console.error('❌ Failed to create google-services.json:', error.message);
      throw error;
    }
  } else {
    console.log('⚠️  GOOGLE_SERVICES_JSON environment variable not set');
  }
  
  // Return the config from app.json
  return {
    ...appJson.expo,
  };
};
