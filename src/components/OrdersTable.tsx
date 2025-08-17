'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import FilterModal from './ui/FilterModal';

interface Order {
  id: number;
  order_id: string;
  date: string;
  state: string;
  item: string;
  color1: string;
  color2: string;
  color3: string;
  size: string;
  qty: number;
  amount: number;
  payment_mode: string;
  payment_received: boolean;
  order_confirmation: string;
  reason: string;
  process_order: boolean;
  order_packed: boolean;
  order_cancelled: boolean;
  delivered: boolean;
  is_rto: boolean;
  remarks: string;
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
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const OrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    customerName: '',
    orderDate: '',
    orderStatus: '',
    orderTotal: '',
    state: '',
    paymentMode: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [modifiedOrders, setModifiedOrders] = useState<Record<number, Partial<Order>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [editingField, setEditingField] = useState<{orderId: number, field: keyof Order} | null>(null);
  const [editValue, setEditValue] = useState<string>('');

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
        orderTotal: debouncedFilters.orderTotal,
        state: debouncedFilters.state,
        paymentMode: debouncedFilters.paymentMode
      });

      const response = await fetch(`/api/orders/list?${params}`);
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
      orderTotal: newFilters.orderTotal || '',
      state: newFilters.state || '',
      paymentMode: newFilters.paymentMode || ''
    });
  };



  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleCheckboxChange = (orderId: number, field: keyof Order, value: boolean) => {
    setModifiedOrders(prev => {
      const updated = {
        ...prev,
        [orderId]: {
          ...prev[orderId],
          [field]: value
        }
      };
      
      // Check if there are any changes
      const hasAnyChanges = Object.keys(updated).length > 0;
      setHasChanges(hasAnyChanges);
      
      return updated;
    });
  };

  const handleFieldEdit = (orderId: number, field: keyof Order, currentValue: string) => {
    setEditingField({ orderId, field });
    setEditValue(currentValue);
  };

  const handleFieldSave = (orderId: number, field: keyof Order) => {
    setModifiedOrders(prev => {
      const updated = {
        ...prev,
        [orderId]: {
          ...prev[orderId],
          [field]: editValue
        }
      };
      
      // Check if there are any changes
      const hasAnyChanges = Object.keys(updated).length > 0;
      setHasChanges(hasAnyChanges);
      
      return updated;
    });
    
    setEditingField(null);
    setEditValue('');
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelAllChanges = () => {
    setModifiedOrders({});
    setHasChanges(false);
    setEditingField(null);
    setEditValue('');
  };

  const handleFieldKeyPress = (e: React.KeyboardEvent, orderId: number, field: keyof Order) => {
    if (e.key === 'Enter') {
      handleFieldSave(orderId, field);
    } else if (e.key === 'Escape') {
      handleFieldCancel();
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      // Update each modified order
      for (const [orderId, changes] of Object.entries(modifiedOrders)) {
        const response = await fetch(`/api/orders/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: parseInt(orderId),
            ...changes
          }),
        });

        if (!response.ok) {
          console.error(`Failed to update order ${orderId}`);
        }
      }

      // Clear modifications and refresh data
      setModifiedOrders({});
      setHasChanges(false);
      fetchOrders();
      
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBoolean = (order: Order, field: keyof Order) => {
    const isModified = modifiedOrders[order.id]?.[field] !== undefined;
    const currentValue = isModified 
      ? modifiedOrders[order.id]![field] as boolean 
      : order[field] as boolean;

    return (
      <input
        type="checkbox"
        checked={currentValue}
        onChange={(e) => handleCheckboxChange(order.id, field, e.target.checked)}
        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
          isModified ? 'ring-2 ring-yellow-400' : ''
        }`}
      />
    );
  };

  const EditableField = ({ order, field, className = "" }: { order: Order, field: keyof Order, className?: string }) => {
    const isEditing = editingField?.orderId === order.id && editingField?.field === field;
    const isModified = modifiedOrders[order.id]?.[field] !== undefined;
    const currentValue = isModified 
      ? (modifiedOrders[order.id]![field] as string) || '' 
      : (order[field] as string) || '';

    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => handleFieldKeyPress(e, order.id, field)}
          onBlur={() => handleFieldSave(order.id, field)}
          className={`px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          autoFocus
        />
      );
    }

    return (
      <div 
        className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors ${className} ${
          isModified ? 'bg-yellow-50 border border-yellow-200' : ''
        }`}
        onClick={() => handleFieldEdit(order.id, field, currentValue)}
        title="Click to edit"
      >
        {currentValue || '-'}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button onClick={() => setIsFilterModalOpen(true)}>
            Open Filters
          </Button>
        </div>

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

      {/* Table Container */}
      <Card className="p-0">
        {hasChanges && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-800">
                You have unsaved changes. Click Save to update the records or Cancel to discard changes.
              </span>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleCancelAllChanges}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel Changes
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Save All Changes
                </Button>
              </div>
            </div>
          </div>
        )}
        
                {/* Table with horizontal scroll */}
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <div className="min-w-[2000px]"> {/* Set minimum width to accommodate all columns */}
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('order_id')}>
                  Order ID {sortBy === 'order_id' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                  Date {sortBy === 'date' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customer_name')}>
                  Customer {sortBy === 'customer_name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color3</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Confirmation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Packed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Cancelled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Is RTO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RTO Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Taken</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Review</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Review</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Is Return</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp Failed Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('created_at')}>
                  Created At {sortBy === 'created_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('updated_at')}>
                  Updated At {sortBy === 'updated_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <EditableField order={order} field="customer_name" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="contact_no" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="email" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <EditableField order={order} field="address" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="city" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="country" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="state" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <EditableField order={order} field="item" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="color1" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="color2" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="color3" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="size" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{order.amount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="payment_mode" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(order, 'payment_received')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="order_confirmation" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="reason" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(order, 'process_order')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(order, 'order_packed')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(order, 'order_cancelled')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(order, 'delivered')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(order, 'is_rto')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="remarks" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="rto_reason" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="review_taken" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="customer_review" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="product_review" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(order, 'is_return')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <EditableField order={order} field="whatsapp_notification_failed_reason" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button onClick={() => window.open(`/orders/${order.id}`, '_blank')}>
                        View
                      </Button>
                      {hasChanges && (
                        <Button 
                          onClick={handleSaveChanges}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Save
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrdersTable; 