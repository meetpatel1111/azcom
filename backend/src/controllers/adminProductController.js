const ProductRepository = require('../repositories/ProductRepository');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../middleware/errorHandler');
const { 
  validateCreateProduct, 
  validateUpdateProduct,
  createProduct, 
  sanitizeProduct 
} = require('../models/Product');

const productRepository = new ProductRepository();

/**
 * Create a new product (Admin only)
 * POST /api/products
 */
const createNewProduct = asyncHandler(async (req, res) => {
  // Validate request data
  const { error, value } = validateCreateProduct(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Product validation failed', details);
  }

  // Check if product with same name already exists
  const existingProducts = await productRepository.search(value.name);
  const exactMatch = existingProducts.find(p => 
    p.name.toLowerCase() === value.name.toLowerCase()
  );
  
  if (exactMatch) {
    throw new ConflictError('A product with this name already exists');
  }

  // Create product
  const productData = createProduct(value);
  const product = await productRepository.create(productData);

  res.status(201).json({
    message: 'Product created successfully',
    product: sanitizeProduct(product)
  });
});

/**
 * Update product by ID (Admin only)
 * PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate request data
  const { error, value } = validateUpdateProduct(req.body);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Product validation failed', details);
  }

  // Check if product exists
  const existingProduct = await productRepository.findById(id);
  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  // If name is being updated, check for conflicts
  if (value.name && value.name.toLowerCase() !== existingProduct.name.toLowerCase()) {
    const existingProducts = await productRepository.search(value.name);
    const exactMatch = existingProducts.find(p => 
      p.name.toLowerCase() === value.name.toLowerCase() && p.id !== id
    );
    
    if (exactMatch) {
      throw new ConflictError('A product with this name already exists');
    }
  }

  // Update product
  const updatedProduct = await productRepository.update(id, value);
  if (!updatedProduct) {
    throw new NotFoundError('Product not found');
  }

  res.json({
    message: 'Product updated successfully',
    product: sanitizeProduct(updatedProduct)
  });
});

/**
 * Delete product by ID (Admin only)
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if product exists
  const existingProduct = await productRepository.findById(id);
  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  // Delete product
  const success = await productRepository.delete(id);
  if (!success) {
    throw new NotFoundError('Product not found');
  }

  res.json({
    message: 'Product deleted successfully',
    deletedProduct: {
      id: existingProduct.id,
      name: existingProduct.name
    }
  });
});

/**
 * Update product inventory (Admin only)
 * PATCH /api/products/:id/inventory
 */
const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, operation = 'set' } = req.body;

  // Validate input
  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
    throw new ValidationError('Quantity must be an integer');
  }

  if (!['set', 'add', 'subtract'].includes(operation)) {
    throw new ValidationError('Operation must be one of: set, add, subtract');
  }

  // Check if product exists
  const existingProduct = await productRepository.findById(id);
  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  let newInventory;
  switch (operation) {
    case 'set':
      if (quantity < 0) {
        throw new ValidationError('Inventory cannot be negative');
      }
      newInventory = quantity;
      break;
    case 'add':
      if (quantity < 0) {
        throw new ValidationError('Quantity to add cannot be negative');
      }
      newInventory = existingProduct.inventory + quantity;
      break;
    case 'subtract':
      if (quantity < 0) {
        throw new ValidationError('Quantity to subtract cannot be negative');
      }
      newInventory = existingProduct.inventory - quantity;
      if (newInventory < 0) {
        throw new ValidationError('Insufficient inventory for subtraction');
      }
      break;
  }

  // Update inventory
  const updatedProduct = await productRepository.update(id, { inventory: newInventory });

  res.json({
    message: 'Inventory updated successfully',
    product: sanitizeProduct(updatedProduct),
    inventoryChange: {
      operation,
      quantity,
      previousInventory: existingProduct.inventory,
      newInventory
    }
  });
});

/**
 * Bulk update products (Admin only)
 * PATCH /api/products/bulk
 */
const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { productIds, updates } = req.body;

  // Validate input
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new ValidationError('Product IDs must be a non-empty array');
  }

  if (!updates || typeof updates !== 'object') {
    throw new ValidationError('Updates object is required');
  }

  // Validate updates object
  const { error } = validateUpdateProduct(updates);
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Update validation failed', details);
  }

  const results = {
    successful: [],
    failed: []
  };

  // Update each product
  for (const productId of productIds) {
    try {
      const updatedProduct = await productRepository.update(productId, updates);
      if (updatedProduct) {
        results.successful.push({
          id: productId,
          product: sanitizeProduct(updatedProduct)
        });
      } else {
        results.failed.push({
          id: productId,
          error: 'Product not found'
        });
      }
    } catch (error) {
      results.failed.push({
        id: productId,
        error: error.message
      });
    }
  }

  res.json({
    message: 'Bulk update completed',
    results,
    summary: {
      total: productIds.length,
      successful: results.successful.length,
      failed: results.failed.length
    }
  });
});

/**
 * Bulk delete products (Admin only)
 * DELETE /api/products/bulk
 */
const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { productIds } = req.body;

  // Validate input
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new ValidationError('Product IDs must be a non-empty array');
  }

  const results = {
    successful: [],
    failed: []
  };

  // Delete each product
  for (const productId of productIds) {
    try {
      const existingProduct = await productRepository.findById(productId);
      if (!existingProduct) {
        results.failed.push({
          id: productId,
          error: 'Product not found'
        });
        continue;
      }

      const success = await productRepository.delete(productId);
      if (success) {
        results.successful.push({
          id: productId,
          name: existingProduct.name
        });
      } else {
        results.failed.push({
          id: productId,
          error: 'Failed to delete product'
        });
      }
    } catch (error) {
      results.failed.push({
        id: productId,
        error: error.message
      });
    }
  }

  res.json({
    message: 'Bulk delete completed',
    results,
    summary: {
      total: productIds.length,
      successful: results.successful.length,
      failed: results.failed.length
    }
  });
});

/**
 * Import products from CSV/JSON (Admin only)
 * POST /api/products/import
 */
const importProducts = asyncHandler(async (req, res) => {
  const { products, skipDuplicates = true } = req.body;

  // Validate input
  if (!Array.isArray(products) || products.length === 0) {
    throw new ValidationError('Products must be a non-empty array');
  }

  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  // Process each product
  for (let i = 0; i < products.length; i++) {
    const productData = products[i];
    
    try {
      // Validate product data
      const { error, value } = validateCreateProduct(productData);
      if (error) {
        results.failed.push({
          index: i,
          data: productData,
          error: `Validation failed: ${error.details.map(d => d.message).join(', ')}`
        });
        continue;
      }

      // Check for duplicates
      if (skipDuplicates) {
        const existingProducts = await productRepository.search(value.name);
        const exactMatch = existingProducts.find(p => 
          p.name.toLowerCase() === value.name.toLowerCase()
        );
        
        if (exactMatch) {
          results.skipped.push({
            index: i,
            data: productData,
            reason: 'Product with this name already exists'
          });
          continue;
        }
      }

      // Create product
      const newProductData = createProduct(value);
      const product = await productRepository.create(newProductData);
      
      results.successful.push({
        index: i,
        product: sanitizeProduct(product)
      });

    } catch (error) {
      results.failed.push({
        index: i,
        data: productData,
        error: error.message
      });
    }
  }

  res.status(201).json({
    message: 'Product import completed',
    results,
    summary: {
      total: products.length,
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length
    }
  });
});

module.exports = {
  createNewProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  bulkUpdateProducts,
  bulkDeleteProducts,
  importProducts
};