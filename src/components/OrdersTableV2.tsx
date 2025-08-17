'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import FilterModal from './ui/FilterModal';

interface OrderItem {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  category: string;
  selected_colors: string[];
  selected_sizes: string[];
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  order_id: string;
  order_date: string;
  state: string;
  total_amount: number;
  payment_mode: string;
  payment_received: boolean;
  order_confirmation: string;
  order_status: string;
  comments: string;
  process_order: boolean;
  order_packed: boolean;
  order_cancelled: boolean;
  delivered: boolean;
  is_rto: boolean;
  rto_reason: string;
  review_taken: string;
  customer_review: string;
  product_review: string;
  is_return: boolean;
  whatsapp_notification_failed_reason: string;
  created_at: string;
  updated_at: string;
  customer_id: number;
  customer_name: string;
  contact_no: string;
  email: string;
  address: string;
  city: string;
  country: string;
  order_items: OrderItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const OrdersTableV2: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    customerName: '',
    orderDate: '',
    orderStatus: '',
    state: '',
    paymentMode: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [sortBy] = useState('created_at');
  const [sortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Debounce function
  const useDebounce = (value: typeof filters, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Debounce filters
  const debouncedFiltersValue = useDebounce(filters, 500);

  useEffect(() => {
    setDebouncedFilters(debouncedFiltersValue);
    setCurrentPage(1); // Reset to first page when filters change
  }, [debouncedFiltersValue]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: debouncedFilters.search,
        sortBy,
        sortOrder,
        customerName: debouncedFilters.customerName,
        orderDate: debouncedFilters.orderDate,
        orderStatus: debouncedFilters.orderStatus,
        state: debouncedFilters.state,
        paymentMode: debouncedFilters.paymentMode
      });

      const response = await fetch(`/api/orders/list-v2?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, debouncedFilters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApplyFilters = (newFilters: Record<string, string>) => {
    setFilters({
      search: newFilters.search || '',
      customerName: newFilters.customerName || '',
      orderDate: newFilters.orderDate || '',
      orderStatus: newFilters.orderStatus || '',
      state: newFilters.state || '',
      paymentMode: newFilters.paymentMode || ''
    });
    setIsFilterModalOpen(false);
  };

  // Note: handleSort function removed as sorting is not implemented in current UI
  // Can be re-added when column header sorting is implemented

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadgeColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Processing': 'bg-yellow-100 text-yellow-800',
      'Packed': 'bg-purple-100 text-purple-800',
      'Shipped': 'bg-indigo-100 text-indigo-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Returned': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading orders...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Orders (V2)</h2>
            <p className="text-sm text-gray-600">
              Showing {orders.length} of {pagination?.total || 0} orders
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={() => setIsFilterModalOpen(true)}
              className="whitespace-nowrap border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Advanced Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            No orders found matching your criteria.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              {/* Order Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      #{order.order_id}
                    </button>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(order.order_date)}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <button
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedOrders.has(order.id) ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">{order.customer_name}</span>
                  {order.contact_no && (
                    <span className="ml-2">• {order.contact_no}</span>
                  )}
                  {order.state && (
                    <span className="ml-2">• {order.state}</span>
                  )}
                  <span className="ml-2">• {order.payment_mode}</span>
                </div>
              </div>

              {/* Expanded Order Details */}
              {expandedOrders.has(order.id) && (
                <div className="p-4">
                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-gray-600">
                              Code: {item.product_code} • Category: {item.category}
                            </div>
                            <div className="text-sm text-gray-600">
                              Colors: {item.selected_colors?.join(', ') || 'None'} • 
                              Sizes: {item.selected_sizes?.join(', ') || 'None'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">Qty: {item.quantity}</div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(item.unit_price)} each
                            </div>
                            <div className="font-medium">
                              {formatCurrency(item.total_price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Order Confirmation:</span>
                      <div>{order.order_confirmation}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Payment Status:</span>
                      <div>{order.payment_received ? 'Received' : 'Pending'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Process Order:</span>
                      <div>{order.process_order ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Order Packed:</span>
                      <div>{order.order_packed ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Delivered:</span>
                      <div>{order.delivered ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">RTO:</span>
                      <div>{order.is_rto ? 'Yes' : 'No'}</div>
                    </div>
                    {order.comments && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <span className="font-medium text-gray-700">Comments:</span>
                        <div>{order.comments}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrev}
                className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-3 py-1 text-sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.hasNext}
                className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-3 py-1 text-sm"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Order Filters"
        filterType="text"
        options={[]}
        currentValue=""
        onApply={(value) => handleApplyFilters({ search: value as string })}
      />
    </div>
  );
};

export default OrdersTableV2;