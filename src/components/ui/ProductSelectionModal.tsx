'use client';

import React, { useState } from 'react';
import Button from './Button';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category: string;
  base_price: number;
  available_colors: string[];
  available_sizes: string[];
  description: string;
}

interface SelectedProduct {
  productId: number;
  selectedColors: string[];
  selectedSizes: string[];
  quantity: number;
}

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: SelectedProduct) => void;
  products: Product[];
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  products
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const resetForm = () => {
    setSelectedProduct(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setQuantity(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColors([]);
    setSelectedSizes([]);
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handleAdd = () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }
    
    if (selectedColors.length === 0) {
      alert('Please select at least one color');
      return;
    }
    
    if (selectedSizes.length === 0) {
      alert('Please select at least one size');
      return;
    }

    onAdd({
      productId: selectedProduct.id,
      selectedColors,
      selectedSizes,
      quantity
    });

    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Product to Order</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Product *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
              {products.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-sm">{product.product_name}</div>
                  <div className="text-xs text-gray-600">{product.product_code}</div>
                  <div className="text-xs text-gray-600">${product.base_price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          {selectedProduct && (
            <>
              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Colors * (for {selectedProduct.product_name})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {selectedProduct.available_colors.map(color => (
                    <label key={color} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => handleColorToggle(color)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{color}</span>
                    </label>
                  ))}
                </div>
                {selectedColors.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedColors.join(', ')}
                  </p>
                )}
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Sizes * (for {selectedProduct.product_name})
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 border border-gray-300 rounded-md p-3">
                  {selectedProduct.available_sizes.map(size => (
                    <label key={size} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => handleSizeToggle(size)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
                {selectedSizes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedSizes.join(', ')}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button 
            onClick={handleClose}
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={!selectedProduct || selectedColors.length === 0 || selectedSizes.length === 0}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;