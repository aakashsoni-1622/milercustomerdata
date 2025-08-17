export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  default_address?: {
    province: string;
  };
}

export interface LineItem {
  sku?: string;
  variant_title: string;
  price: string;
}

export interface Fulfillment {
  id: number;
  admin_graphql_api_id: string;
  created_at: string;
  location_id: number;
  name: string;
  order_id: number;
  origin_address: object;
  receipt: object;
  service: string;
  shipment_status: string;
  status: string;
  tracking_company: string;
  tracking_number: string;
  tracking_numbers: string[];
  tracking_url: string;
  tracking_urls: string[];
  updated_at: string;
}

export interface ShopifyOrder {
  customer: ShopifyCustomer;
  line_items: LineItem[];
  order_number: number;
  phone?: string;
  billing_address?: {
    phone?: string;
  };
  created_at?: string;
  total_price: number;
  payment_gateway_names: string[];
  note?: string;
  fulfillment_status?: string;
  fulfillments?: Fulfillment[];
}

export interface SimpleOrderItem {
  productId: number;
  selectedColors: string[];
  selectedSizes: string[];
  quantity: number;
  unitPrice: number;
}
