'use client';

import React, { useState } from 'react';
import Button from './ui/Button';
import ProductSelectionModal from './ui/ProductSelectionModal';

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

interface OrderItem {
  productId: number;
  selectedColors: string[];
  selectedSizes: string[];
  quantity: number;
  unitPrice?: number;
}

interface BulkOrderTableProps {
  orderItems: OrderItem[];
  products: Product[];
  onAddItem: (item: OrderItem) => void;
  onUpdateItem: (index: number, field: keyof OrderItem, value: string | number | string[]) => void;
  onRemoveItem: (index: number) => void;
  onClearAll: () => void;
}

const BulkOrderTable: React.FC<BulkOrderTableProps> = ({
  orderItems,
  products,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onClearAll
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getProductById = (id: number) => {
    return products.find(p => p.id === id);
  };

  const handleAddProduct = (selectedProduct: {
    productId: number;
    selectedColors: string[];
    selectedSizes: string[];
    quantity: number;
  }) => {
    const product = getProductById(selectedProduct.productId);
    const newItem: OrderItem = {
      ...selectedProduct,
      unitPrice: product?.base_price || 0
    };
    onAddItem(newItem);
  };

  const calculateItemTotal = (item: OrderItem) => {
    const product = getProductById(item.productId);
    const unitPrice = item.unitPrice || product?.base_price || 0;
    return unitPrice * item.quantity;
  };

  const calculateGrandTotal = () => {
    return orderItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Order Items</h2>
          <p className="text-sm text-gray-600">
            {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} • 
            Total: ${calculateGrandTotal().toFixed(2)}
          </p>
        </div>
        <div className="flex space-x-2">
          {orderItems.length > 0 && (
            <Button
              onClick={onClearAll}
              className="border border-red-300 bg-white text-red-600 hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
          <Button onClick={() => setIsModalOpen(true)}>
            + Add Product
          </Button>
        </div>
      </div>

      {/* Table */}
      {orderItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-500 mb-4">No products added yet</div>
          <Button onClick={() => setIsModalOpen(true)}>
            + Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colors
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sizes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderItems.map((item, index) => {
                  const product = getProductById(item.productId);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product?.product_name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product?.product_code || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {item.selectedColors.length > 3 
                            ? `${item.selectedColors.slice(0, 3).join(', ')} +${item.selectedColors.length - 3}`
                            : item.selectedColors.join(', ') || 'None'
                          }
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {item.selectedSizes.join(', ') || 'None'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice || product?.base_price || 0}
                          onChange={(e) => onUpdateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${calculateItemTotal(item).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onRemoveItem(index)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    Grand Total:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    ${calculateGrandTotal().toFixed(2)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddProduct}
        products={products}
      />
    </div>
  );
};

export default BulkOrderTable;