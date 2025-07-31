"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BulkProductSelectionModal from "@/components/ui/BulkProductSelectionModal";

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

interface BulkOrderRow {
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

export default function BulkOrdersPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<BulkOrderRow[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    // Add initial empty order rows
    const initialRows = Array.from({ length: 5 }, (_, index) => createNewOrderRow(index));
    setOrders(initialRows);
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



  const createNewOrderRow = (index: number): BulkOrderRow => {
    return {
      id: `row-${index}-${Math.random().toString(36).substr(2, 5)}`,
      orderId: "",
      date: new Date().toISOString().split('T')[0],
      customerName: "",
      contactNo: "",
      state: "",
      selectedProducts: [],
      totalAmount: 0,
      paymentMode: "",
      orderConfirmation: "",
      comments: "",
      orderStatus: "New"
    };
  };

  const addNewOrderRow = () => {
    const newOrder = createNewOrderRow(orders.length);
    setOrders(prev => [...prev, newOrder]);
  };

  const removeOrderRow = (orderRowId: string) => {
    if (orders.length === 1) {
      alert('You must have at least one order row');
      return;
    }
    
    setOrders(prev => prev.filter(order => order.id !== orderRowId));
  };

  const updateOrderField = (orderRowId: string, field: keyof BulkOrderRow, value: string | number | SelectedProduct[]) => {
    setOrders(prev => prev.map(order => 
      order.id === orderRowId 
        ? { ...order, [field]: value }
        : order
    ));
  };

  const calculateOrderTotal = (selectedProducts: SelectedProduct[]) => {
    return selectedProducts.reduce((total, product) => 
      total + (product.quantity * product.unitPrice), 0
    );
  };

  const handleProductSelection = (orderRowId: string) => {
    setEditingOrderId(orderRowId);
    setProductModalOpen(true);
  };

  const handleProductsSelected = (selectedProducts: SelectedProduct[]) => {
    if (editingOrderId) {
      const totalAmount = calculateOrderTotal(selectedProducts);
      setOrders(prev => prev.map(order => 
        order.id === editingOrderId 
          ? { 
              ...order, 
              selectedProducts: selectedProducts,
              totalAmount: totalAmount
            }
          : order
      ));
    }
    setEditingOrderId(null);
    setProductModalOpen(false);
  };

  const handleModalClose = () => {
    setEditingOrderId(null);
    setProductModalOpen(false);
  };

  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    
    try {
      // Filter out empty rows and validate
      const validOrders = orders.filter(order => 
        order.orderId && order.customerName && order.contactNo && order.selectedProducts.length > 0
      );

      if (validOrders.length === 0) {
        throw new Error('Please fill at least one complete order with products');
      }

      // Validate each order
      for (const order of validOrders) {
        if (!order.orderId || !order.customerName || !order.contactNo || !order.state || !order.paymentMode || !order.orderConfirmation) {
          throw new Error(`Please fill all required fields for order ${order.orderId}`);
        }
        
        if (order.selectedProducts.length === 0) {
          throw new Error(`Please add at least one product to order ${order.orderId}`);
        }

        for (const product of order.selectedProducts) {
          if (!product.productId) {
            throw new Error(`Invalid product in order ${order.orderId}`);
          }
          if (product.selectedColors.length === 0) {
            throw new Error(`Please select at least one color for each product in order ${order.orderId}`);
          }
          if (product.selectedSizes.length === 0) {
            throw new Error(`Please select at least one size for each product in order ${order.orderId}`);
          }
        }
      }

      // Submit each order
      const results = [];
      for (const order of validOrders) {
        const orderItems = order.selectedProducts.map(product => ({
          productId: product.productId,
          selectedColors: product.selectedColors,
          selectedSizes: product.selectedSizes,
          quantity: product.quantity,
          unitPrice: product.unitPrice
        }));

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
            totalAmount: order.totalAmount || calculateOrderTotal(order.selectedProducts),
            paymentMode: order.paymentMode,
            orderConfirmation: order.orderConfirmation,
            comments: order.comments,
            orderStatus: order.orderStatus,
          }),
        });

        const result = await response.json();
        results.push({ orderId: order.orderId, success: result.success, error: result.error });
      }

      // Check results
      const failed = results.filter(r => !r.success);
      if (failed.length === 0) {
        alert(`All ${validOrders.length} orders created successfully!`);
        router.push('/orders');
      } else {
        const failedOrderIds = failed.map(f => f.orderId).join(', ');
        alert(`${validOrders.length - failed.length} orders created successfully. Failed orders: ${failedOrderIds}`);
      }
    } catch (error) {
      console.error('Error submitting orders:', error);
      alert(`Error creating orders: ${error instanceof Error ? error.message : 'Please try again.'}`);
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
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Order Entry</h1>
              <p className="text-gray-600">Create multiple orders efficiently in table format</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← Back to Home
              </button>
              <button
                onClick={addNewOrderRow}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID *
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date *
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name *
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact *
                  </th>
                                     <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     State *
                   </th>
                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Products *
                   </th>
                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Total Amount
                   </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment *
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status *
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                 {orders.map((order, index) => (
                   <tr key={order.id} className="hover:bg-gray-50">
                     <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                       {index + 1}
                     </td>
                     
                     {/* Order ID */}
                     <td className="px-3 py-4 whitespace-nowrap">
                       <input
                         type="text"
                         value={order.orderId}
                         onChange={(e) => updateOrderField(order.id, 'orderId', e.target.value)}
                         placeholder="Enter Order ID"
                         className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                       />
                     </td>
                     
                     {/* Date */}
                     <td className="px-3 py-4 whitespace-nowrap">
                       <input
                         type="date"
                         value={order.date}
                         onChange={(e) => updateOrderField(order.id, 'date', e.target.value)}
                         className="w-36 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                       />
                     </td>
                     
                     {/* Customer Name */}
                     <td className="px-3 py-4 whitespace-nowrap">
                       <input
                         type="text"
                         value={order.customerName}
                         onChange={(e) => updateOrderField(order.id, 'customerName', e.target.value)}
                         placeholder="Customer Name"
                         className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                       />
                     </td>
                     
                     {/* Contact */}
                     <td className="px-3 py-4 whitespace-nowrap">
                       <input
                         type="tel"
                         value={order.contactNo}
                         onChange={(e) => updateOrderField(order.id, 'contactNo', e.target.value)}
                         placeholder="Contact No"
                         className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                       />
                     </td>
                     
                     {/* State */}
                     <td className="px-3 py-4 whitespace-nowrap">
                       <select
                         value={order.state}
                         onChange={(e) => updateOrderField(order.id, 'state', e.target.value)}
                         className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                       >
                         <option value="">Select State</option>
                         {states.map(state => (
                           <option key={state} value={state}>{state}</option>
                         ))}
                       </select>
                     </td>
                     
                     {/* Products */}
                     <td className="px-3 py-4">
                       <div className="w-80">
                         {order.selectedProducts.length === 0 ? (
                           <button
                             onClick={() => handleProductSelection(order.id)}
                             className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 text-sm"
                           >
                             + Select Products
                           </button>
                         ) : (
                           <div className="space-y-2">
                             <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                               {order.selectedProducts.map((product, productIndex) => (
                                 <div
                                   key={productIndex}
                                   className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                 >
                                   <span className="truncate max-w-32">
                                     {product.productName}
                                   </span>
                                   <span className="ml-1 text-blue-600">
                                     ×{product.quantity}
                                   </span>
                                 </div>
                               ))}
                             </div>
                             <button
                               onClick={() => handleProductSelection(order.id)}
                               className="text-xs text-blue-600 hover:text-blue-800 underline"
                             >
                               Edit Products ({order.selectedProducts.length})
                             </button>
                           </div>
                         )}
                       </div>
                     </td>
                     
                     {/* Total Amount */}
                     <td className="px-3 py-4 whitespace-nowrap">
                       <input
                         type="number"
                         value={order.totalAmount || calculateOrderTotal(order.selectedProducts)}
                         onChange={(e) => updateOrderField(order.id, 'totalAmount', parseFloat(e.target.value) || 0)}
                         min="0"
                         step="0.01"
                         placeholder="Auto-calculated"
                         className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                       />
                     </td>
                      
                      {/* Payment Mode */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        <select
                          value={order.paymentMode}
                          onChange={(e) => updateOrderField(order.id, 'paymentMode', e.target.value)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          {paymentModes.map(mode => (
                            <option key={mode} value={mode}>{mode}</option>
                          ))}
                        </select>
                      </td>
                      
                      {/* Order Confirmation */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        <select
                          value={order.orderConfirmation}
                          onChange={(e) => updateOrderField(order.id, 'orderConfirmation', e.target.value)}
                          className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          {orderConfirmations.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      
                      {/* Comments */}
                      <td className="px-3 py-4">
                        <input
                          type="text"
                          value={order.comments}
                          onChange={(e) => updateOrderField(order.id, 'comments', e.target.value)}
                          placeholder="Comments"
                          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      
                      {/* Actions */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        <button
                          onClick={() => removeOrderRow(order.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          title="Remove Row"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Selection Modal */}
        <BulkProductSelectionModal
          isOpen={productModalOpen}
          onClose={handleModalClose}
          products={products}
          existingProducts={editingOrderId ? orders.find(o => o.id === editingOrderId)?.selectedProducts || [] : []}
          onSelectProducts={handleProductsSelected}
        />

        {/* Submit Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Total Rows: <span className="font-medium">{orders.length}</span>
              </p>
              <p className="text-sm text-gray-600">
                Valid Orders: <span className="font-medium">
                  {orders.filter(order => order.orderId && order.customerName && order.contactNo && order.selectedProducts.length > 0).length}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Total Products: <span className="font-medium">
                  {orders.reduce((total, order) => total + order.selectedProducts.length, 0)}
                </span>
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAll}
                disabled={isSubmitting || orders.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Orders...' : 'Submit Valid Orders'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}