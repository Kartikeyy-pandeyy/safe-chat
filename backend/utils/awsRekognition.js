const { RekognitionClient } = require('@aws-sdk/client-rekognition');
const { fromIni } = require('@aws-sdk/credential-providers');

const rekognition = new RekognitionClient({
  region: 'us-east-1',
  credentials: fromIni({ profile: 'default' }), // Use CLI credentials
});

module.exports = rekognition;