# Comprehensive Budget Management System Design

## Overview

This document outlines the complete database design for a sophisticated wedding budget management system. The system provides advanced features for tracking expenses, managing vendor quotes, analyzing spending patterns, and optimizing budget allocation.

## Core Features

### 1. **Multi-Period Budget Management**
- Track budgets across different time periods
- Support budget revisions and historical tracking
- Active period management ensures only one active budget at a time

### 2. **Flexible Category System**
- System-defined categories with icons and colors for UI
- Category-based allocation with percentage or fixed amounts
- Priority levels and flexibility settings for smart reallocation

### 3. **Advanced Expense Tracking**
- Multiple amount types: estimated, contracted, and final
- Comprehensive status workflow: planned → committed → partial → paid
- Support for deposits, gratuities, and tax handling
- File attachments and tagging system

### 4. **Payment Management**
- Detailed transaction tracking with multiple payment methods
- Support for partial payments and refunds
- Payment reconciliation features
- Receipt management

### 5. **Vendor Integration**
- Vendor package management
- Quote tracking and comparison
- Payment schedule management
- Contract status tracking

### 6. **Smart Budget Features**
- Automated budget alerts and recommendations
- Spending pattern analysis
- Budget optimization suggestions
- Rule-based monitoring

## Database Schema

### Core Tables

#### `budget_periods`
Manages different budget versions over time.
- **Key Features**: One active period per couple, date ranges, currency support
- **Use Case**: Track initial budget vs. revised budgets

#### `budget_category_types`
Master list of expense categories.
- **Key Features**: System-defined categories, UI customization (icons/colors)
- **Default Categories**: Venue, Catering, Photography, Music, Flowers, etc.

#### `budget_allocations`
Links periods to categories with allocated amounts.
- **Key Features**: Amount or percentage allocation, priority levels, min/max constraints
- **Use Case**: Set how much to spend on each category

#### `budget_items`
Individual expense line items.
- **Key Features**: Multiple amount stages, comprehensive status tracking, vendor linkage
- **Statuses**: planned, committed, partial, paid, cancelled, refunded

#### `budget_transactions`
Payment records for budget items.
- **Key Features**: Supports payments, refunds, adjustments, multiple payment methods
- **Payment Methods**: Cash, Check, Credit Card, Bank Transfer, Digital wallets

### Analytics Tables

#### `budget_snapshots`
Historical budget state at specific points in time.
- **Key Features**: Complete budget state capture, health scoring
- **Use Case**: Track budget evolution over planning period

#### `budget_recommendations`
AI-generated suggestions for budget optimization.
- **Key Features**: Multiple recommendation types, severity levels, trackable actions
- **Types**: Overspend warnings, savings opportunities, reallocation suggestions

### Vendor Tables

#### `vendor_packages`
Standardized vendor offerings.
- **Key Features**: Package details, pricing, included items, constraints
- **Use Case**: Compare vendor offerings

#### `vendor_quotes`
Specific quotes for couples.
- **Key Features**: Complete pricing breakdown, payment schedules, document links
- **Use Case**: Track and compare vendor proposals

### Automation Tables

#### `budget_rules`
User-defined rules for budget monitoring.
- **Key Features**: Threshold alerts, action triggers, notification preferences
- **Use Case**: Get alerts when approaching budget limits

#### `budget_optimizations`
System-generated optimization opportunities.
- **Key Features**: Current vs. suggested scenarios, confidence scoring
- **Use Case**: Find ways to save money

## Key Functions

### `calculate_budget_item_total()`
Automatically updates budget item status based on payments.

### `update_allocation_spent()`
Maintains accurate spent amounts for each category.

### `generate_budget_recommendations()`
Analyzes spending patterns and generates recommendations.

## Views

### `budget_overview`
Provides high-level budget summary for each period.
- Total budget, allocated, spent, committed amounts
- Item counts by status

### `category_spending`
Detailed spending breakdown by category.
- Allocated vs. spent vs. remaining
- Item counts per category

## Security

All tables implement Row Level Security (RLS) ensuring couples can only access their own data. Budget category types are publicly readable but only system admins can modify them.

## Migration Strategy

The system includes migration logic to:
1. Create initial budget periods for existing couples
2. Map existing budget categories to the new category system
3. Preserve all existing budget data

## Usage Examples

### Creating a Budget
```sql
-- 1. Create a budget period
INSERT INTO budget_periods (couple_id, name, start_date, end_date, total_budget)
VALUES ([couple_id], 'Our Wedding Budget', '2024-01-01', '2024-12-31', 75000);

-- 2. Allocate amounts to categories
INSERT INTO budget_allocations (period_id, category_type_id, allocated_amount, allocated_percentage)
VALUES 
  ([period_id], [venue_category_id], 22500, 30),
  ([period_id], [catering_category_id], 18750, 25),
  ([period_id], [photo_category_id], 7500, 10);
```

### Tracking an Expense
```sql
-- 1. Create budget item
INSERT INTO budget_items (couple_id, period_id, category_type_id, name, estimated_amount, vendor_id)
VALUES ([couple_id], [period_id], [venue_category_id], 'Ceremony & Reception Venue', 20000, [vendor_id]);

-- 2. Record payment
INSERT INTO budget_transactions (couple_id, budget_item_id, amount, transaction_type, payment_method)
VALUES ([couple_id], [item_id], 5000, 'payment', 'credit_card');
```

### Getting Budget Status
```sql
-- Overall budget summary
SELECT * FROM budget_overview WHERE couple_id = [couple_id] AND is_active = true;

-- Category breakdown
SELECT * FROM category_spending WHERE couple_id = [couple_id];
```

## Best Practices

1. **Always use budget periods** - Don't modify historical data, create new periods
2. **Track all amounts** - Estimated, contracted, and final for accurate reporting
3. **Use transactions** - Don't update amounts directly, use transaction records
4. **Set up rules** - Automate monitoring with budget rules
5. **Review recommendations** - Check system suggestions regularly

## Future Enhancements

1. **Multi-currency support** - Handle destination weddings
2. **Vendor marketplace** - Connect with verified vendors
3. **Budget templates** - Start with proven budget distributions
4. **Mobile app integration** - Real-time expense tracking
5. **Financial integrations** - Connect with banks/credit cards