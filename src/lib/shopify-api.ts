import { Fulfillment } from "@/types/shopify";

// Shopify Admin API configuration and helper functions
export interface ShopifyCustomer {
  id: number;
  created_at: string;
  updated_at: string;
  orders_count: number;
  state: string;
  total_spent: string;
  last_order_id: number | null;
  note: string | null;
  verified_email: boolean;
  multipass_identifier: string | null;
  tax_exempt: boolean;
  tags: string;
  last_order_name: string | null;
  currency: string;
  addresses: Array<{
    id: number;
    customer_id: number;
    company: string | null;
    province: string | null;
    country: string;
    province_code: string | null;
    country_code: string;
    country_name: string;
    default: boolean;
  }>;
  tax_exemptions: Array<{
    name: string;
    value: string;
  }>;
  email_marketing_consent: {
    state: string;
    opt_in_level: string;
    consent_updated_at: string | null;
  };
  sms_marketing_consent: {
    state: string;
    opt_in_level: string;
    consent_updated_at: string | null;
    consent_collected_from?: string;
  } | null;
  admin_graphql_api_id: string;
  default_address?: {
    id: number;
    customer_id: number;
    company: string | null;
    province: string | null;
    country: string;
    province_code: string | null;
    country_code: string;
    country_name: string;
    default: boolean;
  };
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  email: string;
  phone: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    variant_title: string;
    sku: string;
    quantity: number;
    price: string;
    total_discount: string;
  }>;
  billing_address: {
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  fulfillments: Fulfillment[];
}

export interface ShopifyApiResponse<T> {
  customers?: T[];
  orders?: T[];
  data?: T[];
  pagination?: {
    next_page_info?: string;
    prev_page_info?: string;
  };
}

class ShopifyApiClient {
  private baseUrl: string;
  private accessToken: string;

  constructor() {
    this.baseUrl = process.env.SHOPIFY_SHOP_URL || "";
    this.accessToken = process.env.SHOPIFY_APP_ACCESS_TOKEN || "";

    if (!this.baseUrl || !this.accessToken) {
      throw new Error(
        "Missing Shopify configuration. Please check SHOPIFY_SHOP_URL and SHOPIFY_APP_ACCESS_TOKEN in .env.local"
      );
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(
      `https://${this.baseUrl}/admin/api/2025-07/${endpoint}`
    );

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    console.log(url.toString());

    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shopify API error response:`, errorText);
        throw new Error(
          `Shopify API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Request timeout - Shopify API took too long to respond"
        );
      }
      throw error;
    }
  }

  private async makeRequestWithHeaders<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<{ data: T; headers: Headers }> {
    const url = new URL(
      `https://${this.baseUrl}/admin/api/2025-07/${endpoint}`
    );

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    console.log(url.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Shopify API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const json = await response.json();
      return { data: json, headers: response.headers };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Request timeout - Shopify API took too long to respond"
        );
      }
      throw error;
    }
  }

  // Get customers with pagination
  async getCustomers(
    limit: number = 50,
    pageInfo?: string
  ): Promise<ShopifyApiResponse<ShopifyCustomer>> {
    // Shopify has a maximum limit of 250
    const maxLimit = Math.min(limit, 250);

    const params: Record<string, string> = {
      limit: maxLimit.toString(),
    };

    if (pageInfo) {
      params.page_info = pageInfo;
    }

    return this.makeRequest<ShopifyApiResponse<ShopifyCustomer>>(
      "customers.json",
      params
    );
  }

  // Get orders with pagination
  async getOrders(
    limit: number = 50,
    pageInfo?: string,
    status?: string,
    fetchAll: boolean = false
  ): Promise<
    ShopifyApiResponse<ShopifyOrder> & { totalCount: number; hasMore: boolean }
  > {
    // Shopify has a maximum limit of 250
    const maxLimit = Math.min(limit, 250);

    const params: Record<string, string> = {
      limit: maxLimit.toString(),
    };

    if (pageInfo) {
      params.page_info = pageInfo;
    }

    if (status) {
      params.status = status;
    }

    // If fetchAll is true, get all orders across all pages
    if (fetchAll) {
      return this.getAllOrders(status);
    }

    const response = await this.makeRequest<ShopifyApiResponse<ShopifyOrder>>(
      "orders.json",
      params
    );

    // Debug the response structure
    console.log("getOrders response structure:", {
      hasOrders: !!response.orders,
      ordersLength: response.orders?.length,
      hasPagination: !!response.pagination,
      paginationKeys: response.pagination
        ? Object.keys(response.pagination)
        : [],
      nextPageInfo: response.pagination?.next_page_info,
    });

    return {
      ...response,
      totalCount: response.orders?.length || 0,
      hasMore: !!response.pagination?.next_page_info,
    };
  }

  // Private method to fetch all orders across all pages
  private async getAllOrders(
    status?: string
  ): Promise<
    ShopifyApiResponse<ShopifyOrder> & { totalCount: number; hasMore: boolean }
  > {
    const allOrders: ShopifyOrder[] = [];
    let nextPageInfo: string | undefined = undefined;
    let hasMore = true;
    let pageCount = 0;

    console.log("Fetching all orders...");

    try {
      while (hasMore) {
        pageCount++;
        console.log(`Fetching page ${pageCount}...`);

        const params: Record<string, string> = { limit: "250" };
        if (status) params.status = status;
        if (nextPageInfo) params.page_info = nextPageInfo;

        const { data, headers } = await this.makeRequestWithHeaders<
          ShopifyApiResponse<ShopifyOrder>
        >("orders.json", params);

        if (data.orders) {
          allOrders.push(...data.orders);
        }

        const linkHeader = headers.get("link");
        if (linkHeader) {
          const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
          if (nextMatch) {
            const urlObj = new URL(nextMatch[1]);
            nextPageInfo = urlObj.searchParams.get("page_info") || undefined;
          } else {
            nextPageInfo = undefined; // No more pages
          }
        } else {
          nextPageInfo = undefined;
        }

        hasMore = !!nextPageInfo;

        console.log(
          `Page ${pageCount}: Got ${
            data.orders?.length || 0
          } orders. Total so far: ${allOrders.length}. Has more: ${hasMore}`
        );

        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // prevent rate limits
        }
      }
    } catch (error) {
      console.error(`Error in getAllOrders at page ${pageCount}:`, error);
      console.log(`Returning ${allOrders.length} orders fetched before error`);
    }

    console.log(`Finished fetching all orders. Total: ${allOrders.length}`);

    return {
      orders: allOrders,
      pagination: { next_page_info: undefined, prev_page_info: undefined },
      totalCount: allOrders.length,
      hasMore: false,
    };
  }

  // Get customer by ID
  async getCustomer(
    customerId: number
  ): Promise<{ customer: ShopifyCustomer }> {
    return this.makeRequest<{ customer: ShopifyCustomer }>(
      `customers/${customerId}.json`
    );
  }

  // Get order by ID
  async getOrder(orderId: number): Promise<{ order: ShopifyOrder }> {
    return this.makeRequest<{ order: ShopifyOrder }>(`orders/${orderId}.json`);
  }

  // Search customers
  async searchCustomers(
    query: string,
    limit: number = 50
  ): Promise<ShopifyApiResponse<ShopifyCustomer>> {
    // Shopify has a maximum limit of 250
    const maxLimit = Math.min(limit, 250);

    const params = {
      query,
      limit: maxLimit.toString(),
    };

    return this.makeRequest<ShopifyApiResponse<ShopifyCustomer>>(
      "customers/search.json",
      params
    );
  }

  // Get customer orders
  async getCustomerOrders(
    customerId: number,
    limit: number = 50
  ): Promise<ShopifyApiResponse<ShopifyOrder>> {
    // Shopify has a maximum limit of 250
    const maxLimit = Math.min(limit, 250);

    const params = {
      limit: maxLimit.toString(),
    };

    return this.makeRequest<ShopifyApiResponse<ShopifyOrder>>(
      `customers/${customerId}/orders.json`,
      params
    );
  }

  // Get total count of orders
  async getOrdersCount(status?: string): Promise<{ count: number }> {
    const params: Record<string, string> = {
      limit: "1", // We only need 1 to get the count
    };

    if (status) {
      params.status = status;
    }

    const response = await this.makeRequest<{ orders: ShopifyOrder[] }>(
      "orders.json",
      params
    );

    // Get the total count from response headers or calculate from data
    return { count: response.orders?.length || 0 };
  }

  // Get total count of customers
  async getCustomersCount(): Promise<{ count: number }> {
    const params: Record<string, string> = {
      limit: "1", // We only need 1 to get the count
    };

    const response = await this.makeRequest<{ customers: ShopifyCustomer[] }>(
      "customers.json",
      params
    );

    // Get the total count from response headers or calculate from data
    return { count: response.customers?.length || 0 };
  }
}

export const shopifyApi = new ShopifyApiClient();
