import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function run() {
  try {
    console.log(`Checking bucket: ${process.env.AWS_S3_BUCKET}`);
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      MaxKeys: 1
    });
    const response = await s3.send(command);
    console.log('✅ Bucket connection successful!');
  } catch (err) {
    console.error('❌ Bucket connection failed:', err.message);
  }
}

run();
