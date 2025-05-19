const { RekognitionClient } = require('@aws-sdk/client-rekognition');
const dotenv = require('dotenv');
dotenv.config(); // Ensure environment variables are loaded

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = rekognition;
