"use client";

import { useState, useEffect, useRef } from "react";

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
  productName: string;
  selectedColors: string[];
  selectedSizes: string[];
  quantity: number;
  unitPrice: number;
}

interface BulkProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  existingProducts: SelectedProduct[];
  onSelectProducts: (selectedProducts: SelectedProduct[]) => void;
}

const BulkProductSelectionModal: React.FC<BulkProductSelectionModalProps> = ({
  isOpen,
  onClose,
  products,
  existingProducts,
  onSelectProducts,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(existingProducts);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [colorDropdownOpen, setColorDropdownOpen] = useState<boolean>(false);
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState<boolean>(false);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setColorDropdownOpen(false);
      }
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setSizeDropdownOpen(false);
      }
    };

    if (colorDropdownOpen || sizeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [colorDropdownOpen, sizeDropdownOpen]);

  if (!isOpen) return null;

  const handleProductSelect = (product: Product) => {
    setCurrentProduct(product);
    setSelectedColors([]);
    setSelectedSizes([]);
    setQuantity(1);
    setColorDropdownOpen(false);
    setSizeDropdownOpen(false);
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

  const handleAddProduct = () => {
    if (!currentProduct || selectedColors.length === 0 || selectedSizes.length === 0) {
      alert('Please select a product, at least one color, and at least one size');
      return;
    }

    const newProduct: SelectedProduct = {
      productId: currentProduct.id,
      productName: currentProduct.product_name,
      selectedColors: [...selectedColors],
      selectedSizes: [...selectedSizes],
      quantity: quantity,
      unitPrice: currentProduct.base_price,
    };

    setSelectedProducts(prev => [...prev, newProduct]);
    setCurrentProduct(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setQuantity(1);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    setSelectedProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, quantity: newQuantity } : product
    ));
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    setSelectedProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, unitPrice: newPrice } : product
    ));
  };

  const handleSubmit = () => {
    onSelectProducts(selectedProducts);
    onClose();
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => total + (product.quantity * product.unitPrice), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Select Products</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex max-h-[calc(90vh-140px)]">
          {/* Product Selection Side */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Product</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a product to configure
              </label>
              <select
                value={currentProduct?.id || ''}
                onChange={(e) => {
                  const productId = parseInt(e.target.value);
                  const product = products.find(p => p.id === productId);
                  if (product) {
                    handleProductSelect(product);
                  } else {
                    setCurrentProduct(null);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} - {product.product_code} - ₹{product.base_price}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Details Display */}
            {currentProduct && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{currentProduct.product_name}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Code: <span className="font-medium">{currentProduct.product_code}</span></div>
                  <div>Category: <span className="font-medium">{currentProduct.category || 'N/A'}</span></div>
                  <div>Base Price: <span className="font-medium text-green-600">₹{currentProduct.base_price}</span></div>
                  {currentProduct.description && (
                    <div>Description: <span className="font-medium">{currentProduct.description}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Product Configuration */}
            {currentProduct && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Configure Options
                </h4>

                {/* Colors */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colors * ({selectedColors.length} selected)
                  </label>
                  <div className="relative" ref={colorDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">
                        {selectedColors.length === 0 
                          ? "Select colors..." 
                          : `${selectedColors.length} color(s) selected: ${selectedColors.slice(0, 2).join(', ')}${selectedColors.length > 2 ? '...' : ''}`
                        }
                      </span>
                      <svg className={`w-4 h-4 transition-transform ${colorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {colorDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {currentProduct.available_colors.map(color => (
                            <label key={color} className="flex items-center text-sm hover:bg-gray-50 p-2 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedColors.includes(color)}
                                onChange={() => handleColorToggle(color)}
                                className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span>{color}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sizes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sizes * ({selectedSizes.length} selected)
                  </label>
                  <div className="relative" ref={sizeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">
                        {selectedSizes.length === 0 
                          ? "Select sizes..." 
                          : `${selectedSizes.length} size(s) selected: ${selectedSizes.slice(0, 3).join(', ')}${selectedSizes.length > 3 ? '...' : ''}`
                        }
                      </span>
                      <svg className={`w-4 h-4 transition-transform ${sizeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {sizeDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {currentProduct.available_sizes.map(size => (
                            <label key={size} className="flex items-center text-sm hover:bg-gray-50 p-2 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSizes.includes(size)}
                                onChange={() => handleSizeToggle(size)}
                                className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span>{size}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleAddProduct}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Product
                </button>
              </div>
            )}
          </div>

          {/* Selected Products Side */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Selected Products ({selectedProducts.length})
            </h3>

            {selectedProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No products selected yet
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProducts.map((product, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.productName}</h4>
                        <div className="text-sm text-gray-500">
                          Colors: {product.selectedColors.join(', ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Sizes: {product.selectedSizes.join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          value={product.unitPrice}
                          onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      Total: ₹{(product.quantity * product.unitPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {selectedProducts.length > 0 && (
              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center text-lg font-medium">
                  <span>Total Amount:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply ({selectedProducts.length} products)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkProductSelectionModal;