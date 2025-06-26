import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 bg-white rounded shadow ${className}`}>
      {children}
    </div>
  );
};

export default Card; 