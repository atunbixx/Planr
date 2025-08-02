# Wedding Planner Budget API Documentation

This document provides comprehensive documentation for all budget-related API endpoints in the Wedding Planner application.

## Base URL
All endpoints are prefixed with `/api/budget`

## Authentication
All endpoints require authentication via Supabase session cookies. Requests without valid authentication will receive a 401 Unauthorized response.

## Endpoints Overview

### Budget Management
- **GET /api/budget** - Get budget overview
- **Budget Periods** - Manage budget time periods
- **Budget Categories** - Manage expense categories
- **Budget Items** - Manage individual expenses
- **Budget Transactions** - Record payments
- **Budget Analytics** - Get insights and analysis
- **Budget Recommendations** - Get AI-powered suggestions
- **Budget Export** - Export budget data
- **Budget Templates** - Use pre-built budget templates

---

## 1. Budget Overview

### GET /api/budget
Get a high-level overview of the couple's budget.

**Response:**
```json
{
  "couple_id": "uuid",
  "total_budget": 50000,
  "total_allocated": 50000,
  "total_spent": 25000,
  "total_remaining": 25000,
  "categories": [
    {
      "id": "uuid",
      "name": "Venue",
      "allocated_amount": 15000,
      "spent_amount": 10000,
      "remaining_amount": 5000,
      "percentage_used": 66.67,
      "expense_count": 3,
      "color": "#FF6B6B",
      "icon": "building",
      "priority": "high"
    }
  ]
}
```

---

## 2. Budget Periods

### GET /api/budget/periods
List all budget periods for the couple.

**Response:**
```json
{
  "periods": [
    {
      "id": "uuid",
      "couple_id": "uuid",
      "name": "Wedding Budget",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-12-31T00:00:00Z",
      "total_budget": 50000,
      "currency": "USD",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/budget/periods
Create a new budget period.

**Request Body:**
```json
{
  "couple_id": "uuid",
  "name": "Wedding Budget 2024",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T00:00:00Z",
  "total_budget": 50000,
  "currency": "USD",
  "notes": "Initial budget planning"
}
```

### GET /api/budget/periods/[id]
Get a specific budget period.

### PUT /api/budget/periods/[id]
Update a budget period.

### DELETE /api/budget/periods/[id]
Delete a budget period.

---

## 3. Budget Categories

### GET /api/budget/categories
List all budget categories with spending information.

**Query Parameters:**
- None

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Venue",
      "allocated_amount": 15000,
      "spent_amount": 10000,
      "remaining_amount": 5000,
      "percentage_used": 66.67,
      "expense_count": 3,
      "color": "#FF6B6B",
      "icon": "building",
      "priority": "high",
      "budget_expenses": []
    }
  ]
}
```

### POST /api/budget/categories
Create a new budget category.

**Request Body:**
```json
{
  "couple_id": "uuid",
  "name": "Photography",
  "allocated_amount": 5000,
  "percentage_of_total": 10,
  "color": "#4ECDC4",
  "icon": "camera",
  "priority": "high"
}
```

### GET /api/budget/categories/[id]
Get a specific category with all expenses.

### PUT /api/budget/categories/[id]
Update a budget category.

### DELETE /api/budget/categories/[id]
Delete a budget category (only if no expenses exist).

---

## 4. Budget Items (Expenses)

### GET /api/budget/items
List all budget items/expenses.

**Query Parameters:**
- `category_id` - Filter by category
- `vendor_id` - Filter by vendor
- `status` - Filter by payment status
- `sort_by` - Sort field (default: due_date)
- `sort_order` - Sort order (asc/desc)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "description": "Venue rental",
      "amount": 10000,
      "due_date": "2024-06-01T00:00:00Z",
      "payment_status": "pending",
      "budget_categories": {
        "id": "uuid",
        "name": "Venue",
        "color": "#FF6B6B",
        "icon": "building"
      },
      "couple_vendors": {
        "id": "uuid",
        "business_name": "Grand Hotel"
      }
    }
  ]
}
```

### POST /api/budget/items
Create a new expense item.

**Request Body:**
```json
{
  "couple_id": "uuid",
  "category_id": "uuid",
  "vendor_id": "uuid",
  "description": "Venue rental fee",
  "amount": 10000,
  "due_date": "2024-06-01T00:00:00Z",
  "expense_type": "vendor",
  "payment_status": "pending",
  "notes": "50% deposit required"
}
```

### GET /api/budget/items/[id]
Get a specific expense item.

### PUT /api/budget/items/[id]
Update an expense item.

### DELETE /api/budget/items/[id]
Delete an expense item.

---

## 5. Budget Transactions

### GET /api/budget/transactions
List all payment transactions.

**Query Parameters:**
- `expense_id` - Filter by expense
- `start_date` - Filter by start date
- `end_date` - Filter by end date

**Response:**
```json
{
  "transactions": [
    {
      "id": "transaction-uuid",
      "expense_id": "uuid",
      "amount": 5000,
      "payment_method": "credit_card",
      "payment_date": "2024-03-15T00:00:00Z",
      "receipt_url": "https://...",
      "description": "Venue deposit",
      "category": {},
      "vendor": {},
      "created_at": "2024-03-15T00:00:00Z"
    }
  ]
}
```

### POST /api/budget/transactions
Record a payment for an expense.

**Request Body:**
```json
{
  "couple_id": "uuid",
  "budget_item_id": "uuid",
  "amount": 5000,
  "payment_method": "credit_card",
  "payment_date": "2024-03-15T00:00:00Z",
  "card_last_four": "1234",
  "paid_by": "John Doe",
  "receipt_url": "https://...",
  "notes": "Venue deposit payment"
}
```

---

## 6. Budget Analytics

### GET /api/budget/analytics
Get comprehensive budget analytics and insights.

**Response:**
```json
{
  "overview": {
    "total_budget": 50000,
    "total_spent": 25000,
    "total_committed": 40000,
    "total_remaining": 10000,
    "budget_utilization": 80,
    "spent_percentage": 50,
    "health_status": "good",
    "days_until_wedding": 180,
    "average_expense": 2500
  },
  "categories": [
    {
      "category_id": "uuid",
      "category_name": "Venue",
      "allocated_amount": 15000,
      "spent_amount": 10000,
      "committed_amount": 12000,
      "remaining_amount": 3000,
      "percentage_allocated": 30,
      "percentage_spent": 66.67
    }
  ],
  "monthly_spending": [
    {
      "month": "2024-03",
      "amount": 5000,
      "display": "Mar 2024"
    }
  ],
  "top_vendors": [
    {
      "vendor_id": "uuid",
      "vendor_name": "Grand Hotel",
      "category": "venue",
      "total_amount": 12000,
      "paid_amount": 10000,
      "expense_count": 2
    }
  ],
  "upcoming_payments": [],
  "payment_timeline": [],
  "insights": [
    {
      "type": "warning",
      "title": "High Budget Utilization",
      "message": "You've committed 80% of your budget..."
    }
  ]
}
```

---

## 7. Budget Recommendations

### GET /api/budget/recommendations
Get AI-powered budget recommendations.

**Response:**
```json
{
  "recommendations": [
    {
      "id": "overspend-uuid",
      "couple_id": "uuid",
      "category_type_id": "uuid",
      "recommendation_type": "overspend_warning",
      "severity": "warning",
      "title": "Venue is over budget",
      "description": "You've committed $12,000 but only allocated $10,000",
      "suggested_action": "Consider reallocating funds...",
      "potential_savings": 2000,
      "is_dismissed": false,
      "created_at": "2024-03-15T00:00:00Z"
    }
  ]
}
```

### POST /api/budget/recommendations/[id]/dismiss
Dismiss a specific recommendation.

---

## 8. Budget Export

### GET /api/budget/export
Export budget data in various formats.

**Query Parameters:**
- `format` - Export format (json/csv/pdf)

**Response for JSON:**
```json
{
  "export_date": "2024-03-15T00:00:00Z",
  "couple": {},
  "budget_summary": {},
  "categories": []
}
```

**Response for CSV:**
Returns a CSV file download with budget data.

**Response for PDF:**
Returns structured data for PDF generation on the frontend.

---

## 9. Budget Templates

### GET /api/budget/templates
Get available budget templates.

**Query Parameters:**
- `budget_min` - Minimum budget filter
- `budget_max` - Maximum budget filter
- `guest_count` - Approximate guest count

**Response:**
```json
{
  "templates": [
    {
      "id": "intimate-garden",
      "name": "Intimate Garden Wedding",
      "description": "Perfect for small gatherings of 50 guests or less",
      "total_budget": 25000,
      "guest_count": 50,
      "categories": [
        {
          "name": "Venue",
          "percentage": 20,
          "amount": 5000,
          "priority": "high"
        }
      ]
    }
  ]
}
```

### POST /api/budget/templates/apply
Apply a budget template to create categories.

**Request Body:**
```json
{
  "template_id": "intimate-garden",
  "couple_id": "uuid",
  "adjustments": {
    "total_budget": 30000
  }
}
```

**Response:**
```json
{
  "success": true,
  "template_applied": "Intimate Garden Wedding",
  "total_budget": 30000,
  "categories_created": 7,
  "categories": []
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not authorized)
- `404` - Resource not found
- `400` - Bad request (invalid input)
- `500` - Internal server error

---

## Payment Methods

Supported payment methods:
- `cash`
- `check`
- `credit_card`
- `debit_card`
- `bank_transfer`
- `paypal`
- `venmo`
- `zelle`
- `gift`
- `other`

## Payment Statuses

- `pending` - Payment not yet made
- `partial` - Partially paid
- `paid` - Fully paid
- `cancelled` - Expense cancelled
- `refunded` - Payment refunded

## Recommendation Types

- `overspend_warning` - Category over budget
- `savings_opportunity` - Underutilized category
- `reallocation` - Budget rebalancing suggestion
- `vendor_alternative` - Alternative vendor suggestion
- `timing_adjustment` - Seasonal pricing advice
- `package_downgrade` - Cost reduction option