"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BulkOrderTable from "@/components/BulkOrderTable";

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

interface OrderForm {
  date: string;
  orderId: string;
  customerName: string;
  contactNo: string;
  state: string;
  orderItems: OrderItem[];
  totalAmount: number;
  paymentMode: string;
  orderConfirmation: string;
  comments: string;
  processOrder: boolean;
  orderStatus: string;
}

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const paymentModes = ["PAID", "COD"];
const orderConfirmations = ["Confirmed", "Pending", "Cancelled"];
const orderStatuses = ["New", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];

export default function AddOrderV2Page() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<OrderForm>({
    date: new Date().toISOString().split('T')[0],
    orderId: "",
    customerName: "",
    contactNo: "",
    state: "",
    orderItems: [],
    totalAmount: 0,
    paymentMode: "",
    orderConfirmation: "",
    comments: "",
    processOrder: false,
    orderStatus: "New"
  });

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.products);
      } else {
        console.error('Failed to fetch products:', result.error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === "totalAmount") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Add new order item
  const addOrderItem = (item: OrderItem) => {
    setFormData(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, item]
    }));
  };

  // Remove order item
  const removeOrderItem = (index: number) => {
    setFormData(prev => {
      const newItems = prev.orderItems.filter((_, i) => i !== index);
      return {
        ...prev,
        orderItems: newItems
      };
    });
  };

  // Update order item
  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number | string[]) => {
    setFormData(prev => {
      const newItems = [...prev.orderItems];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Update unit price if product changed (for API submission)
      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          newItems[index].unitPrice = product.base_price;
        }
      }
      
      return {
        ...prev,
        orderItems: newItems
      };
    });
  };



  // Clear all order items
  const clearAllItems = () => {
    if (confirm('Are you sure you want to remove all items from this order?')) {
      setFormData(prev => ({
        ...prev,
        orderItems: []
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate order items
      if (formData.orderItems.length === 0) {
        throw new Error('Please add at least one product to the order');
      }

      for (const item of formData.orderItems) {
        if (!item.productId) {
          throw new Error('Please select a product for all order items');
        }
        if (item.selectedColors.length === 0) {
          throw new Error('Please select at least one color for each product');
        }
        if (item.selectedSizes.length === 0) {
          throw new Error('Please select at least one size for each product');
        }
      }

      const response = await fetch('/api/orders/create-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          date: formData.date,
          state: formData.state,
          customerName: formData.customerName,
          contactNo: formData.contactNo,
          orderItems: formData.orderItems,
          paymentMode: formData.paymentMode,
          orderConfirmation: formData.orderConfirmation,
          comments: formData.comments,
          processOrder: formData.processOrder,
          orderStatus: formData.orderStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Order created successfully!');
        router.push('/orders');
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`Error creating order: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Add New Order (V2)</h1>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID *
              </label>
              <input
                type="text"
                name="orderId"
                value={formData.orderId}
                onChange={handleInputChange}
                required
                placeholder="Enter order ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                placeholder="Enter customer name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleInputChange}
                required
                placeholder="Enter contact number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode *
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Payment Mode</option>
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Items Section */}
          <div className="mb-8">
            <BulkOrderTable
              orderItems={formData.orderItems}
              products={products}
              onAddItem={addOrderItem}
              onUpdateItem={updateOrderItem}
              onRemoveItem={removeOrderItem}
              onClearAll={clearAllItems}
            />
          </div>

          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleInputChange}
                required
                placeholder="Enter total amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Confirmation *
              </label>
              <select
                name="orderConfirmation"
                value={formData.orderConfirmation}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Confirmation Status</option>
                {orderConfirmations.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Order Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status *
              </label>
              <select
                name="orderStatus"
                value={formData.orderStatus}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {orderStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter any additional comments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Process Order Checkbox */}
          <div className="mb-8">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="processOrder"
                checked={formData.processOrder}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Process Order Immediately</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}