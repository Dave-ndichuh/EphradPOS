import { getAllProducts, getAllCategories, getAllSuppliers, createProduct, updateProduct, deleteProduct } from '@/infrastructure/repositories/productRepository';
import { mapToProductEntity, mapFromProductForm } from '@/core/entities/Product';

/**
 * ProductService
 * Pure business logic layer. Orchestrates repositories and handles business rules.
 */
export const ProductService = {
  async fetchAllData(branchId) {
    // Fetch products, categories, and suppliers concurrently
    const [rawProducts, categories, suppliers] = await Promise.all([
      getAllProducts(branchId),
      getAllCategories(),
      getAllSuppliers()
    ]);

    // Map raw database rows to domain entities
    const products = rawProducts.map(mapToProductEntity);

    return { products, categories, suppliers };
  },

  async saveProduct(id, formData, branchId) {
    const payload = mapFromProductForm(formData);
    
    // In update mode, DATE_STOCK_IN usually shouldn't be overridden unless intended, 
    // but preserving the original behavior of the controller.
    if (id) {
      delete payload.DATE_STOCK_IN; // Ensure we don't overwrite creation date on update
      return await updateProduct(id, payload);
    } else {
      return await createProduct(payload, branchId);
    }
  },

  async deleteProduct(id) {
    return await deleteProduct(id);
  }
};

