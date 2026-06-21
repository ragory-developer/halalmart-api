import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.AWS_S3_BUCKET!;
const productsDir = path.resolve(__dirname, "../../halalmart-web/public/assets/products");
const outputMapFile = path.resolve(__dirname, "../prisma/s3_image_map.json");

// Define a map from folder to category name
export const categoryMap: Record<string, string> = {
  "cat-01": "snacks-sweets",
  "cat-02": "household",
  "cat-03": "health-beauty", // Will add to seed.ts
  "cat-04": "health-beauty",
  "cat-05": "baby-care",     // Will add to seed.ts
  "cat-06": "home-kitchen",  // Will add to seed.ts
  "cat-07": "stationery",    // Will add to seed.ts
  "cat-08": "health-beauty",
  "cat-09": "home-lifestyle", // Will add to seed.ts
};

async function uploadFile(filePath: string, s3Key: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: fileStream,
    ContentType: "image/webp", // Assuming all are webp based on previous scans
    // Note: To make public, Bucket ACLs or Bucket Policies should allow public read. 
    // We will assume the bucket is configured for public access.
  });

  try {
    await s3Client.send(command);
    // Construct the public URL
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  } catch (error) {
    console.error(`Error uploading ${s3Key}:`, error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting S3 Upload Process for Product Images...");
  
  if (!fs.existsSync(productsDir)) {
    console.error(`❌ Products directory not found at: ${productsDir}`);
    process.exit(1);
  }

  const s3ImageMap: Array<{ localPath: string; s3Url: string; categorySlug: string; name: string }> = [];
  const categories = fs.readdirSync(productsDir);

  for (const category of categories) {
    const categoryPath = path.join(productsDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath);
    console.log(`📁 Processing ${category} (${files.length} files)...`);

    const categorySlug = categoryMap[category] || "groceries";

    for (const file of files) {
      if (!file.endsWith('.webp') && !file.endsWith('.jpg') && !file.endsWith('.png')) continue;
      
      const filePath = path.join(categoryPath, file);
      const s3Key = `products/${category}/${file}`;
      
      console.log(`  ⬆️ Uploading ${file}...`);
      try {
        const s3Url = await uploadFile(filePath, s3Key);
        
        // Generate a nice name from the filename
        let name = file.replace(/\.(webp|jpg|png|jpeg)$/, '');
        name = name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        s3ImageMap.push({
          localPath: filePath,
          s3Url,
          categorySlug,
          name,
        });
      } catch (err) {
        console.error(`  ❌ Failed to upload ${file}`);
      }
    }
  }

  // Save the mapping to a JSON file
  fs.writeFileSync(outputMapFile, JSON.stringify(s3ImageMap, null, 2));
  console.log(`✅ Upload complete! Wrote mapping to ${outputMapFile}`);
}

main().catch(console.error);
