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
  processOrder?: boolean;
  orderPacked?: boolean;
  orderCancelled?: boolean;
  delivered?: boolean;
  isRto?: boolean;
  rtoReason?: string;
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
  whatsappNotificationFailedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RtoDetailsPopupProps {
  order: OrderRow;
  isVisible: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onUpdate: (updatedOrder: OrderRow) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function RtoDetailsPopup({ 
  order, 
  isVisible, 
  position, 
  onClose,
  onUpdate,
  onMouseEnter,
  onMouseLeave
}: RtoDetailsPopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    comments: order?.comments || '',
    rtoReceived: order?.rtoReceived || false,
    damaged: order?.damaged || false,
    totalAmount: order?.totalAmount || 0
  });

  // Add null check for order
  if (!isVisible || !position || !order) return null;

  // Prevent popup from closing when clicking inside it
  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
          contactNo: order.contactNo,
          orderItems: orderItems,
          totalAmount: formData.totalAmount,
          paymentMode: order.paymentMode,
          orderConfirmation: order.orderConfirmation,
          comments: formData.comments,
          orderStatus: order.orderStatus,
          paymentReceived: order.paymentReceived,
          processOrder: order.processOrder,
          orderPacked: order.orderPacked,
          orderCancelled: order.orderCancelled,
          delivered: order.delivered,
          isRto: order.isRto,
          rtoReason: order.rtoReason,
          rtoReceived: formData.rtoReceived,
          damaged: formData.damaged,
          reviewTaken: order.reviewTaken,
          customerReview: order.customerReview,
          productReview: order.productReview,
          isReturn: order.isReturn,
          returnReason: order.returnReason,
          returnInitiated: order.returnInitiated,
          returnPicked: order.returnPicked,
          returnDelivered: order.returnDelivered,
          shippingAdjustment: order.shippingAdjustment,
          returnStatus: order.returnStatus,
          whatsappNotificationFailedReason: order.whatsappNotificationFailedReason,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update the order in the parent component
        const updatedOrder = {
          ...order,
          comments: formData.comments,
          rtoReceived: formData.rtoReceived,
          damaged: formData.damaged,
          totalAmount: formData.totalAmount,
          isModified: false
        };
        onUpdate(updatedOrder);
        setIsEditing(false);
        alert('RTO details updated successfully!');
      } else {
        alert(`Failed to update RTO details: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating RTO details:', error);
      alert(`Error updating RTO details: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      comments: order?.comments || '',
      rtoReceived: order?.rtoReceived || false,
      damaged: order?.damaged || false,
      totalAmount: order?.totalAmount || 0
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
          <h3 className="text-sm font-semibold text-gray-900">RTO Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
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
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              RTO Received
            </label>
            {isEditing ? (
              <input
                type="checkbox"
                checked={formData.rtoReceived}
                onChange={(e) => handleInputChange('rtoReceived', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{formData.rtoReceived ? 'Yes' : 'No'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Damaged
            </label>
            {isEditing ? (
              <input
                type="checkbox"
                checked={formData.damaged}
                onChange={(e) => handleInputChange('damaged', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{formData.damaged ? 'Yes' : 'No'}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Amount
          </label>
          {isEditing ? (
            <input
              type="number"
              value={formData.totalAmount || ''}
              onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <p className="text-sm text-gray-900 font-medium">₹{formData.totalAmount || 'N/A'}</p>
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
