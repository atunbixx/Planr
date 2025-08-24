# Requirements Document

## Introduction

This specification outlines the development of Planr v1.0, a wedding planning platform that implements vendor pages with Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR), a robust RSVP system, and messaging credits with country-aware pricing. The system will maintain clean architecture patterns with proper separation between repositories, services, and API handlers while ensuring type safety throughout.

## Requirements

### Requirement 1

**User Story:** As a bride/groom, I want to publish vendor pages that load quickly and are SEO-friendly, so that my wedding vendors can be discovered and contacted efficiently.

#### Acceptance Criteria

1. WHEN a vendor page is accessed THEN the system SHALL render content server-side for SEO and performance
2. WHEN vendor data is updated THEN the system SHALL revalidate the page within 15 minutes using ISR
3. WHEN JavaScript is disabled THEN the vendor page SHALL still display all essential information
4. WHEN a vendor page loads THEN it SHALL achieve a Lighthouse performance score of ≥85
5. WHEN the page hydrates THEN interactive elements SHALL become functional without layout shift (CLS < 0.1)

### Requirement 2

**User Story:** As a wedding guest, I want to receive an invite link and submit my RSVP with party details, so that the couple knows my attendance status and can plan accordingly.

#### Acceptance Criteria

1. WHEN a guest accesses an RSVP link THEN the system SHALL display a form to capture attendance status, party size, and notes
2. WHEN a guest submits an RSVP THEN the system SHALL validate the input using Zod schemas
3. WHEN an RSVP is submitted THEN the system SHALL persist the response with idempotency key (inviteId + guestEmail)
4. WHEN a duplicate RSVP is submitted THEN the system SHALL return the existing record without creating duplicates
5. WHEN an RSVP is saved THEN the couple's dashboard SHALL reflect updated attendance counters immediately
6. WHEN a guest refreshes after submitting THEN their RSVP data SHALL persist and display correctly

### Requirement 3

**User Story:** As a couple, I want to preload messaging credits and send invitations via email/SMS with country-aware pricing, so that I can communicate with guests efficiently while managing costs.

#### Acceptance Criteria

1. WHEN credits are loaded for a couple THEN the system SHALL store the balance securely in the database
2. WHEN a message is sent THEN the system SHALL calculate unit cost based on channel and country from the pricebook
3. WHEN credits are decremented THEN the system SHALL use atomic operations to prevent race conditions
4. WHEN insufficient credits exist THEN the system SHALL reject the message request with appropriate error
5. WHEN two concurrent messages are sent with only 1 credit available THEN exactly one SHALL succeed
6. WHEN a message is sent successfully THEN the system SHALL return the provider message ID for tracking

### Requirement 4

**User Story:** As a couple, I want my budget items to persist across sessions and refresh, so that I can reliably track my wedding expenses.

#### Acceptance Criteria

1. WHEN budget items are added THEN the system SHALL save them to the database immediately
2. WHEN the dashboard is refreshed THEN budget totals SHALL remain accurate and consistent
3. WHEN budget items are modified THEN the total SHALL update in real-time on the client
4. WHEN the page is server-rendered THEN budget totals SHALL be calculated server-side for reliability
5. WHEN multiple budget items exist THEN the system SHALL calculate and display the correct sum

### Requirement 5

**User Story:** As a developer, I want clean architecture with proper separation of concerns, so that the codebase is maintainable and testable.

#### Acceptance Criteria

1. WHEN data access is needed THEN repositories SHALL be the only layer interacting with Prisma
2. WHEN business logic is implemented THEN services SHALL handle cross-entity rules and validation
3. WHEN API endpoints are created THEN they SHALL use Zod for input validation
4. WHEN types are defined THEN Prisma types SHALL be used in repositories and DTOs in services
5. WHEN components need data THEN they SHALL NOT make direct database calls

### Requirement 6

**User Story:** As a system administrator, I want proper error handling and logging, so that issues can be diagnosed and resolved quickly.

#### Acceptance Criteria

1. WHEN service-level events occur THEN the system SHALL log with appropriate context and levels
2. WHEN credit operations fail THEN the system SHALL track failure counters for monitoring
3. WHEN RSVP submissions occur THEN the system SHALL emit analytics events
4. WHEN errors occur THEN sensitive information SHALL be masked in logs
5. WHEN API requests fail THEN the system SHALL return appropriate HTTP status codes with error details

### Requirement 7

**User Story:** As a user with accessibility needs, I want the interface to be accessible, so that I can use the platform effectively.

#### Acceptance Criteria

1. WHEN forms are displayed THEN all inputs SHALL have proper labels and error messages
2. WHEN interactive elements are present THEN they SHALL be keyboard navigable
3. WHEN colors are used THEN they SHALL meet AA contrast requirements
4. WHEN form states change THEN screen readers SHALL be notified via aria-live regions
5. WHEN focus moves THEN it SHALL be clearly visible to users

### Requirement 8

**User Story:** As a developer, I want comprehensive testing coverage, so that features work reliably in production.

#### Acceptance Criteria

1. WHEN repositories are implemented THEN they SHALL have unit tests with mocked databases
2. WHEN services contain business logic THEN they SHALL have unit tests for all scenarios
3. WHEN critical user flows exist THEN they SHALL have end-to-end tests
4. WHEN concurrent operations are possible THEN they SHALL be tested for race conditions
5. WHEN the CI pipeline runs THEN all tests SHALL pass before deployment