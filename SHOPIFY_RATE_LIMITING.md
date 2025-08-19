# Shopify Rate Limiting Solution

## Overview

This solution addresses the Shopify API rate limiting issue that was causing "Exceeded 2 calls per second" errors during order synchronization.

## Problem

The original `syncOrders` function was making rapid API calls to Shopify without any rate limiting, which violated Shopify's strict limit of 2 calls per second per API client.

## Solution

### 1. Advanced Rate Limiter Class

A `ShopifyRateLimiter` class has been implemented that:

- Queues API calls and processes them sequentially
- Ensures a minimum interval between API calls (configurable)
- Provides monitoring and status information
- Handles multiple concurrent requests safely

### 2. Enhanced Sync Functions

#### `syncOrders()`

- Original function with built-in rate limiting
- Processes customers one by one with proper delays
- Includes progress tracking and error handling

#### `syncOrdersInBatches(batchSize)`

- New batch processing function for large datasets
- Processes customers in configurable batches
- Adds extra delays between batches for safety
- Recommended for production use with large customer bases

### 3. Improved Error Handling

- Automatic retry logic for 429 (rate limit) errors
- Graceful error handling that continues processing
- Detailed logging and progress tracking
- Configurable retry delays and limits

## Usage

### Basic Sync (Rate Limited)

```typescript
import { syncOrders } from "@/lib/order-utils";

const result = await syncOrders();
console.log(result);
```

### Batch Sync (Recommended for Production)

```typescript
import { syncOrdersInBatches } from "@/lib/order-utils";

// Process 10 customers at a time
const result = await syncOrdersInBatches(10);
console.log(result);
```

### Check Rate Limiter Status

```typescript
import { getRateLimiterStatus } from "@/lib/order-utils";

const status = getRateLimiterStatus();
console.log("Queue length:", status.queueLength);
console.log("Processing:", status.processing);
```

## API Endpoints

### POST /api/orders/sync

Regular sync with rate limiting.

**Query Parameters:**

- `batch=true` - Use batch processing
- `batchSize=10` - Set batch size (default: 10)

**Examples:**

```bash
# Regular sync
POST /api/orders/sync

# Batch sync with custom batch size
POST /api/orders/sync?batch=true&batchSize=5
```

### GET /api/orders/sync

Get current rate limiter status.

## Configuration

The rate limiter is configured with conservative settings by default:

```typescript
const shopifyRateLimiter = new ShopifyRateLimiter(
  1.5, // calls per second (safe margin below Shopify's 2/s limit)
  3, // max retries
  5000 // retry delay in ms
);
```

## Monitoring

The system provides comprehensive logging:

- Progress indicators with percentages
- Rate limiting delays and waits
- Error counts and success rates
- Processing time estimates
- Batch completion status

## Testing

A test script is included to verify rate limiting functionality:

```bash
node test-rate-limit.js
```

This script simulates multiple API calls and verifies that the rate limiting is working correctly.

## Best Practices

1. **Use batch processing** for large customer bases (>50 customers)
2. **Monitor logs** for rate limiting messages
3. **Set appropriate batch sizes** based on your Shopify plan limits
4. **Check rate limiter status** before starting large sync operations
5. **Handle errors gracefully** - the system continues processing even if individual customers fail

## Performance

- **Regular sync**: ~1.5 API calls per second
- **Batch sync**: ~1.5 API calls per second with additional batch delays
- **Expected sync time**: Varies based on customer count and order volume

## Troubleshooting

### Still getting rate limit errors?

1. Check if multiple sync processes are running simultaneously
2. Verify the rate limiter status endpoint
3. Consider reducing batch size or increasing delays
4. Check Shopify app usage in your admin panel

### Sync taking too long?

1. The rate limiting is necessary to avoid Shopify API bans
2. Consider running sync during off-peak hours
3. Monitor progress logs to estimate completion time
4. Use batch processing for better progress tracking

## Future Improvements

- Configurable rate limits per environment
- Dynamic rate limiting based on Shopify response headers
- Resume capability for interrupted syncs
- Webhook-based incremental sync
- Real-time progress updates via WebSocket
