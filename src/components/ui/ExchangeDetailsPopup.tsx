"use client";

import { useState, useRef } from "react";

interface SelectedProduct {
  productId: number;
  productName: string;
  selectedColors: string[];
  selectedSizes: string[];
  quantity: number;
  unitPrice: number;
}

interface OrderRow {
  id: string;
  orderId: string;
  date: string;
  customerName: string;
  contactNo: string;
  state: string;
  selectedProducts: SelectedProduct[];
  totalAmount: number;
  paymentMode: string;
  orderConfirmation: string;
  comments: string;
  orderStatus: string;
  isModified: boolean;
  paymentReceived?: boolean;
  rtoReceived?: boolean;
  damaged?: boolean;
  reviewTaken?: string;
  customerReview?: string;
  productReview?: string;
  isReturn?: boolean;
  returnReason?: string;
  returnInitiated?: boolean;
  returnPicked?: boolean;
  returnDelivered?: boolean;
  shippingAdjustment?: string;
  returnStatus?: string;
  exchangeStatus?: string;
  whatsappNotificationFailedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExchangeDetailsPopupProps {
  order: OrderRow;
  isVisible: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onUpdate: (updatedOrder: OrderRow) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const exchangeStatusOptions = [
  "Exchange Shipped", 
  "Exchange Intransit", 
  "Exchange Delivered"
];

export default function ExchangeDetailsPopup({ 
  order, 
  isVisible, 
  position, 
  onClose,
  onUpdate,
  onMouseEnter,
  onMouseLeave
}: ExchangeDetailsPopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    contactNo: order?.contactNo || '',
    comments: order?.comments || '',
    returnInitiated: order?.returnInitiated || false,
    returnPicked: order?.returnPicked || false,
    returnDelivered: order?.returnDelivered || false,
    exchangeStatus: order?.exchangeStatus || ''
  });

  // Add null check for order
  if (!isVisible || !position || !order) return null;

  // Prevent popup from closing when clicking inside it
  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!order) return;
    
    setIsSubmitting(true);
    try {
      const orderItems = order.selectedProducts?.map(product => ({
        productId: product.productId,
        selectedColors: product.selectedColors,
        selectedSizes: product.selectedSizes,
        quantity: product.quantity,
        unitPrice: product.unitPrice
      })) || [];

      const response = await fetch('/api/orders/create-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.orderId,
          date: order.date,
          state: order.state,
          customerName: order.customerName,
          contactNo: formData.contactNo,
          orderItems: orderItems,
          totalAmount: order.totalAmount,
          paymentMode: order.paymentMode,
          orderConfirmation: order.orderConfirmation,
          comments: formData.comments,
          orderStatus: order.orderStatus,
          paymentReceived: order.paymentReceived,
          rtoReceived: order.rtoReceived,
          damaged: order.damaged,
          reviewTaken: order.reviewTaken,
          customerReview: order.customerReview,
          productReview: order.productReview,
          isReturn: order.isReturn,
          returnReason: order.returnReason,
          returnInitiated: formData.returnInitiated,
          returnPicked: formData.returnPicked,
          returnDelivered: formData.returnDelivered,
          shippingAdjustment: order.shippingAdjustment,
          returnStatus: order.returnStatus,
          exchangeStatus: formData.exchangeStatus,
          whatsappNotificationFailedReason: order.whatsappNotificationFailedReason,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update the order in the parent component
        const updatedOrder = {
          ...order,
          contactNo: formData.contactNo,
          comments: formData.comments,
          returnInitiated: formData.returnInitiated,
          returnPicked: formData.returnPicked,
          returnDelivered: formData.returnDelivered,
          exchangeStatus: formData.exchangeStatus,
          isModified: false
        };
        onUpdate(updatedOrder);
        setIsEditing(false);
        alert('Order updated successfully!');
      } else {
        alert(`Failed to update order: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert(`Error updating order: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      contactNo: order?.contactNo || '',
      comments: order?.comments || '',
      returnInitiated: order?.returnInitiated || false,
      returnPicked: order?.returnPicked || false,
      returnDelivered: order?.returnDelivered || false,
      exchangeStatus: order?.exchangeStatus || ''
    });
    setIsEditing(false);
  };

  return (
    <div 
      ref={popupRef}
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handlePopupClick}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900">Exchange Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.contactNo}
                onChange={(e) => handleInputChange('contactNo', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900 font-medium">{formData.contactNo || 'N/A'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Exchange Status
            </label>
            {isEditing ? (
              <select
                value={formData.exchangeStatus}
                onChange={(e) => handleInputChange('exchangeStatus', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Status</option>
                {exchangeStatusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-900">{formData.exchangeStatus || 'N/A'}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Return Initiated
            </label>
            {isEditing ? (
              <input
                type="checkbox"
                checked={formData.returnInitiated}
                onChange={(e) => handleInputChange('returnInitiated', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{formData.returnInitiated ? 'Yes' : 'No'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Return Picked
            </label>
            {isEditing ? (
              <input
                type="checkbox"
                checked={formData.returnPicked}
                onChange={(e) => handleInputChange('returnPicked', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{formData.returnPicked ? 'Yes' : 'No'}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Return Delivered
          </label>
          {isEditing ? (
            <input
              type="checkbox"
              checked={formData.returnDelivered}
              onChange={(e) => handleInputChange('returnDelivered', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          ) : (
            <p className="text-sm text-gray-900">{formData.returnDelivered ? 'Yes' : 'No'}</p>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Comments
          </label>
          {isEditing ? (
            <textarea
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              rows={3}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          ) : (
            <p className="text-sm text-gray-900">{formData.comments || 'N/A'}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Arrow pointing to the row */}
      <div className="absolute bottom-0 left-4 transform translate-y-full">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-300"></div>
      </div>
    </div>
  );
}
