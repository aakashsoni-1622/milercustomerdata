# Miler Customer Data Management System

## Project Overview

A Next.js application for managing customer orders and customer data with PostgreSQL database, featuring comprehensive filtering, searching, and sorting capabilities.

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **API**: Next.js API Routes
- **Components**: Custom UI components

## Database Schema

### Tables Structure

#### `miler.customers`

```sql
CREATE TABLE miler.customers (
    id SERIAL PRIMARY KEY,
    customer_name TEXT,
    contact_no TEXT UNIQUE,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT
);
```

#### `miler.orders`

```sql
CREATE TABLE miler.orders (
    id SERIAL PRIMARY KEY,
    order_id TEXT UNIQUE,
    date DATE,
    state TEXT,
    item TEXT,
    color1 TEXT,
    color2 TEXT,
    color3 TEXT,
    size TEXT,
    qty INTEGER,
    amount REAL,
    payment_mode TEXT,
    payment_received BOOLEAN DEFAULT FALSE,
    order_confirmation TEXT,
    reason TEXT,
    process_order BOOLEAN DEFAULT FALSE,
    order_packed BOOLEAN DEFAULT FALSE,
    order_cancelled BOOLEAN DEFAULT FALSE,
    delivered BOOLEAN DEFAULT FALSE,
    is_rto BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    rto_reason TEXT,
    review_taken TEXT,
    customer_review TEXT,
    product_review TEXT,
    is_return BOOLEAN DEFAULT FALSE,
    whatsapp_notification_failed_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INTEGER REFERENCES miler.customers(id)
);
```

## Frontend Routes

### Pages

#### 1. `/` - Home Page

- **File**: `src/app/page.tsx`
- **Description**: Landing page of the application

#### 2. `/orders` - Orders Management

- **File**: `src/app/orders/page.tsx`
- **Description**: Complete orders management interface
- **Features**:
  - Display all orders with customer details
  - Advanced filtering and search
  - Sorting by any column
  - Pagination
  - Boolean fields as checkboxes
  - Responsive design

#### 3. `/orders/[id]` - Order Details

- **File**: `src/app/orders/[id]/page.tsx`
- **Description**: Individual order details page
- **Features**: Detailed view of specific order

#### 4. `/customers` - Customers Management

- **File**: `src/app/customers/page.tsx`
- **Description**: Complete customers management interface
- **Features**:
  - Display all customers with order statistics
  - Advanced filtering and search
  - Sorting by any column
  - Pagination
  - Order count and total amount per customer

#### 5. `/customers/[id]` - Customer Details

- **File**: `src/app/customers/[id]/page.tsx`
- **Description**: Individual customer details page
- **Features**: Detailed view of specific customer and their orders

## API Routes

### Orders API

#### 1. `GET /api/orders` - Get All Orders

- **File**: `src/app/api/orders/route.ts`
- **Description**: Fetch all orders from database
- **Response**: Array of all orders
- **Query Parameters**: None

#### 2. `GET /api/orders/list` - Get Orders with Filters

- **File**: `src/app/api/orders/list/route.ts`
- **Description**: Fetch orders with advanced filtering, search, and pagination
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `search` (string): Global search across order_id, item, customer_name, contact_no
  - `sortBy` (string): Column to sort by (default: created_at)
  - `sortOrder` (string): ASC or DESC (default: DESC)
  - `customerName` (string): Filter by customer name
  - `orderDate` (string): Filter by order date (YYYY-MM-DD)
  - `orderStatus` (string): Filter by payment mode
  - `orderTotal` (number): Filter by exact amount
  - `state` (string): Filter by state
  - `paymentMode` (string): Filter by payment mode
- **Response**:
  ```json
  {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
  ```

#### 3. `POST /api/orders` - Create Order

- **File**: `src/app/api/orders/route.ts`
- **Description**: Create a new order (placeholder)
- **Request Body**: Order data
- **Response**: Created order

#### 4. `POST /api/orders/bulk-insert` - Bulk Insert Orders

- **File**: `src/app/api/orders/bulk-insert/route.ts`
- **Description**: Bulk insert multiple orders with error handling
- **Request Body**: Array of order objects
- **Features**:
  - Creates customers if they don't exist
  - Creates orders if they don't exist
  - Updates existing orders
  - Returns success and error arrays
  - No transaction (individual error handling)
- **Response**:
  ```json
  {
    "results": [...], // Successfully processed orders
    "errors": [
      {
        "customer_name": "John Doe",
        "contact_no": "1234567890",
        "order_id": "ORD123",
        "reason": "Error message"
      }
    ]
  }
  ```

#### 5. `POST /api/orders/update` - Update Order

- **File**: `src/app/api/orders/update/route.ts`
- **Description**: Update existing order or create new one
- **Request Body**: Order data with customer information
- **Features**:
  - Creates customer if doesn't exist
  - Creates order if doesn't exist
  - Updates existing order
- **Response**: Updated/created order

### Customers API

#### 1. `GET /api/customers` - Get All Customers

- **File**: `src/app/api/customers/route.ts`
- **Description**: Fetch all customers from database
- **Response**: Array of all customers
- **Query Parameters**: None

#### 2. `GET /api/customers/list` - Get Customers with Filters

- **File**: `src/app/api/customers/list/route.ts`
- **Description**: Fetch customers with advanced filtering, search, and pagination
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `search` (string): Global search across customer_name, contact_no, email
  - `sortBy` (string): Column to sort by (default: id)
  - `sortOrder` (string): ASC or DESC (default: DESC)
  - `customerName` (string): Filter by customer name
  - `city` (string): Filter by city
  - `country` (string): Filter by country
- **Response**:
  ```json
  {
    "customers": [
      {
        "id": 1,
        "customer_name": "John Doe",
        "contact_no": "1234567890",
        "email": "john@example.com",
        "address": "123 Main St",
        "city": "New York",
        "country": "USA",
        "total_orders": 5,
        "total_amount": 1500.0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
  ```

#### 3. `POST /api/customers` - Create Customer

- **File**: `src/app/api/customers/route.ts`
- **Description**: Create a new customer
- **Request Body**:
  ```json
  {
    "customer_name": "John Doe",
    "contact_no": "1234567890",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA"
  }
  ```
- **Response**: Created customer object

## Components

### UI Components

#### 1. `Button` - `src/components/ui/Button.tsx`

- **Props**: `children`, `onClick`, `className`, `type`, `disabled`
- **Features**: Customizable button with hover effects and disabled state

#### 2. `Card` - `src/components/ui/Card.tsx`

- **Props**: `children`, `className`
- **Features**: Container component with shadow and rounded corners

#### 3. `Input` - `src/components/ui/Input.tsx`

- **Props**: `type`, `placeholder`, `value`, `onChange`, `className`
- **Features**: Custom input field with focus states

### Table Components

#### 1. `OrdersTable` - `src/components/OrdersTable.tsx`

- **Features**:
  - Complete orders display with all fields
  - Boolean fields as checkboxes
  - Advanced filtering and search
  - Debounced search (500ms)
  - Sortable columns
  - Pagination
  - Responsive design

#### 2. `CustomersTable` - `src/components/CustomersTable.tsx`

- **Features**:
  - Complete customers display with order statistics
  - Advanced filtering and search
  - Debounced search (500ms)
  - Sortable columns
  - Pagination
  - Responsive design

## Database Connection

### Configuration

- **File**: `src/lib/db.ts`
- **Environment Variable**: `DATABASE_URL`
- **Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

### Example .env.local

```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/milercustomerdata
```

## SQL Optimizations

### 1. Indexes for Performance

```sql
-- Orders table indexes
CREATE INDEX idx_orders_order_id ON miler.orders(order_id);
CREATE INDEX idx_orders_date ON miler.orders(date);
CREATE INDEX idx_orders_customer_id ON miler.orders(customer_id);
CREATE INDEX idx_orders_payment_mode ON miler.orders(payment_mode);
CREATE INDEX idx_orders_state ON miler.orders(state);

-- Customers table indexes
CREATE INDEX idx_customers_contact_no ON miler.customers(contact_no);
CREATE INDEX idx_customers_customer_name ON miler.customers(customer_name);
CREATE INDEX idx_customers_city ON miler.customers(city);
CREATE INDEX idx_customers_country ON miler.customers(country);
```

### 2. Query Optimizations

#### Pros:

- **Composite Indexes**: Better performance for multi-column filters
- **Partial Indexes**: Reduced index size for filtered queries
- **Covering Indexes**: Avoid table lookups for common queries

#### Cons:

- **Index Maintenance**: Slower INSERT/UPDATE operations
- **Storage Overhead**: Additional disk space required
- **Complexity**: More complex query planning

### 3. Pagination Optimization

- **LIMIT/OFFSET**: Standard pagination approach
- **Keyset Pagination**: Better for large datasets (future enhancement)
- **Cursor-based**: More efficient than offset-based pagination

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE milercustomerdata;"

# Run schema
psql -U postgres -d milercustomerdata -f sql/schema.sql
```

### 3. Environment Configuration

Create `.env.local` file with database credentials:

```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/milercustomerdata
```

### 4. Start Development Server

```bash
npm run dev
```

## Performance Considerations

### For 1 Million Orders:

1. **Database Indexes**: Essential for query performance
2. **Pagination**: Limit results to prevent memory issues
3. **Debounced Search**: Reduce API calls during typing
4. **Lazy Loading**: Consider implementing for large datasets
5. **Caching**: Redis for frequently accessed data
6. **Connection Pooling**: Optimize database connections

## Future Enhancements

1. **Real-time Updates**: WebSocket integration
2. **Export Functionality**: CSV/Excel export
3. **Bulk Operations**: Mass update/delete
4. **Advanced Analytics**: Dashboard with charts
5. **User Authentication**: Role-based access control
6. **API Rate Limiting**: Prevent abuse
7. **Audit Logging**: Track data changes
8. **Mobile App**: React Native companion app
