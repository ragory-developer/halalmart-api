import fs from 'fs';
import path from 'path';

export interface ParsedProduct {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  stock: number;
  image: string;
  images: string; // JSON array string
  unit: string;
  isHalal: boolean;
  featured: boolean;
  categorySlug: string;
  brandSlug: string | null;
}

export async function generateProductsFromData(): Promise<{ 
  products: ParsedProduct[], 
  brands: { name: string, slug: string }[], 
  categories: { name: string, slug: string }[] 
}> {
  const dataPath = path.join(__dirname, 'data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('data.json not found in prisma/faker/');
  }
  
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}
