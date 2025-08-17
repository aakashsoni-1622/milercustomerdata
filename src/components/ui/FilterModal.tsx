"use client";

import { useState, useEffect } from "react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filterType: 'text' | 'select' | 'date' | 'checkbox';
  options?: string[];
  currentValue?: string | boolean;
  onApply: (value: string | boolean) => void;
  placeholder?: string;
}

export default function FilterModal({
  isOpen,
  onClose,
  title,
  filterType,
  options = [],
  currentValue = '',
  onApply,
  placeholder = "Enter value..."
}: FilterModalProps) {
  const [value, setValue] = useState<string | boolean>(currentValue);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  const handleApply = () => {
    onApply(value);
    onClose();
  };

  const handleClear = () => {
    setValue('');
    onApply('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
        </div>

        {filterType === 'text' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </label>
            <input
              type="text"
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {filterType === 'select' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Select Option
            </label>
            <select
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}

        {filterType === 'date' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {filterType === 'checkbox' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </label>
            <select
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            className="flex-1 px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
} 