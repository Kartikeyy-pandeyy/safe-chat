require('dotenv').config();
const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

const sts = new STSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

(async () => {
  try {
    const result = await sts.send(new GetCallerIdentityCommand({}));
    console.log("Connected to AWS as:", result.Arn);
  } catch (err) {
    console.error("Invalid credentials:", err);
  }
})();
