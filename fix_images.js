const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'prisma', 'faker', 'data.json');
const dataRaw = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(dataRaw);

const placeholderUrl = 'https://placehold.co/300x300?text=Product+Image';

// Build a dictionary of working images per category
const categoryImages = {};
data.products.forEach(p => {
    if (p.image && !p.image.includes('placehold.co') && !p.image.includes('othoba-loader.jpg')) {
        if (!categoryImages[p.categorySlug]) {
            categoryImages[p.categorySlug] = [];
        }
        categoryImages[p.categorySlug].push(p.image);
    }
});

let replacedCount = 0;
data.products.forEach(p => {
    if (p.image && p.image.includes('placehold.co')) {
        let replacement = null;
        if (categoryImages[p.categorySlug] && categoryImages[p.categorySlug].length > 0) {
            // Pick random image from same category
            const idx = Math.floor(Math.random() * categoryImages[p.categorySlug].length);
            replacement = categoryImages[p.categorySlug][idx];
        } else {
            // Fallback: pick any working image
            const allCategories = Object.keys(categoryImages);
            const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
            const idx = Math.floor(Math.random() * categoryImages[randomCat].length);
            replacement = categoryImages[randomCat][idx];
        }
        
        p.image = replacement;
        p.images = JSON.stringify([replacement]);
        replacedCount++;
    }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Replaced ${replacedCount} placeholder images with similar real images.`);
