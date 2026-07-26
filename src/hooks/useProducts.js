import { useState, useEffect, useCallback } from 'react';
import { getAllProducts, getAllCategories, getAllSuppliers, createProduct, updateProduct, deleteProduct } from '@/infrastructure/repositories/productRepository';
import { mapToProductEntity, mapFromProductForm } from '@/core/entities/Product';
import { logAction } from '@/lib/logger';

/**
 * useProducts hook
 * Bridges the gap between UI components and Application business logic.
 * Handles React state, loading states, error boundaries, and orchestration.
 */
export function useProducts(branchId) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawProducts, rawCategories, rawSuppliers] = await Promise.all([
        getAllProducts(branchId),
        getAllCategories(),
        getAllSuppliers()
      ]);
      setProducts(rawProducts.map(mapToProductEntity));
      setCategories(rawCategories);
      setSuppliers(rawSuppliers);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  const saveProduct = async (id, formData) => {
    try {
      const payload = mapFromProductForm(formData);
      if (id) {
        delete payload.DATE_STOCK_IN;
        await updateProduct(id, payload);
      } else {
        await createProduct(payload, branchId);
      }
      
      await logAction({
        action: id ? 'Updated Product' : 'Added Product',
        details: `${id ? 'Updated' : 'Added'} product: ${formData.NAME} (Code: ${formData.PRODUCT_CODE})`,
        severity: 'info'
      });
      
      await fetchProducts();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteProductHook = async (id, productData) => {
    try {
      const result = await deleteProduct(id);
      
      if (productData) {
        await logAction({
          action: result?.archived ? 'Archived Product' : 'Deleted Product',
          details: `${result?.archived ? 'Archived' : 'Deleted'} product: ${productData.name} (Code: ${productData.productCode})`,
          severity: result?.archived ? 'warning' : 'danger'
        });
      }
      
      await fetchProducts();
      return { success: true, archived: result?.archived };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    products,
    categories,
    suppliers,
    loading,
    error,
    fetchProducts,
    saveProduct,
    deleteProduct: deleteProductHook
  };
}

