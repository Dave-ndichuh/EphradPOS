const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getImageUrl = (brand) => {
  if (brand === 'Lenovo') {
    return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80';
  }
  if (brand === 'Microsoft') {
    return 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=400&q=80';
  }
  if (brand === 'HP') {
    return 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=400&q=80';
  }
  if (brand === 'Dell') {
    return 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80';
};

async function fix() {
  const brands = ['Lenovo', 'Microsoft', 'HP', 'Dell'];
  
  // 1. Create categories for each brand
  const categoryMap = {};
  for (const brand of brands) {
    const catName = brand + ' Laptops';
    let cat = await prisma.category.findFirst({ where: { CNAME: catName } });
    if (!cat) {
      cat = await prisma.category.create({ data: { CNAME: catName } });
      console.log('Created category: ' + catName);
    }
    categoryMap[brand] = cat.CATEGORY_ID;
  }

  // 2. Fetch all products that we seeded (they have these brands)
  const products = await prisma.product.findMany({
    where: {
      BRAND: { in: brands }
    }
  });

  console.log('Found ' + products.length + ' products to update.');

  // 3. Update their category and image
  for (const p of products) {
    const newImage = getImageUrl(p.BRAND);
    const newCatId = categoryMap[p.BRAND];

    await prisma.product.update({
      where: { PRODUCT_ID: p.PRODUCT_ID },
      data: {
        CATEGORY_ID: newCatId,
        IMAGE_URL: newImage
      }
    });
  }

  console.log('Successfully updated categories and images!');
}

fix().catch(console.error).finally(() => prisma.$disconnect());
