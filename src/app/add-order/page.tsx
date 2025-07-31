"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrderForm {
  date: string;
  orderId: string;
  customerName: string;
  contactNo: string;
  state: string;
  items: string[];
  colors: string[];
  sizes: string[];
  qty: number;
  amount: string;
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

const products = [
  "Raglan MTSH09", "Polo MTSH06", "Athletic Short MSHR05", "Jogger MPYJ02", "Jacket/Upper MTRA04"
];

const colors = [
 "Airforce Blue", "Royal Blue", "Rama Green", "Yellow", "Black", "White", "Light Gray", "Peach", "Dark Gray",
  "Navy Blue", "Maroon", "Forest Green", "Bottle Green", "Wine", "Sky Blue", "Neon"
];

const sizes = ["M", "L", "XL", "2XL", "3XL", "4XL"];

const paymentModes = ["PAID", "COD"];

const orderConfirmations = ["Confirmed", "Pending", "Cancelled"];

const orderStatuses = [
  "New", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"
];

export default function AddOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<OrderForm>({
    date: new Date().toISOString().split('T')[0],
    orderId: "",
    customerName: "",
    contactNo: "",
    state: "",
    items: [],
    colors: [],
    sizes: [],
    qty: 0,
    amount: "",
    paymentMode: "",
    orderConfirmation: "",
    comments: "",
    processOrder: false,
    orderStatus: "New"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[name as keyof OrderForm] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      // Auto-update quantity based on colors selected
      if (name === "colors") {
        return { ...prev, [name]: newArray, qty: newArray.length };
      }
      
      return { ...prev, [name]: newArray };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: formData.items.join(', '),
          colors: formData.colors.join(', '),
          sizes: formData.sizes.join(', '),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Order added successfully!');
        router.push('/orders');
      } else {
        throw new Error(result.error || 'Failed to add order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error adding order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Add New Order</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
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

            {/* Items (Multi-select) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items * (Multi-select)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                {products.map(product => (
                  <label key={product} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.items.includes(product)}
                      onChange={() => handleMultiSelectChange('items', product)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{product}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Selected: {formData.items.join(', ') || 'None'}</p>
            </div>

            {/* Colors (Multi-select) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors * (Multi-select - Auto updates quantity)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                {colors.map(color => (
                  <label key={color} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.colors.includes(color)}
                      onChange={() => handleMultiSelectChange('colors', color)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{color}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Selected: {formData.colors.join(', ') || 'None'}</p>
            </div>

            {/* Sizes (Multi-select) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sizes * (Multi-select)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 border border-gray-300 rounded-md p-3">
                {sizes.map(size => (
                  <label key={size} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.sizes.includes(size)}
                      onChange={() => handleMultiSelectChange('sizes', size)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Selected: {formData.sizes.join(', ') || 'None'}</p>
            </div>

            {/* Quantity (Auto-filled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Auto-filled based on colors)
              </label>
              <input
                type="number"
                name="qty"
                value={formData.qty}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                placeholder="Enter amount"
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
            <div className="md:col-span-2">
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

            {/* Process Order Checkbox */}
            <div className="md:col-span-2">
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
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-4">
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
              {isSubmitting ? 'Adding Order...' : 'Add Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}