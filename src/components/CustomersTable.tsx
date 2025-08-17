'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import FilterModal from './ui/FilterModal';

interface Customer {
  id: number;
  customer_name: string;
  contact_no: string;
  email: string;
  address: string;
  city: string;
  country: string;
  total_orders: number;
  total_amount: number;
  is_active: boolean;
  is_premium: boolean;
  email_verified: boolean;
  phone_verified: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const CustomersTable: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    customerName: '',
    city: '',
    country: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [modifiedCustomers, setModifiedCustomers] = useState<Record<number, Partial<Customer>>>({});
  const [hasChanges, setHasChanges] = useState(false);

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

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: debouncedFilters.search,
        sortBy,
        sortOrder,
        customerName: debouncedFilters.customerName,
        city: debouncedFilters.city,
        country: debouncedFilters.country
      });

      const response = await fetch(`/api/customers/list?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setCustomers(data.customers);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch customers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, debouncedFilters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = (newFilters: Record<string, string>) => {
    setFilters({
      search: newFilters.search || '',
      customerName: newFilters.customerName || '',
      city: newFilters.city || '',
      country: newFilters.country || ''
    });
  };



  const handleCheckboxChange = (customerId: number, field: keyof Customer, value: boolean) => {
    setModifiedCustomers(prev => {
      const updated = {
        ...prev,
        [customerId]: {
          ...prev[customerId],
          [field]: value
        }
      };
      
      // Check if there are any changes
      const hasAnyChanges = Object.keys(updated).length > 0;
      setHasChanges(hasAnyChanges);
      
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      // Update each modified customer
      for (const [customerId, changes] of Object.entries(modifiedCustomers)) {
        const response = await fetch(`/api/customers/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: parseInt(customerId),
            ...changes
          }),
        });

        if (!response.ok) {
          console.error(`Failed to update customer ${customerId}`);
        }
      }

      // Clear modifications and refresh data
      setModifiedCustomers({});
      setHasChanges(false);
      fetchCustomers();
      
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const formatBoolean = (customer: Customer, field: keyof Customer) => {
    const isModified = modifiedCustomers[customer.id]?.[field] !== undefined;
    const currentValue = isModified 
      ? modifiedCustomers[customer.id]![field] as boolean 
      : customer[field] as boolean;

    return (
      <input
        type="checkbox"
        checked={currentValue}
        onChange={(e) => handleCheckboxChange(customer.id, field, e.target.checked)}
        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
          isModified ? 'ring-2 ring-yellow-400' : ''
        }`}
      />
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button onClick={() => setIsFilterModalOpen(true)}>
            Open Filters
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search customers..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="max-w-md"
          />
          {(filters.customerName || filters.city || filters.country) && (
            <span className="text-sm text-gray-500">
              Additional filters applied
            </span>
          )}
        </div>
      </Card>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Customer Filters"
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
                You have unsaved changes. Click Save to update the records.
              </span>
              <Button 
                onClick={handleSaveChanges}
                className="bg-green-500 hover:bg-green-600"
              >
                Save All Changes
              </Button>
            </div>
          </div>
        )}
        
        {/* Table with horizontal scroll */}
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <div className="min-w-[1200px]"> {/* Set minimum width to accommodate all columns */}
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>
                  ID {sortBy === 'id' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customer_name')}>
                  Name {sortBy === 'customer_name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('city')}>
                  City {sortBy === 'city' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('country')}>
                  Country {sortBy === 'country' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_orders')}>
                  Orders {sortBy === 'total_orders' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_amount')}>
                  Total Amount {sortBy === 'total_amount' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Verified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Verified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.contact_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {customer.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {customer.total_orders || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{customer.total_amount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(customer, 'is_active')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(customer, 'is_premium')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(customer, 'email_verified')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBoolean(customer, 'phone_verified')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button onClick={() => window.open(`/customers/${customer.id}`, '_blank')}>
                        View Orders
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

export default CustomersTable; 