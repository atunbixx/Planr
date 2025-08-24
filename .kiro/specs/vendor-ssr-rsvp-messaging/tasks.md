# Implementation Plan

- [x] 1. Database Schema Extensions and Migrations
  - Create Prisma migration for new RSVP and messaging tables
  - Add slug field to existing vendors table with unique constraint
  - Create indexes for performance optimization
  - Write migration rollback plan and test with seed data
  - _Requirements: 1.1, 2.1, 3.1, 5.1_

- [x] 2. RSVP Repository Layer Implementation
  - Create RSVPRepository class extending BaseRepository
  - Implement createOrUpdate method with upsert logic for idempotency
  - Implement getStats method with groupBy aggregation
  - Create InviteRepository for token validation
  - Write unit tests for repository methods with test database
  - _Requirements: 2.2, 2.3, 2.4, 5.1, 8.1_

- [x] 3. Credit Management Repository
  - Create CreditRepository class extending BaseRepository
  - Implement atomic decrementAtomic method using updateMany with conditions
  - Implement getBalance and addCredits methods
  - Write unit tests for concurrent credit operations
  - Test race condition scenarios with multiple simultaneous decrements
  - _Requirements: 3.3, 3.4, 3.6, 5.1, 8.4_

- [x] 4. RSVP Service Layer Implementation
  - Create RSVPService class following existing service patterns
  - Implement submitRSVP method with invite validation and idempotency
  - Implement getStats method for attendance counters
  - Add Zod validation schemas for RSVP data
  - Write unit tests for service logic with mocked repositories
  - _Requirements: 2.1, 2.2, 2.5, 5.2, 8.2_

- [x] 5. Messaging System Core Implementation
  - Create MessagingService class with provider abstraction
  - Implement pricebook.json configuration and PricebookService
  - Create base MessageAdapter interface for providers
  - Implement atomic credit deduction with rollback on failure
  - Write unit tests for cost calculation and credit management
  - _Requirements: 3.1, 3.2, 3.3, 5.2, 8.2_

- [x] 6. Messaging Provider Adapters
  - Create ResendAdapter for email messaging
  - Create TwilioAdapter for SMS messaging
  - Create stub adapters for SES and WhatsApp
  - Implement adapter selection logic in MessagingService
  - Write unit tests for each adapter with mocked provider APIs
  - _Requirements: 3.1, 3.6, 5.2, 8.2_

- [x] 7. RSVP API Handler and Routes
  - Create RSVPHandler class following existing handler patterns
  - Implement submitRSVP method with Zod validation and error handling
  - Implement getStats method for authenticated users
  - Create /api/rsvp route for public RSVP submissions
  - Create /api/rsvp/stats route with authentication middleware
  - _Requirements: 2.1, 2.2, 2.5, 5.1, 6.1_

- [x] 8. Messaging API Handler and Routes
  - Create MessagingHandler class following existing patterns
  - Implement sendMessage method with authentication and validation
  - Create /api/messages/send route with requireOnboarding middleware
  - Add rate limiting for messaging endpoints
  - Write API integration tests for messaging endpoints
  - _Requirements: 3.1, 3.4, 3.5, 5.1, 6.1_

- [x] 9. Vendor SSR Page Implementation
  - Extend existing VendorService to support public vendor lookup by slug
  - Create app/vendors/[slug]/page.tsx with SSR and ISR configuration
  - Implement generateStaticParams for popular vendors
  - Set revalidate timer to 15 minutes using environment variable
  - Create /api/public/vendors/[slug] endpoint for data fetching
  - _Requirements: 1.1, 1.2, 1.3, 5.1_

- [x] 10. Vendor Client-Side Interactivity
  - Create ClientPage.tsx component for vendor page hydration
  - Implement image gallery carousel with keyboard navigation
  - Create contact form component with Zod validation
  - Add inquiry submission functionality (stub for MVP)
  - Ensure proper focus management and accessibility
  - _Requirements: 1.5, 7.2, 7.4, 7.5_

- [x] 11. RSVP Page Implementation
  - Create app/rsvp/[inviteId]/page.tsx with server-side invite validation
  - Implement RSVP form component with optimistic UI updates
  - Add form validation with Zod schemas and error display
  - Implement persistence check on page refresh
  - Add aria-live regions for form status updates
  - _Requirements: 2.1, 2.6, 7.1, 7.4, 8.3_

- [x] 12. Budget Persistence Enhancement
  - Extend existing BudgetService to ensure server-side total calculation
  - Update dashboard to server-render budget totals
  - Implement real-time client updates while maintaining server state
  - Add persistence tests across page refreshes
  - Ensure budget totals remain consistent across sessions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.3_

- [ ] 13. Environment Configuration and Validation
  - Update .env.example with all required messaging provider keys
  - Add environment variable validation for messaging configuration
  - Implement fallback configuration for missing provider credentials
  - Add DEFAULT_REVALIDATE_SECONDS configuration for ISR
  - Create configuration validation on application startup
  - _Requirements: 1.4, 3.1, 6.1_

- [ ] 14. Logging and Monitoring Implementation
  - Add service-level logging with structured context
  - Implement credit operation failure tracking
  - Add RSVP submission analytics events
  - Mask sensitive information in logs (email addresses)
  - Create monitoring counters for key operations
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 15. End-to-End Testing Suite
  - Write E2E test for RSVP submission and persistence across refresh
  - Write E2E test for duplicate RSVP submission idempotency
  - Write E2E test for vendor page SSR content and hydration
  - Write E2E test for messaging credit deduction
  - Add visual regression tests for key user flows
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 16. Performance Optimization and Caching
  - Implement Redis caching for frequently accessed vendor data
  - Add database indexes for RSVP and messaging queries
  - Optimize vendor page bundle size and loading performance
  - Implement proper ISR cache invalidation on vendor updates
  - Achieve Lighthouse performance score ≥85 on vendor pages
  - _Requirements: 1.1, 1.4, 1.5_

- [ ] 17. Security and Rate Limiting
  - Implement rate limiting for RSVP submissions by IP
  - Add rate limiting for messaging endpoints per user
  - Implement input sanitization for all user-generated content
  - Add CSRF protection for form submissions
  - Validate and sanitize all Zod schema inputs
  - _Requirements: 6.1, 7.1, 8.1_

- [ ] 18. Integration and System Testing
  - Test concurrent messaging operations with single credit balance
  - Test RSVP system under high load with multiple simultaneous submissions
  - Test vendor page revalidation after data updates
  - Test messaging provider failover scenarios
  - Verify all error handling paths return appropriate HTTP status codes
  - _Requirements: 3.4, 3.5, 8.4, 8.5_