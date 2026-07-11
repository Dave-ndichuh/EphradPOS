const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rawData = `
💻 Lenovo Laptops
ThinkPad X250 — Core i5 5th Gen / 8GB RAM / 500GB HDD — 13.5k
ThinkPad X260 — Core i5 7th Gen / 8GB RAM / 256GB SSD — 15.5k
T460p — Core i7 / 8GB RAM / 256GB SSD / 2GB NVIDIA — 21k
X280 — Core i5 8th Gen / 8GB RAM / 256GB SSD — 20k
T470 — Core i5 7th Gen / 8GB RAM / 256GB SSD — 19k
T470 — Core i7 7th Gen / 8GB RAM / 256GB SSD — 22k
T480s — Core i7 8th Gen / 8GB RAM / 256GB SSD — 29k
T480s — Core i7 8th Gen / 16GB RAM / 256GB SSD / Touch — 33k
T490s — Core i7 / 32GB RAM / 512GB SSD / Touch — 39k
T14s — Core i7 10th Gen / 16GB RAM / 512GB SSD / Touch — 50k
T14 — Core i7 10th Gen / 16GB RAM / 512GB SSD / Non-Touch — 48k
T14s — Core i7 11th Gen / 16GB RAM / 512GB SSD / Touch — 52k
Yoga 380 — Core i5 8th Gen / 8GB RAM / 256GB SSD — 25k
Yoga 390 — Core i5 8th Gen / 8GB RAM / 256GB SSD — 26k
Yoga X390 — Core i5 / 16GB RAM / 256GB SSD — 27k
X1 Carbon G7 — Core i5 8th Gen / 16GB RAM / 512GB SSD — 32k
X1 Yoga — Core i7 8th Gen / 16GB RAM / 512GB SSD / Touch — 40k
X1 Carbon — Core i7 8th Gen / 16GB RAM / 512GB SSD / Touch — 39k
X1 Yoga — Core i7 10th Gen / 16GB RAM / 512GB SSD / x360 + Stylus — 52k
X1 Yoga — Core i7 12th Gen / 32GB RAM / 512GB SSD / x360 + Stylus — 70k

💻 Microsoft Surface
Surface Pro 5 (2017) — Core i5 / 8GB / 256GB / 7th Gen / Detachable Keyboard — 24k
Surface Pro 6 — Core i5 / 8GB / 256GB / 8th Gen / Touchscreen — 27k
Surface Pro 7 — Core i5 / 8GB / 256GB / 10th Gen / Touchscreen, Type Cover — 29k
Surface Laptop 3 (13.5") — Core i5 / 8GB / 256GB / 10th Gen / Sleek Ultrabook — 30k
Surface Laptop 3 (15") — Core i7 / 16GB / 512GB / 10th Gen / Bigger Display — 42k
Surface Pro 8 — Core i7 / 16GB / 512GB / 11th Gen / Slim Pen — 55k
Surface Laptop 4 — Core i5 / 16GB / 512GB / 11th Gen / Business Model — 50k
Surface Laptop Studio — Core i7 / 32GB / 1TB / 12th Gen / Touch, 14.4” — 85k

💻 HP Laptops
1040 G7 — Core i7 / 16GB / 512GB / 10th Gen / Slim EliteBook — 48k
1040 G6 x360 — Core i7 / 16GB / 512GB / 8th Gen / Touch Convertible — 42k
1030 G4 — Core i7 / 16GB / 512GB / 8th Gen / Touch Convertible — 40k
1030 G3 — Core i7 / 16GB / 512GB / 8th Gen / Touch Convertible — 40k
1030 G1 — Core M5 / 16GB / 256GB / 7th Gen / Ultrabook — 24k
1030 G1 — Core i5 / 16GB / 256GB / 7th Gen / x360 — 24k
1030 G3 — Core i7 / 16GB / 512GB / 8th Gen / Slim — 39k
1030 G3 — Core i5 / 16GB / 512GB / 8th Gen / Business Series — 34k
1040 G4 — Core i7 / 16GB / 512GB / 8th Gen / Touch Convertible — 40k
840 G5 — Core i7 / 16GB / 512GB / 8th Gen / Touch 14” — 33k
840 G5 — Core i7 / 8GB / 256GB / 8th Gen / Non-Touch Slim — 27k
840 G5 — Core i5 / 16GB / 512GB / 8th Gen / Touch Business — 30k
840 G5 — Core i5 / 8GB / 256GB / 8th Gen / Non-Touch Business — 25k
840 G4 — Core i7 / 8GB / 256GB / 7th Gen / Non-Touch EliteBook — 19k
840 G4 — Core i5 / 8GB / 256GB / 7th Gen / Touch — 21.5k
840 G3 — Core i7 / 8GB / 256GB / 6th Gen / Touch — 22k
840 G3 — Core i5 / 8GB / 256GB / 6th Gen / Touch — 20k
840 G3 — Core i5 / 8GB / 256GB / 6th Gen / Non-Touch — 18k
830 G8 — Core i7 / 16GB / 512GB / 11th Gen / Premium — 45k
830 G5 — Core i5 / 8GB / 256GB / 8th Gen / Touch 13.3” — 27k
830 G5 — Core i5 / 8GB / 256GB / 8th Gen / Non-Touch — 23.5k
820 G4 — Core i5 / 8GB / 256GB / 7th Gen / Compact Business — 17k
820 G3 — Core i5 / 8GB / 256GB / 6th Gen / Compact EliteBook — 16k
640 G2 — Core i5 / 8GB / 256GB / 6th Gen / Standard Display — 14.5k
640 G1 — Core i5 / 8GB / 500GB / 5th Gen / Legacy Ports — 12k
840 G1 — Core i5 / 8GB / 500GB / 4th Gen — 14k
840 G2 — Core i5 / 8GB / 500GB / 5th Gen — 14.5k
8460/8470 — Core i5 / 8GB / 500GB / 3rd Gen / Business Build — 10k
9470 — Core i5 / 8GB / 500GB / 3rd Gen / Ultrabook Design — 14k
9480 — Core i5 / 8GB / 500GB / 4th Gen / Slim — 15k
11 G4 — Core i5 / 8GB / 256GB / 8th Gen / x360 Convertible — 16.5k
11 G2 — Core M3 / 8GB / 128GB / 7th Gen / ChromeBook-style — 13k
11 G1 — Pentium N / 4GB / 128GB / 6th Gen / Touch x360 — 11.5k

💻 Dell Laptops
5300 — Core i5 / 8GB / 256GB / 8th Gen / 14” Slim — 17.5k
7280 — Core i7 / 16GB / 256GB / 7th Gen / Business Class — 18.5k
7280 — Core i5 / 8GB / 256GB / 7th Gen — 16k
`;

// Map of typical images based on models to give a good visual look
const getImageUrl = (brand, model) => {
  const m = model.toLowerCase();
  if (brand === 'Lenovo') {
    if (m.includes('carbon')) return 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Lenovo_ThinkPad_X1_Carbon_Gen_9_14.jpg';
    if (m.includes('yoga')) return 'https://upload.wikimedia.org/wikipedia/commons/1/14/Lenovo_ThinkPad_X1_Yoga_Gen_4.jpg';
    if (m.includes('x2')) return 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Thinkpad_X250_1.jpg';
    return 'https://upload.wikimedia.org/wikipedia/commons/9/91/Lenovo_ThinkPad_T470s.jpg'; // generic T series
  }
  if (brand === 'Microsoft') {
    if (m.includes('pro')) return 'https://upload.wikimedia.org/wikipedia/commons/5/52/Microsoft_Surface_Pro_4_and_TypeCover.jpg';
    if (m.includes('studio')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Surface_Studio_1.jpg';
    return 'https://upload.wikimedia.org/wikipedia/commons/5/57/Surface_Laptop_3.jpg'; // generic Surface laptop
  }
  if (brand === 'HP') {
    if (m.includes('x360')) return 'https://upload.wikimedia.org/wikipedia/commons/c/c5/HP_EliteBook_x360_1030_G2.png';
    if (m.includes('840')) return 'https://upload.wikimedia.org/wikipedia/commons/2/25/HP_EliteBook_840_G3.jpg';
    return 'https://upload.wikimedia.org/wikipedia/commons/b/b5/HP_Elitebook_840_G1.jpg';
  }
  if (brand === 'Dell') {
    return 'https://upload.wikimedia.org/wikipedia/commons/5/51/Dell_Latitude_7400_2-in-1.jpg';
  }
  return 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Laptop_placeholder.png';
};

async function seed() {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  let currentBrand = 'Generic';
  
  // Ensure we have a default category for laptops
  let category = await prisma.category.findFirst({ where: { CNAME: 'Laptops' } });
  if (!category) {
    category = await prisma.category.create({ data: { CNAME: 'Laptops' } });
  }

  for (const line of lines) {
    if (line.startsWith('💻')) {
      currentBrand = line.replace('💻', '').replace('Laptops', '').trim();
      continue;
    }
    
    // Parse line: "ThinkPad X250 — Core i5 5th Gen / 8GB RAM / 500GB HDD — 13.5k"
    const parts = line.split('—').map(p => p.trim());
    if (parts.length >= 3) {
      let model = parts[0];
      const desc = parts[1];
      const priceStr = parts[parts.length - 1]; // "13.5k" or "11k-12k"
      
      // Some HP models don't have the brand name in the text
      if (currentBrand === 'HP' && !model.toLowerCase().includes('hp')) {
        model = `HP EliteBook ${model}`;
      } else if (currentBrand === 'Dell' && !model.toLowerCase().includes('dell')) {
        model = `Dell Latitude ${model}`;
      } else if (currentBrand === 'Lenovo' && !model.toLowerCase().includes('lenovo') && !model.toLowerCase().includes('thinkpad')) {
        model = `Lenovo ${model}`;
      }
      
      // Parse price
      let priceMatch = priceStr.match(/[\d.]+/);
      let price = 0;
      if (priceMatch) {
        price = parseFloat(priceMatch[0]) * 1000;
      }
      
      const productCode = `${currentBrand.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const imageUrl = getImageUrl(currentBrand, model);

      const payload = {
        PRODUCT_CODE: productCode,
        NAME: model.substring(0, 50),
        DESCRIPTION: desc.substring(0, 250),
        QTY_STOCK: 10,
        ON_HAND: 10,
        PRICE: price,
        COST_PRICE: price * 0.75, // 25% margin roughly
        CATEGORY_ID: category.CATEGORY_ID,
        STATUS: 'active',
        UOM: 'pcs',
        REORDER_THRESHOLD: 2,
        BRAND: currentBrand,
        MODEL: model.split(' ')[1] || model,
        IMAGE_URL: imageUrl
      };

      console.log(`Creating: ${model} - Ksh ${price}`);
      await prisma.product.create({ data: payload });
    }
  }
  
  console.log('Done seeding products!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
