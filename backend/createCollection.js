// const { RekognitionClient, CreateCollectionCommand } = require('@aws-sdk/client-rekognition');

// const rekognition = new RekognitionClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const createCollection = async () => {
//   const params = {
//     CollectionId: process.env.AWS_REKOGNITION_COLLECTION,
//   };

//   try {
//     const command = new CreateCollectionCommand(params);
//     const result = await rekognition.send(command);
//     console.log('Collection created:', result);
//   } catch (error) {
//     if (error.name === 'ResourceAlreadyExistsException') {
//       console.log('Collection already exists.');
//     } else {
//       console.error('Error creating collection:', error);
//     }
//   }
// };

// createCollection();




require('dotenv').config();  // <--- load .env variables first

const { RekognitionClient, CreateCollectionCommand } = require('@aws-sdk/client-rekognition');

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const createCollection = async () => {
  const params = {
    CollectionId: process.env.AWS_REKOGNITION_COLLECTION,
  };

  try {
    const command = new CreateCollectionCommand(params);
    const result = await rekognition.send(command);
    console.log('Collection created:', result);
  } catch (error) {
    if (error.name === 'ResourceAlreadyExistsException') {
      console.log('Collection already exists.');
    } else {
      console.error('Error creating collection:', error);
    }
  }
};

createCollection();
