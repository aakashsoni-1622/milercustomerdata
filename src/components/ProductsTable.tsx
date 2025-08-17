'use client';

import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category: string;
  base_price: number;
  available_colors: string[];
  available_sizes: string[];
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ProductsTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const defaultProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
    product_code: '',
    product_name: '',
    category: '',
    base_price: 0,
    available_colors: [],
    available_sizes: [],
    description: '',
    is_active: true
  };

  const [newProduct, setNewProduct] = useState(defaultProduct);

  const commonColors = [
    'Airforce Blue', 'Royal Blue', 'Rama Green', 'Yellow', 'Black', 'White',
    'Light Gray', 'Peach', 'Dark Gray', 'Navy Blue', 'Maroon', 'Forest Green',
    'Bottle Green', 'Wine', 'Sky Blue', 'Neon'
  ];

  const commonSizes = ['M', 'L', 'XL', '2XL', '3XL', '4XL'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products);
      } else {
        console.error('Failed to fetch products:', data.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData?: typeof defaultProduct) => {
    try {
      console.log("productData",productData);
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
         ...productData
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Product created successfully!');
        setIsAddingNew(false);
        setNewProduct(defaultProduct);
        fetchProducts();
      } else {
        throw new Error(result.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert(`Error creating product: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleUpdateProduct = async (product: Product | Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const productId = 'id' in product ? product.id : 0;
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...product
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Product updated successfully!');
        setEditingProduct(null);
        fetchProducts();
      } else {
        throw new Error(result.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert(`Error updating product: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Product deleted successfully!');
        fetchProducts();
      } else {
        throw new Error(result.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Error deleting product: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleMultiSelect = (
    currentArray: string[],
    value: string,
    setter: (newArray: string[]) => void
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    setter(newArray);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const ProductForm = ({ 
    product, 
    onSave, 
    onCancel, 
    isNew = false 
  }: { 
    product: Product | typeof defaultProduct, 
    onSave: (product: Product | Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void, 
    onCancel: () => void,
    isNew?: boolean 
  }) => {
    const [formData, setFormData] = useState(product);
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.product_code || !formData.product_name) {
        alert('Product code and name are required');
        return;
      }
      
      onSave(formData);
    };

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {isNew ? 'Add New Product' : 'Edit Product'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Code *
              </label>
              <input
                type="text"
                value={formData.product_code}
                onChange={(e) => setFormData(prev => ({ ...prev, product_code: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Colors
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
              {commonColors.map(color => (
                <label key={color} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.available_colors.includes(color)}
                    onChange={() => handleMultiSelect(
                      formData.available_colors,
                      color,
                      (newColors) => setFormData(prev => ({ ...prev, available_colors: newColors }))
                    )}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{color}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {formData.available_colors.join(', ') || 'None'}
            </p>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Sizes
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 border border-gray-300 rounded-md p-3">
              {commonSizes.map(size => (
                <label key={size} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.available_sizes.includes(size)}
                    onChange={() => handleMultiSelect(
                      formData.available_sizes,
                      size,
                      (newSizes) => setFormData(prev => ({ ...prev, available_sizes: newSizes }))
                    )}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{size}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {formData.available_sizes.join(', ') || 'None'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active Status */}
          {!isNew && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active Product</span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={onCancel} className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
            <Button type="submit">
              {isNew ? 'Create Product' : 'Update Product'}
            </Button>
          </div>
        </form>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading products...</div>
        </div>
      </Card>
    );
  }

  if (isAddingNew) {
    return (
      <ProductForm
        product={newProduct}
        onSave={handleCreateProduct}
        onCancel={() => {
          setIsAddingNew(false);
          setNewProduct(defaultProduct);
        }}
        isNew={true}
      />
    );
  }

  if (editingProduct) {
    return (
      <ProductForm
        product={editingProduct}
        onSave={handleUpdateProduct}
        onCancel={() => setEditingProduct(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Products</h2>
            <p className="text-sm text-gray-600">
              Showing {products.length} products
            </p>
          </div>
          
          <Button onClick={() => setIsAddingNew(true)}>
            Add New Product
          </Button>
        </div>
      </Card>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            No products found. Click &quot;Add New Product&quot; to get started.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.product_name}</h3>
                  <p className="text-sm text-gray-600">Code: {product.product_code}</p>
                  {product.category && (
                    <p className="text-sm text-gray-600">Category: {product.category}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Price:</span>
                  <span className="ml-2 text-lg font-semibold text-gray-900">
                    {formatCurrency(product.base_price)}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">Colors:</span>
                  <div className="mt-1 text-xs text-gray-600">
                    {product.available_colors.length > 0 
                      ? product.available_colors.slice(0, 3).join(', ') + 
                        (product.available_colors.length > 3 ? ` +${product.available_colors.length - 3} more` : '')
                      : 'None'
                    }
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">Sizes:</span>
                  <div className="mt-1 text-xs text-gray-600">
                    {product.available_sizes.length > 0 
                      ? product.available_sizes.join(', ')
                      : 'None'
                    }
                  </div>
                </div>

                {product.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => setEditingProduct(product)}
                  className="flex-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-3 py-1 text-sm font-medium"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-gray-300 bg-white px-3 py-1 text-sm font-medium"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsTable;