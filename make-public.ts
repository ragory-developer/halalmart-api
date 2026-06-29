import { S3Client, PutBucketPolicyCommand, PutPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
const bucketName = process.env.AWS_S3_BUCKET || '';

const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

async function makePublic() {
  try {
    console.log(`Disabling Block Public Access for ${bucketName}...`);
    await client.send(new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      }
    }));
    console.log('Block Public Access disabled successfully.');
    
    // Wait a moment for settings to propagate
    await new Promise(r => setTimeout(r, 2000));

    console.log(`Applying Public Read bucket policy to ${bucketName}...`);
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };
    await client.send(new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    }));
    console.log('Bucket policy applied successfully! All images should now be visible.');
  } catch (error: any) {
    console.error('Failed to make bucket public:', error.message);
  }
}
makePublic();
