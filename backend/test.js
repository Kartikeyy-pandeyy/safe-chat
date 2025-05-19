require('dotenv').config();
const { RekognitionClient, CreateCollectionCommand } = require('@aws-sdk/client-rekognition');

const client = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function test() {
  try {
    const command = new CreateCollectionCommand({
      CollectionId: process.env.AWS_REKOGNITION_COLLECTION,
    });
    const result = await client.send(command);
    console.log('Success:', result);
  } catch (err) {
    console.error('Error:', err.name, err.message);
  }
}

test();
