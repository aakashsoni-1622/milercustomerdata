interface MoneySet {
  shop_money: {
    amount: string;
    currency_code: string;
  };
  presentment_money: {
    amount: string;
    currency_code: string;
  };
}

interface TaxLine {
  price: string;
  rate: number;
  title: string;
  price_set: MoneySet;
  channel_liable: boolean;
}

interface NoteAttribute {
  name: string;
  value: string;
}

interface Address {
  first_name: string;
  address1: string;
  phone: string;
  city: string;
  zip: string;
  province: string;
  country: string;
  last_name: string;
  address2: string | null;
  company: string | null;
  latitude: number;
  longitude: number;
  name: string;
  country_code: string;
  province_code: string;
}

interface CustomerAddress extends Address {
  id: number;
  customer_id: number;
  default: boolean;
  country_name: string;
}

interface Customer {
  id: number;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  state: string;
  note: string | null;
  verified_email: boolean;
  multipass_identifier: string | null;
  tax_exempt: boolean;
  email: string;
  phone: string | null;
  currency: string;
  tax_exemptions: string[];
  admin_graphql_api_id: string;
  default_address: CustomerAddress;
}

interface Fulfillment {
  id: number;
  admin_graphql_api_id: string;
  created_at: string;
  location_id: number;
  name: string;
  order_id: number;
  origin_address: Record<string, unknown>;
  receipt: Record<string, unknown>;
  service: string;
  shipment_status: string;
  status: string;
  tracking_company: string;
  tracking_number: string;
  tracking_numbers: string[];
  tracking_url: string;
  tracking_urls: string[];
  updated_at: string;
  line_items: LineItem[];
}

export interface LineItem {
  id: number;
  admin_graphql_api_id: string;
  attributed_staffs: [];
  current_quantity: number;
  fulfillable_quantity: number;
  fulfillment_service: string;
  fulfillment_status: string;
  gift_card: boolean;
  grams: number;
  name: string;
  price: string;
  price_set: MoneySet;
  product_exists: boolean;
  product_id: number;
  properties: [];
  quantity: number;
  requires_shipping: boolean;
  sales_line_item_group_id: string | null;
  sku: string;
  taxable: boolean;
  title: string;
  total_discount: string;
  total_discount_set: MoneySet;
  variant_id: number;
  variant_inventory_management: string;
  variant_title: string;
  vendor: string;
  tax_lines: TaxLine[];
  duties: [];
  discount_allocations: [];
}

interface ShippingLine {
  id: number;
  carrier_identifier: string | null;
  code: string;
  current_discounted_price_set: MoneySet;
  discounted_price: string;
  discounted_price_set: MoneySet;
  is_removed: boolean;
  phone: string | null;
  price: string;
  price_set: MoneySet;
  requested_fulfillment_service_id: number | null;
  source: string | null;
  title: string;
  tax_lines: TaxLine[];
  discount_allocations: [];
}

export interface ShopifyOrder {
  id: number;
  admin_graphql_api_id: string;
  app_id: number | null;
  browser_ip: string | null;
  buyer_accepts_marketing: boolean;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cart_token: string | null;
  checkout_id: number | null;
  checkout_token: string | null;
  client_details: unknown;
  closed_at: string | null;
  confirmation_number: string;
  confirmed: boolean;
  contact_email: string;
  created_at: string;
  currency: string;
  current_shipping_price_set: MoneySet;
  current_subtotal_price: string;
  current_subtotal_price_set: MoneySet;
  current_total_additional_fees_set: unknown;
  current_total_discounts: string;
  current_total_discounts_set: MoneySet;
  current_total_duties_set: unknown;
  current_total_price: string;
  current_total_price_set: MoneySet;
  current_total_tax: string;
  current_total_tax_set: MoneySet;
  customer_locale: string | null;
  device_id: string | null;
  discount_codes: [];
  duties_included: boolean;
  email: string;
  estimated_taxes: boolean;
  financial_status: string;
  fulfillment_status: string;
  landing_site: string | null;
  landing_site_ref: string | null;
  location_id: number | null;
  merchant_business_entity_id: string;
  merchant_of_record_app_id: number | null;
  name: string;
  note: string | null;
  note_attributes: NoteAttribute[];
  number: number;
  order_number: number;
  order_status_url: string;
  original_total_additional_fees_set: unknown;
  original_total_duties_set: unknown;
  payment_gateway_names: string[];
  phone: string;
  po_number: string | null;
  presentment_currency: string;
  processed_at: string;
  reference: string | null;
  referring_site: string | null;
  source_identifier: string | null;
  source_name: string;
  source_url: string | null;
  subtotal_price: string;
  subtotal_price_set: MoneySet;
  tags: string;
  tax_exempt: boolean;
  tax_lines: TaxLine[];
  taxes_included: boolean;
  test: boolean;
  token: string;
  total_cash_rounding_payment_adjustment_set: MoneySet;
  total_cash_rounding_refund_adjustment_set: MoneySet;
  total_discounts: string;
  total_discounts_set: MoneySet;
  total_line_items_price: string;
  total_line_items_price_set: MoneySet;
  total_outstanding: string;
  total_price: string;
  total_price_set: MoneySet;
  total_shipping_price_set: MoneySet;
  total_tax: string;
  total_tax_set: MoneySet;
  total_tip_received: string;
  total_weight: number;
  updated_at: string;
  user_id: number | null;
  billing_address: Address;
  shipping_address: Address;
  customer: Customer;
  discount_applications: [];
  fulfillments: Fulfillment[];
  line_items: LineItem[];
  shipping_lines: ShippingLine[];
  refunds: [];
  returns: [];
}
