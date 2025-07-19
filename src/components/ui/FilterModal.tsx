'use client';

import React, { useState, useEffect } from 'react';
import Input from './Input';
import Button from './Button';

interface FilterField {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'email' | 'number';
  placeholder?: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, string>) => void;
  onClear: () => void;
  currentFilters: Record<string, string>;
  searchPlaceholder?: string;
  title?: string;
  filterFields?: FilterField[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onClear,
  currentFilters,
  searchPlaceholder = "Search...",
  title = "Filters",
  filterFields = []
}) => {
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(currentFilters);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleSearchChange = (value: string) => {
    setLocalFilters((prev: Record<string, string>) => ({ ...prev, search: value }));
  };

  const handleFieldChange = (key: string, value: string) => {
    setLocalFilters((prev: Record<string, string>) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {} as Record<string, string>);
    
    setLocalFilters(clearedFilters);
    onClear();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <Input
                placeholder={searchPlaceholder}
                value={localFilters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Search across all text fields
              </p>
            </div>

            {/* Dynamic filter fields */}
            {filterFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                </label>
                <Input
                  type={field.type || 'text'}
                  placeholder={field.placeholder || `Filter by ${field.label.toLowerCase()}`}
                  value={localFilters[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={handleClear}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Clear All
            </Button>
            <Button
              onClick={handleApply}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal; 