cat > app.config.js << 'EOF'
const appJson = require('./app.json');

module.exports = ({ config }) => {
  return {
    ...appJson.expo,
  };
};
EOF