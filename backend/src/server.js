require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require('./app');

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Backend] Risk Assessment API listening on port ${PORT}`);
  });
}

module.exports = app;
