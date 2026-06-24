export const categories = [
  // Meat & Seafood
  { name: 'Halal Meat', slug: 'halal-meat' },
  { name: 'Fresh Poultry', slug: 'fresh-poultry', parent: 'halal-meat' },
  { name: 'Fresh Beef', slug: 'fresh-beef', parent: 'halal-meat' },
  { name: 'Fresh Lamb', slug: 'fresh-lamb', parent: 'halal-meat' },
  { name: 'Fresh Goat', slug: 'fresh-goat', parent: 'halal-meat' },
  { name: 'Seafood', slug: 'seafood' },
  { name: 'Frozen Meat', slug: 'frozen-meat', parent: 'frozen-foods' },
  // Groceries & Pantry
  { name: 'Groceries', slug: 'groceries' },
  { name: 'Rice', slug: 'rice', parent: 'groceries' },
  { name: 'Basmati Rice', slug: 'basmati-rice', parent: 'rice' },
  { name: 'Jasmine Rice', slug: 'jasmine-rice', parent: 'rice' },
  { name: 'Lentils & Dal', slug: 'lentils-dal', parent: 'groceries' },
  { name: 'Flour & Atta', slug: 'flour-atta', parent: 'groceries' },
  { name: 'Bread & Bakery', slug: 'bread-bakery' },
  { name: 'Paratha & Roti', slug: 'paratha-roti', parent: 'bread-bakery' },
  { name: 'Spices & Seasonings', slug: 'spices-seasonings', parent: 'groceries' },
  { name: 'Whole Spices', slug: 'whole-spices', parent: 'spices-seasonings' },
  { name: 'Ground Spices', slug: 'ground-spices', parent: 'spices-seasonings' },
  { name: 'Mixed Spices', slug: 'mixed-spices', parent: 'spices-seasonings' },
  { name: 'Salt & Sugar', slug: 'salt-sugar', parent: 'groceries' },
  { name: 'Oil & Ghee', slug: 'oil-ghee', parent: 'groceries' },
  { name: 'Pickles & Chutneys', slug: 'pickles-chutneys', parent: 'groceries' },
  { name: 'Pastes & Sauces', slug: 'pastes-sauces', parent: 'groceries' },
  { name: 'Canned Goods', slug: 'canned-goods', parent: 'groceries' },
  // Snacks & Beverages
  { name: 'Snacks & Sweets', slug: 'snacks-sweets' },
  { name: 'Biscuits & Cookies', slug: 'biscuits-cookies', parent: 'snacks-sweets' },
  { name: 'Chips & Namkeen', slug: 'chips-namkeen', parent: 'snacks-sweets' },
  { name: 'Traditional Sweets', slug: 'traditional-sweets', parent: 'snacks-sweets' },
  { name: 'Beverages', slug: 'beverages' },
  { name: 'Tea', slug: 'tea', parent: 'beverages' },
  { name: 'Coffee', slug: 'coffee', parent: 'beverages' },
  { name: 'Juices', slug: 'juices', parent: 'beverages' },
  { name: 'Sodas & Syrups', slug: 'sodas-syrups', parent: 'beverages' },
  // Dairy & Eggs
  { name: 'Dairy & Eggs', slug: 'dairy-eggs' },
  { name: 'Milk', slug: 'milk', parent: 'dairy-eggs' },
  { name: 'Cheese', slug: 'cheese', parent: 'dairy-eggs' },
  { name: 'Butter & Margarine', slug: 'butter-margarine', parent: 'dairy-eggs' },
  { name: 'Yogurt', slug: 'yogurt', parent: 'dairy-eggs' },
  { name: 'Eggs', slug: 'eggs', parent: 'dairy-eggs' },
  // Frozen
  { name: 'Frozen Foods', slug: 'frozen-foods' },
  { name: 'Frozen Vegetables', slug: 'frozen-vegetables', parent: 'frozen-foods' },
  { name: 'Frozen Snacks', slug: 'frozen-snacks', parent: 'frozen-foods' },
  // Produce
  { name: 'Fresh Produce', slug: 'fresh-produce' },
  { name: 'Fresh Vegetables', slug: 'fresh-vegetables', parent: 'fresh-produce' },
  { name: 'Fresh Fruits', slug: 'fresh-fruits', parent: 'fresh-produce' },
  { name: 'Herbs', slug: 'herbs', parent: 'fresh-produce' },
  // Household & Personal Care
  { name: 'Personal Care', slug: 'personal-care' },
  { name: 'Hair Care', slug: 'hair-care', parent: 'personal-care' },
  { name: 'Skin Care', slug: 'skin-care', parent: 'personal-care' },
  { name: 'Oral Care', slug: 'oral-care', parent: 'personal-care' },
  { name: 'Household', slug: 'household' },
  { name: 'Cleaning Supplies', slug: 'cleaning-supplies', parent: 'household' },
];

export const brands = [
  { name: 'Shan', slug: 'shan' },
  { name: 'MDH', slug: 'mdh' },
  { name: 'National', slug: 'national' },
  { name: 'Pran', slug: 'pran' },
  { name: "Haldiram's", slug: 'haldirams' },
  { name: 'Amul', slug: 'amul' },
  { name: 'Tilda', slug: 'tilda' },
  { name: 'Daawat', slug: 'daawat' },
  { name: 'Kohinoor', slug: 'kohinoor' },
  { name: 'Maggi', slug: 'maggi' },
  { name: 'Knorr', slug: 'knorr' },
  { name: 'Bombay Sweets', slug: 'bombay-sweets' },
  { name: 'Laziza', slug: 'laziza' },
  { name: 'Al Islami', slug: 'al-islami' },
  { name: 'Sadia', slug: 'sadia' },
  { name: 'Doux', slug: 'doux' },
  { name: 'Seara', slug: 'seara' },
  { name: 'Almarai', slug: 'almarai' },
  { name: 'Lipton', slug: 'lipton' },
  { name: 'Brooke Bond', slug: 'brooke-bond' },
  { name: 'Taj Mahal', slug: 'taj-mahal' },
  { name: 'Rooh Afza', slug: 'rooh-afza' },
  { name: 'Hemani', slug: 'hemani' },
  { name: 'Dabur', slug: 'dabur' },
  { name: 'Himalaya', slug: 'himalaya' },
  { name: 'Parachute', slug: 'parachute' },
  { name: 'Patanjali', slug: 'patanjali' },
  { name: 'Aashirvaad', slug: 'aashirvaad' },
  { name: 'Ziyad', slug: 'ziyad' },
  { name: 'Midamar', slug: 'midamar' },
  { name: 'Al Safa', slug: 'al-safa' },
  { name: 'Ahmed Foods', slug: 'ahmed-foods' },
];

function generateProducts() {
  const products = [];
  
  // A helper to quickly make simple products
  const add = (name: string, price: number, cat: string, brand: string | null = null, desc: string = '', isHalal: boolean = true, customKeyword: string | null = null) => {
    // Generate a keyword from the category slug (e.g. fresh-poultry -> poultry, basmati-rice -> rice)
    const keyword = customKeyword || cat.split('-').pop() || 'food';
    // Using loremflickr to get realistic free images from flickr/unsplash tagged with food and the category
    // We add Math.random() as a 'lock' param so products with the same keyword get different images
    const imageId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://loremflickr.com/600/600/food,${keyword}?lock=${imageId}`;

    products.push({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description: desc || `Premium quality ${name} available at City Halal Market.`,
      shortDescription: name,
      price,
      stock: Math.floor(Math.random() * 100) + 20,
      image: imageUrl,
      images: JSON.stringify([imageUrl]),
      unit: 'pcs',
      isHalal,
      featured: products.length % 7 === 0,
      categorySlug: cat,
      brandSlug: brand
    });
  };

  // 1. Meat & Poultry
  add('Whole Halal Chicken (With Skin)', 12.99, 'fresh-poultry', null, 'Freshly cut zabiha halal whole chicken.', true, 'raw,chicken,whole');
  add('Halal Chicken Breast Boneless', 6.99, 'fresh-poultry', null, 'Cleaned and boneless chicken breast.', true, 'raw,chicken,breast');
  add('Halal Chicken Drumsticks', 5.49, 'fresh-poultry', null, 'Fresh drumsticks perfect for frying or curries.', true, 'raw,chicken,legs');
  add('Halal Chicken Wings', 6.49, 'fresh-poultry', null, 'Fresh zabiha halal chicken wings.', true, 'raw,chicken,wings');
  add('Halal Whole Duck', 22.99, 'fresh-poultry', null, 'Premium Grade A Halal Whole Duck.', true, 'raw,duck,meat');
  add('Halal Beef Curry Cut (Bone-in)', 8.99, 'fresh-beef', null, 'Fresh beef curry cut.', true, 'raw,beef,meat');
  add('Halal Beef Minced (Keema)', 9.49, 'fresh-beef', null, 'Lean ground halal beef.', true, 'raw,ground,beef');
  add('Halal Veal Boneless', 10.99, 'fresh-beef', null, 'Tender halal veal.', true, 'raw,veal,meat');
  add('Halal Beef Ribeye Steak', 18.99, 'fresh-beef', null, 'Premium Halal Ribeye Steak.', true, 'raw,ribeye,steak');
  add('Halal Wagyu Beef A5', 120.99, 'fresh-beef', null, 'Luxury Halal Wagyu Beef.', true, 'raw,wagyu,beef');
  add('Halal Beef Short Ribs', 14.99, 'fresh-beef', null, 'Juicy Halal Beef Short Ribs.', true, 'raw,beef,ribs');
  add('Halal Goat Leg (Whole)', 89.99, 'fresh-goat', null, 'Whole leg of goat.', true, 'raw,goat,meat');
  add('Halal Goat Curry Cut', 14.99, 'fresh-goat', null, 'Fresh goat meat for curries.', true, 'raw,goat,meat');
  add('Halal Lamb Chops', 16.99, 'fresh-lamb', null, 'Premium Halal Lamb chops.', true, 'raw,lamb,chops');
  add('Halal Lamb Minced', 13.99, 'fresh-lamb', null, 'Lean ground lamb meat.', true, 'raw,ground,lamb');
  add('Halal Mutton Shoulder', 18.99, 'fresh-lamb', null, 'Tender halal mutton shoulder.', true, 'raw,mutton,meat');
  add('Fresh Atlantic Salmon Fillet', 15.99, 'seafood', null, '', false);
  add('Tilapia Fish Cleaned', 6.99, 'seafood', null, '', false);
  add('Rohu Fish Cut (Rui)', 8.99, 'seafood', null, '', false);
  add('Hilsha Fish Whole (Ilish)', 24.99, 'seafood', null, '', false);
  add('Shrimp (Large Peeled)', 14.99, 'seafood', null, '', false);

  // 2. Rice
  add('Tilda Pure Basmati Rice 10lb', 18.99, 'basmati-rice', 'tilda');
  add('Daawat Traditional Basmati Rice 10lb', 16.99, 'basmati-rice', 'daawat');
  add('Kohinoor Extra Long Basmati Rice 10lb', 17.49, 'basmati-rice', 'kohinoor');
  add('Jasmine Scented Rice 5lb', 8.99, 'jasmine-rice', null, '', false);
  add('Pran Chinigura Rice 1kg', 4.99, 'rice', 'pran');

  // 3. Spices & Seasonings
  add('Shan Bombay Biryani Masala', 1.99, 'mixed-spices', 'shan');
  add('Shan Chicken Tikka Masala', 1.99, 'mixed-spices', 'shan');
  add('MDH Garam Masala 100g', 2.49, 'mixed-spices', 'mdh');
  add('National Karahi Gosht Masala', 1.89, 'mixed-spices', 'national');
  add('Laziza Nihari Masala', 1.99, 'mixed-spices', 'laziza');
  add('Pran Turmeric Powder (Holud) 200g', 3.49, 'ground-spices', 'pran');
  add('Coriander Powder (Dhania) 200g', 2.99, 'ground-spices');
  add('Cumin Powder (Jeera) 200g', 3.99, 'ground-spices');
  add('Whole Cumin Seeds (Jeera) 100g', 2.49, 'whole-spices');
  add('Whole Green Cardamom (Elaichi) 50g', 5.99, 'whole-spices');
  add('Whole Cloves (Laung) 50g', 4.99, 'whole-spices');
  add('Cinnamon Sticks (Dalchini) 100g', 3.49, 'whole-spices');

  // 4. Lentils & Dal
  add('Red Lentils (Masoor Dal) 2lb', 3.99, 'lentils-dal');
  add('Yellow Moong Dal 2lb', 4.49, 'lentils-dal');
  add('Chana Dal 2lb', 3.49, 'lentils-dal');
  add('Toor Dal (Pigeon Peas) 2lb', 4.99, 'lentils-dal');
  add('Whole Black Urad Dal 2lb', 4.29, 'lentils-dal');

  // 5. Flour & Atta
  add('Aashirvaad Whole Wheat Atta 10lb', 12.99, 'flour-atta', 'aashirvaad');
  add('Pillsbury Chakki Fresh Atta 10lb', 11.99, 'flour-atta');
  add('Besan (Gram Flour) 2lb', 3.99, 'flour-atta');
  add('Rice Flour 2lb', 2.99, 'flour-atta');

  // 6. Oil & Ghee
  add('Amul Pure Ghee 1L', 14.99, 'oil-ghee', 'amul');
  add('Dabur Mustard Oil 1L', 8.99, 'oil-ghee', 'dabur');
  add('Ziyad Extra Virgin Olive Oil 1L', 12.49, 'oil-ghee', 'ziyad');
  add('Canola Oil 3L', 11.99, 'oil-ghee', null, '', false);
  add('Pran Sunflower Oil 1L', 5.99, 'oil-ghee', 'pran');

  // 7. Pickles & Chutneys
  add('Ahmed Foods Mixed Pickle (Achar) 330g', 3.49, 'pickles-chutneys', 'ahmed-foods');
  add('National Mango Pickle 330g', 3.29, 'pickles-chutneys', 'national');
  add('Priya Tomato Pickle', 3.99, 'pickles-chutneys');
  add('Shan Garlic Pickle', 3.49, 'pickles-chutneys', 'shan');

  // 8. Pastes & Sauces
  add('Maggi Hot & Sweet Tomato Chilli Sauce', 4.49, 'pastes-sauces', 'maggi');
  add('Knorr Tomato Ketchup', 3.99, 'pastes-sauces', 'knorr');
  add('Ginger Garlic Paste 300g', 4.99, 'pastes-sauces');
  add('Tamarind Paste (Imli) 200g', 2.99, 'pastes-sauces');

  // 9. Snacks & Sweets
  add('Haldirams Aloo Bhujia 200g', 2.49, 'chips-namkeen', 'haldirams');
  add('Haldirams Moong Dal 200g', 2.49, 'chips-namkeen', 'haldirams');
  add('Bombay Sweets Chanachur 300g', 3.49, 'chips-namkeen', 'bombay-sweets');
  add('Lays Magic Masala Chips', 1.99, 'chips-namkeen', null, '', false);
  add('Kurkure Masala Munch', 1.49, 'chips-namkeen');
  add('Britannia Good Day Cashew Cookies', 2.99, 'biscuits-cookies');
  add('Parle-G Gold Biscuits', 1.99, 'biscuits-cookies');
  add('Pran Dry Cake', 3.99, 'biscuits-cookies', 'pran');
  add('Haldirams Gulab Jamun 1kg', 8.99, 'traditional-sweets', 'haldirams');
  add('Haldirams Rasgulla 1kg', 8.99, 'traditional-sweets', 'haldirams');
  add('Soan Papdi 500g', 6.49, 'traditional-sweets', 'haldirams');

  // 10. Beverages
  add('Rooh Afza Syrup 800ml', 5.99, 'sodas-syrups', 'rooh-afza');
  add('Brooke Bond Red Label Tea 900g', 10.99, 'tea', 'brooke-bond');
  add('Lipton Yellow Label Tea 900g', 11.49, 'tea', 'lipton');
  add('Taj Mahal Tea Leaves 500g', 8.99, 'tea', 'taj-mahal');
  add('Nescafe Classic Coffee 200g', 7.99, 'coffee');
  add('Mango Lassi 1L', 4.99, 'juices');
  add('Pran Mango Juice 1L', 3.49, 'juices', 'pran');
  add('Pakola Ice Cream Soda', 1.99, 'sodas-syrups');
  add('Thums Up Cola Can', 1.49, 'sodas-syrups');
  add('Limca Lemon Soda', 1.49, 'sodas-syrups');

  // 11. Dairy & Eggs
  add('Organic Whole Milk 1 Gallon', 5.49, 'milk');
  add('Almarai Processed Cheese Glass 500g', 6.99, 'cheese', 'almarai');
  add('Paneer Block 400g', 5.99, 'cheese');
  add('Desi Dahi (Yogurt) 32oz', 4.49, 'yogurt');
  add('Large White Eggs 1 Dozen', 3.99, 'eggs');

  // 12. Frozen Foods
  add('Al Safa Halal Chicken Nuggets 1kg', 12.99, 'frozen-snacks', 'al-safa');
  add('Sadia Halal Chicken Burger Patties', 9.99, 'frozen-snacks', 'sadia');
  add('Seara Halal Chicken Franks', 4.99, 'frozen-snacks', 'seara');
  add('Doux Frozen Whole Chicken', 6.99, 'frozen-meat', 'doux');
  add('Kawan Plain Paratha (5 Pcs)', 3.49, 'paratha-roti');
  add('Deep Frozen Samosa (Potato & Pea)', 5.99, 'frozen-snacks');
  add('Frozen Mixed Vegetables 1lb', 2.49, 'frozen-vegetables');
  add('Frozen Green Peas 1lb', 2.49, 'frozen-vegetables');
  add('Frozen Cassava (Yuca)', 3.99, 'frozen-vegetables');
  add('Frozen Grated Coconut', 2.99, 'frozen-vegetables');

  // 13. Fresh Produce
  add('Fresh Red Onions 5lb Bag', 4.99, 'fresh-vegetables', null, '', false);
  add('Fresh Garlic 1lb', 3.99, 'fresh-vegetables', null, '', false);
  add('Fresh Ginger Root 1lb', 2.99, 'fresh-vegetables', null, '', false);
  add('Green Chilies (Indian) 0.5lb', 2.49, 'fresh-vegetables', null, '', false);
  add('Fresh Coriander Leaves (Cilantro)', 1.49, 'herbs', null, '', false);
  add('Fresh Mint Leaves', 1.49, 'herbs', null, '', false);
  add('Curry Leaves', 1.99, 'herbs', null, '', false);
  add('Fresh Okra (Bhindi) 1lb', 2.99, 'fresh-vegetables', null, '', false);
  add('Fresh Bitter Gourd (Karela) 1lb', 3.49, 'fresh-vegetables', null, '', false);
  add('Fresh Mangoes (Alphonso) Box', 24.99, 'fresh-fruits', null, '', false);
  add('Fresh Papaya 1pc', 3.99, 'fresh-fruits', null, '', false);
  add('Fresh Guava 1lb', 4.99, 'fresh-fruits', null, '', false);

  // 14. Personal Care & Household
  add('Parachute Coconut Oil 500ml', 6.99, 'hair-care', 'parachute');
  add('Dabur Amla Hair Oil 300ml', 5.49, 'hair-care', 'dabur');
  add('Hemani Black Seed Oil 100ml', 8.99, 'skin-care', 'hemani');
  add('Himalaya Purifying Neem Face Wash', 6.49, 'skin-care', 'himalaya');
  add('Patanjali Dant Kanti Toothpaste', 3.99, 'oral-care', 'patanjali');
  add('Miswak Toothpaste', 2.99, 'oral-care');
  add('Dettol Antiseptic Liquid 500ml', 7.99, 'cleaning-supplies');
  add('Vim Dishwash Bar', 1.99, 'cleaning-supplies');
  add('Surf Excel Detergent Powder 1kg', 6.99, 'cleaning-supplies');
  add('Odonil Room Freshener', 2.49, 'cleaning-supplies');

  return products;
}

export const products = generateProducts();
