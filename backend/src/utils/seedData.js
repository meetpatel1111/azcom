const ProductRepository = require('../repositories/ProductRepository');
const { createProduct } = require('../models/Product');

const productRepository = new ProductRepository();

/**
 * Sample product data for seeding the database
 */
const sampleProducts = [
  {
    name: 'MacBook Pro 16-inch',
    description: 'Apple MacBook Pro with M2 Pro chip, 16-inch Liquid Retina XDR display, 16GB RAM, 512GB SSD storage.',
    price: 2499.00,
    category: 'Electronics',
    imageUrl: 'https://example.com/images/macbook-pro-16.jpg',
    inventory: 15
  },
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
    price: 999.00,
    category: 'Electronics',
    imageUrl: 'https://example.com/images/iphone-15-pro.jpg',
    inventory: 25
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling wireless headphones with premium sound quality.',
    price: 399.99,
    category: 'Electronics',
    imageUrl: 'https://example.com/images/sony-headphones.jpg',
    inventory: 30
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight-leg jeans with authentic styling and premium denim.',
    price: 89.50,
    category: 'Clothing',
    imageUrl: 'https://example.com/images/levis-501.jpg',
    inventory: 50
  },
  {
    name: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Max Air cushioning and modern design.',
    price: 150.00,
    category: 'Clothing',
    imageUrl: 'https://example.com/images/nike-air-max.jpg',
    inventory: 40
  },
  {
    name: 'The Great Gatsby',
    description: 'Classic American novel by F. Scott Fitzgerald, paperback edition.',
    price: 12.99,
    category: 'Books',
    imageUrl: 'https://example.com/images/great-gatsby.jpg',
    inventory: 100
  },
  {
    name: 'JavaScript: The Good Parts',
    description: 'Essential guide to JavaScript programming by Douglas Crockford.',
    price: 29.99,
    category: 'Books',
    imageUrl: 'https://example.com/images/js-good-parts.jpg',
    inventory: 75
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-functional electric pressure cooker, slow cooker, rice cooker, and more.',
    price: 79.95,
    category: 'Home & Garden',
    imageUrl: 'https://example.com/images/instant-pot.jpg',
    inventory: 20
  },
  {
    name: 'Dyson V15 Detect Vacuum',
    description: 'Cordless vacuum cleaner with laser dust detection and powerful suction.',
    price: 749.99,
    category: 'Home & Garden',
    imageUrl: 'https://example.com/images/dyson-v15.jpg',
    inventory: 12
  },
  {
    name: 'Wilson Tennis Racket',
    description: 'Professional-grade tennis racket with carbon fiber frame.',
    price: 199.99,
    category: 'Sports',
    imageUrl: 'https://example.com/images/wilson-racket.jpg',
    inventory: 8
  },
  {
    name: 'LEGO Creator Expert Set',
    description: 'Advanced LEGO building set for adults with detailed architecture model.',
    price: 249.99,
    category: 'Toys',
    imageUrl: 'https://example.com/images/lego-creator.jpg',
    inventory: 5
  },
  {
    name: 'Samsung 55" 4K Smart TV',
    description: 'Ultra HD Smart TV with HDR, built-in streaming apps, and voice control.',
    price: 699.99,
    category: 'Electronics',
    imageUrl: 'https://example.com/images/samsung-tv.jpg',
    inventory: 18
  }
];

/**
 * Seed the database with sample products
 */
async function seedProducts() {
  try {
    console.log('🌱 Seeding products...');
    
    // Check if products already exist
    const existingProducts = await productRepository.findAll();
    if (existingProducts.length > 0) {
      console.log('📦 Products already exist, skipping seed');
      return;
    }

    // Create sample products
    for (const productData of sampleProducts) {
      const product = createProduct(productData);
      await productRepository.create(product);
    }

    console.log(`✅ Successfully seeded ${sampleProducts.length} products`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

/**
 * Clear all products from the database
 */
async function clearProducts() {
  try {
    console.log('🗑️  Clearing all products...');
    await productRepository.clear();
    console.log('✅ All products cleared');
  } catch (error) {
    console.error('❌ Error clearing products:', error);
    throw error;
  }
}

module.exports = {
  seedProducts,
  clearProducts,
  sampleProducts
};