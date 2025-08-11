"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BulkProductSelectionModal from "@/components/ui/BulkProductSelectionModal";
import { useAuth } from "@/components/AuthProvider";
import { UserRole } from "@/lib/auth";

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
  // Additional fields for admin/super admin
  paymentReceived?: boolean;
  processOrder?: boolean;
  orderPacked?: boolean;
  orderCancelled?: boolean;
  delivered?: boolean;
  isRto?: boolean;
  rtoReason?: string;
  reviewTaken?: string;
  customerReview?: string;
  productReview?: string;
  isReturn?: boolean;
  whatsappNotificationFailedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiOrder {
  id: number;
  order_id: string;
  order_date: string;
  state: string;
  total_amount: number;
  payment_mode: string;
  order_confirmation: boolean;
  order_status: string;
  comments: string;
  customer_name: string;
  contact_no: string;
  // Additional fields from orders_new table
  payment_received?: boolean;
  process_order?: boolean;
  order_packed?: boolean;
  order_cancelled?: boolean;
  delivered?: boolean;
  is_rto?: boolean;
  rto_reason?: string;
  review_taken?: string;
  customer_review?: string;
  product_review?: string;
  is_return?: boolean;
  whatsapp_notification_failed_reason?: string;
  created_at?: string;
  updated_at?: string;
  order_items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    selected_colors: string[];
    selected_sizes: string[];
    quantity: number;
    unit_price: number;
  }>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  pageSize: number;
}

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const paymentModes = ["PAID", "COD"];
const orderStatuses = ["New", "Processing", "Shipped", "Delivered", "Cancelled", "RTO", "Exchange", "Return", "InTransit"];
const orderConfirmations = ["YES", "NOT REQUIRED", "COULDNOT CONNECT", "CANCELLED"];
const pageSizeOptions = [10, 25, 50, 100];

export default function OrdersManagementPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    pageSize: 25
  });
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const { user } = useAuth();

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch all orders on component mount
  useEffect(() => {
    fetchAllOrders();
  }, [pagination.currentPage, pagination.pageSize]);

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

  const fetchAllOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch(`/api/orders/list-v2?page=${pagination.currentPage}&limit=${pagination.pageSize}`);
      const result = await response.json();
      
      if (result.success) {
        // Convert API results to editable order rows
        const orderRows = result.orders.map((order: ApiOrder) => ({
          id: `order-${order.id}`,
          orderId: order.order_id,
          date: order.order_date ? order.order_date.split('T')[0] : new Date().toISOString().split('T')[0],
          customerName: order.customer_name || "",
          contactNo: order.contact_no || "",
          state: order.state || "",
          selectedProducts: order.order_items ? order.order_items.map((item) => ({
            productId: item.product_id,
            productName: item.product_name || "",
            selectedColors: (() => {
              try {
                if (Array.isArray(item.selected_colors)) return item.selected_colors;
                if (typeof item.selected_colors === 'string') {
                  const parsed = JSON.parse(item.selected_colors);
                  return Array.isArray(parsed) ? parsed : [];
                }
                return [];
              } catch (error) {
                console.warn('Error parsing selected_colors:', error, item.selected_colors);
                return [];
              }
            })(),
            selectedSizes: (() => {
              try {
                if (Array.isArray(item.selected_sizes)) return item.selected_sizes;
                if (typeof item.selected_sizes === 'string') {
                  const parsed = JSON.parse(item.selected_sizes);
                  return Array.isArray(parsed) ? parsed : [];
                }
                return [];
              } catch (error) {
                console.warn('Error parsing selected_sizes:', error, item.selected_sizes);
                return [];
              }
            })(),
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || 0
          })) : [],
          totalAmount: order.total_amount || 0,
          paymentMode: order.payment_mode || "",
          orderConfirmation: order.order_confirmation ? "Confirmed" : "Pending",
          comments: order.comments || "",
          orderStatus: order.order_status || "New",
          isModified: false,
          // Map additional fields from API to new interface
          paymentReceived: order.payment_received,
          processOrder: order.process_order,
          orderPacked: order.order_packed,
          orderCancelled: order.order_cancelled,
          delivered: order.delivered,
          isRto: order.is_rto,
          rtoReason: order.rto_reason,
          reviewTaken: order.review_taken,
          customerReview: order.customer_review,
          productReview: order.product_review,
          isReturn: order.is_return,
          whatsappNotificationFailedReason: order.whatsapp_notification_failed_reason,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        }));
        setOrders(orderRows);
        
        // Update pagination info
        setPagination(prev => ({
          ...prev,
          totalPages: result.totalPages || 1,
          totalOrders: result.totalOrders || result.orders.length
        }));
      } else {
        console.error('Failed to fetch orders:', result.error);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const searchOrders = async () => {
    if (!searchQuery.trim()) {
      // If search query is empty, fetch all orders
      fetchAllOrders();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/orders/list-v2?search=${encodeURIComponent(searchQuery)}&page=${pagination.currentPage}&limit=${pagination.pageSize}`);
      const result = await response.json();
      
      if (result.success) {
        // Convert search results to editable order rows
        const orderRows = result.orders.map((order: ApiOrder) => ({
          id: `order-${order.id}`,
          orderId: order.order_id,
          date: order.order_date ? order.order_date.split('T')[0] : new Date().toISOString().split('T')[0],
          customerName: order.customer_name || "",
          contactNo: order.contact_no || "",
          state: order.state || "",
          selectedProducts: order.order_items ? order.order_items.map((item) => ({
            productId: item.product_id,
            productName: item.product_name || "",
            selectedColors: (() => {
              try {
                if (Array.isArray(item.selected_colors)) return item.selected_colors;
                if (typeof item.selected_colors === 'string') {
                  const parsed = JSON.parse(item.selected_colors);
                  return Array.isArray(parsed) ? parsed : [];
                }
                return [];
              } catch (error) {
                console.warn('Error parsing selected_colors:', error, item.selected_colors);
                return [];
              }
            })(),
            selectedSizes: (() => {
              try {
                if (Array.isArray(item.selected_sizes)) return item.selected_sizes;
                if (typeof item.selected_sizes === 'string') {
                  const parsed = JSON.parse(item.selected_sizes);
                  return Array.isArray(parsed) ? parsed : [];
                }
                return [];
              } catch (error) {
                console.warn('Error parsing selected_sizes:', error, item.selected_sizes);
                return [];
              }
            })(),
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || 0
          })) : [],
          totalAmount: order.total_amount || 0,
          paymentMode: order.payment_mode || "",
          orderConfirmation: order.order_confirmation ? "Confirmed" : "Pending",
          comments: order.comments || "",
          orderStatus: order.order_status || "New",
          isModified: false,
          // Map additional fields from API to new interface
          paymentReceived: order.payment_received,
          processOrder: order.process_order,
          orderPacked: order.order_packed,
          orderCancelled: order.order_cancelled,
          delivered: order.delivered,
          isRto: order.is_rto,
          rtoReason: order.rto_reason,
          reviewTaken: order.review_taken,
          customerReview: order.customer_review,
          productReview: order.product_review,
          isReturn: order.is_return,
          whatsappNotificationFailedReason: order.whatsapp_notification_failed_reason,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        }));
        setOrders(orderRows);
        
        // Update pagination info for search results
        setPagination(prev => ({
          ...prev,
          totalPages: result.totalPages || 1,
          totalOrders: result.totalOrders || result.orders.length
        }));
      } else {
        alert('No orders found or error occurred');
        setOrders([]);
        setPagination(prev => ({ ...prev, totalPages: 1, totalOrders: 0 }));
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      alert('Error searching orders. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: newPageSize, 
      currentPage: 1 // Reset to first page when changing page size
    }));
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchAllOrders();
  };

  const updateOrderField = (orderRowId: string, field: keyof OrderRow, value: string | number | boolean | SelectedProduct[]) => {
    setOrders(prev => prev.map(order => 
      order.id === orderRowId 
        ? { ...order, [field]: value, isModified: true }
        : order
    ));
  };

  const handleProductSelection = (orderRowId: string) => {
    setEditingOrderId(orderRowId);
    setProductModalOpen(true);
  };

  const handleProductsSelected = (selectedProducts: SelectedProduct[]) => {
    if (editingOrderId) {
      setOrders(prev => prev.map(order => 
        order.id === editingOrderId 
          ? { 
              ...order, 
              selectedProducts: selectedProducts,
              isModified: true
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

  const handleUpdateOrder = async (order: OrderRow) => {
    if (!order.isModified) {
      alert('No changes detected for this order');
      return;
    }

    try {
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
          totalAmount: order.totalAmount,
          paymentMode: order.paymentMode,
          orderConfirmation: order.orderConfirmation,
          comments: order.comments,
          orderStatus: order.orderStatus,
          // Map additional fields to API payload
          paymentReceived: order.paymentReceived,
          processOrder: order.processOrder,
          orderPacked: order.orderPacked,
          orderCancelled: order.orderCancelled,
          delivered: order.delivered,
          isRto: order.isRto,
          rtoReason: order.rtoReason,
          reviewTaken: order.reviewTaken,
          customerReview: order.customerReview,
          productReview: order.productReview,
          isReturn: order.isReturn,
          whatsappNotificationFailedReason: order.whatsappNotificationFailedReason,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Order ${order.orderId} updated successfully!`);
        // Mark as not modified
        setOrders(prev => prev.map(o => 
          o.id === order.id ? { ...o, isModified: false } : o
        ));
      } else {
        alert(`Failed to update order ${order.orderId}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert(`Error updating order ${order.orderId}: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleUpdateAll = async () => {
    const modifiedOrders = orders.filter(order => order.isModified);
    
    if (modifiedOrders.length === 0) {
      alert('No orders have been modified');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const results = [];
      for (const order of modifiedOrders) {
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
            totalAmount: order.totalAmount,
            paymentMode: order.paymentMode,
            orderConfirmation: order.orderConfirmation,
            comments: order.comments,
            orderStatus: order.orderStatus,
            // Map additional fields to API payload
            paymentReceived: order.paymentReceived,
            processOrder: order.processOrder,
            orderPacked: order.orderPacked,
            orderCancelled: order.orderCancelled,
            delivered: order.delivered,
            isRto: order.isRto,
            rtoReason: order.rtoReason,
            reviewTaken: order.reviewTaken,
            customerReview: order.customerReview,
            productReview: order.productReview,
            isReturn: order.isReturn,
            whatsappNotificationFailedReason: order.whatsappNotificationFailedReason,
          }),
        });

        const result = await response.json();
        results.push({ orderId: order.orderId, success: result.success, error: result.error });
      }

      // Check results
      const failed = results.filter(r => !r.success);
      if (failed.length === 0) {
        alert(`All ${modifiedOrders.length} orders updated successfully!`);
        // Mark all as not modified
        setOrders(prev => prev.map(order => ({ ...order, isModified: false })));
      } else {
        const failedOrderIds = failed.map(f => f.orderId).join(', ');
        alert(`${modifiedOrders.length - failed.length} orders updated successfully. Failed orders: ${failedOrderIds}`);
      }
    } catch (error) {
      console.error('Error updating orders:', error);
      alert(`Error updating orders: ${error instanceof Error ? error.message : 'Please try again.'}`);
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
              <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
              <p className="text-gray-600">Search and update existing orders efficiently</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID, Customer Name, or Contact Number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={searchOrders}
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Page Size:</label>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalOrders)} of {pagination.totalOrders} orders
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600 px-3">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingOrders && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
            <div className="text-lg text-gray-600">Loading orders...</div>
          </div>
        )}

        {/* Orders Table */}
        {!isLoadingOrders && orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    {/* Customer Support View Fields */}
                    {user && user.role === UserRole.CUSTOMER_SUPPORT ? (
                      <>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MOBILE NO.
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PAYMENT MODE
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ORDER CONFIRMATION
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          COMMENTS
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PROCESS ORDER
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STATUS
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Name
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Products
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Confirmation
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        {/* Admin/Super Admin Only Fields */}
                        {user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                          <>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Received
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Process Order
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order Packed
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order Cancelled
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Delivered
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              RTO
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Return
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Comments
                            </th>
                            {/* <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reviews
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              WhatsApp
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Timestamps
                            </th> */}
                          </>
                        )}
                      </>
                    )}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order, index) => {
                    // Determine row color based on order status
                    let rowColorClass = '';
                    
                    if (order.orderStatus === 'Delivered') {
                      rowColorClass = 'bg-green-200 hover:bg-green-300';
                    } else if (order.orderStatus === 'RTO') {
                      rowColorClass = 'bg-red-200 hover:bg-red-300';
                    } else if (order.orderStatus === 'Return') {
                      rowColorClass = 'bg-blue-200 hover:bg-blue-300';
                    } else if (order.orderStatus === 'Exchange') {
                      rowColorClass = 'bg-purple-200 hover:bg-purple-300';
                    } else {
                      rowColorClass = 'hover:bg-gray-100';
                    }
                    
                    // Add modified indicator with higher priority
                    // if (order.isModified) {
                    //   rowColorClass = 'bg-yellow-100 hover:bg-yellow-200';
                    // }
                    
                    return (
                      <tr key={order.id} className={rowColorClass}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {((pagination.currentPage - 1) * pagination.pageSize) + index + 1}
                      </td>
                      
                                            {/* Order ID */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{order.orderId}</span>
                      </td>
                      
                      {/* Customer Support View Fields */}
                      {user && user.role === UserRole.CUSTOMER_SUPPORT ? (
                        <>
                          {/* Mobile No */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{order.contactNo}</span>
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
                              value={order.orderConfirmation || ''}
                              onChange={(e) => updateOrderField(order.id, 'orderConfirmation', e.target.value)}
                              className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select</option>
                              {orderConfirmations.map(confirmation => (
                                <option key={confirmation} value={confirmation}>{confirmation}</option>
                              ))}
                            </select>
                          </td>
                          
                          {/* Comments */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={order.comments || ''}
                              onChange={(e) => updateOrderField(order.id, 'comments', e.target.value)}
                              placeholder="Comments"
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Process Order */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={order.processOrder || false}
                              onChange={(e) => updateOrderField(order.id, 'processOrder', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Status */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <select
                              value={order.orderStatus}
                              onChange={(e) => updateOrderField(order.id, 'orderStatus', e.target.value)}
                              className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {orderStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                        </>
                      ) : (
                        <>
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
                              value={order.totalAmount || ''}
                              onChange={(e) => updateOrderField(order.id, 'totalAmount', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              placeholder="Enter amount"
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
                              value={order.orderConfirmation || ''}
                              onChange={(e) => updateOrderField(order.id, 'orderConfirmation', e.target.value)}
                              className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select</option>
                              {orderConfirmations.map(confirmation => (
                                <option key={confirmation} value={confirmation}>{confirmation}</option>
                              ))}
                            </select>
                          </td>
                          
                          {/* Order Status */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <select
                              value={order.orderStatus}
                              onChange={(e) => updateOrderField(order.id, 'orderStatus', e.target.value)}
                              className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {orderStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                        </>
                      )}
                      
                      {/* Admin/Super Admin Only Fields */}
                      {user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                        <>
                          {/* Payment Received */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={order.paymentReceived || false}
                              onChange={(e) => updateOrderField(order.id, 'paymentReceived', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Process Order */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={order.processOrder || false}
                              onChange={(e) => updateOrderField(order.id, 'processOrder', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Order Packed */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={order.orderPacked || false}
                              onChange={(e) => updateOrderField(order.id, 'orderPacked', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Order Cancelled */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={order.orderCancelled || false}
                              onChange={(e) => updateOrderField(order.id, 'orderCancelled', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Delivered */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={order.delivered || false}
                              onChange={(e) => updateOrderField(order.id, 'delivered', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* RTO */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <input
                                type="checkbox"
                                checked={order.isRto || false}
                                onChange={(e) => updateOrderField(order.id, 'isRto', e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              {order.isRto && (
                                <input
                                  type="text"
                                  value={order.rtoReason || ''}
                                  onChange={(e) => updateOrderField(order.id, 'rtoReason', e.target.value)}
                                  placeholder="RTO Reason"
                                  className="w-24 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              )}
                            </div>
                          </td>
                          
                          {/* Return */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={order.isReturn || false}
                              onChange={(e) => updateOrderField(order.id, 'isReturn', e.target.checked)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Comments */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={order.comments || ''}
                              onChange={(e) => updateOrderField(order.id, 'comments', e.target.value)}
                              placeholder="Comments"
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          
                          {/* Reviews */}
                          {/*<td className="px-3 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={order.reviewTaken || ''}
                                onChange={(e) => updateOrderField(order.id, 'reviewTaken', e.target.value)}
                                placeholder="Review Taken"
                                className="w-24 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                value={order.customerReview || ''}
                                onChange={(e) => updateOrderField(order.id, 'customerReview', e.target.value)}
                                placeholder="Customer Review"
                                className="w-24 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                value={order.productReview || ''}
                                onChange={(e) => updateOrderField(order.id, 'productReview', e.target.value)}
                                placeholder="Product Review"
                                className="w-24 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </td>*/}
                          
                          {/* WhatsApp */}
                          {/*<td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={order.whatsappNotificationFailedReason || ''}
                              onChange={(e) => updateOrderField(order.id, 'whatsappNotificationFailedReason', e.target.value)}
                              placeholder="WhatsApp Failed Reason"
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>*/}
                          
                          {/* Timestamps */}
                          {/*<td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Created: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</div>
                              <div>Updated: {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          </td>*/}
                        </>
                      )}
                      
                      {/* Actions */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateOrder(order)}
                            disabled={!order.isModified}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Update Order"
                          >
                            Update
                          </button>
                          {order.isModified && (
                            <span className="text-xs text-yellow-600 font-medium">Modified</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Selection Modal */}
        <BulkProductSelectionModal
          key={editingOrderId || 'new'}
          isOpen={productModalOpen}
          onClose={handleModalClose}
          products={products}
          existingProducts={editingOrderId ? orders.find(o => o.id === editingOrderId)?.selectedProducts || [] : []}
          onSelectProducts={handleProductsSelected}
        />

        {/* Update Actions */}
        {!isLoadingOrders && orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Total Orders: <span className="font-medium">{pagination.totalOrders}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Modified Orders: <span className="font-medium text-yellow-600">
                    {orders.filter(order => order.isModified).length}
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
                  Back to Home
                </button>
                <button
                  onClick={handleUpdateAll}
                  disabled={isSubmitting || orders.filter(order => order.isModified).length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating Orders...' : 'Update All Modified Orders'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {!isLoadingOrders && searchQuery && !isSearching && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">No orders found matching your search criteria.</p>
            <p className="text-sm text-gray-400 mt-2">Try searching with different terms or check the spelling.</p>
          </div>
        )}

        {/* No Orders Message */}
        {!isLoadingOrders && !searchQuery && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">No orders found.</p>
            <p className="text-sm text-gray-400 mt-2">Orders will appear here once they are available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
