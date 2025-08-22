# Wedding Planner Improvement Plan

This document outlines a phased approach to improving the Wedding Planner application, focusing on resolving technical debt, enhancing the user experience, and introducing valuable new features.

---

## Phase 1: Foundation & Technical Debt Remediation

This initial phase is critical for creating a stable and maintainable codebase, which will accelerate all future development.

### 1.1. Frontend Data Model Migration

*   **Goal:** Eliminate the "legacy" data model transformations in the API by aligning the frontend components with the modern Prisma schema.
*   **Why:** This is the highest priority. It will simplify the codebase, reduce bugs, improve performance, and make development faster and easier.
*   **Key Steps:**
    1.  **Audit:** Identify all frontend components that rely on the old data structures (e.g., using a single `name` field for guests instead of `firstName` and `lastName`).
    2.  **Refactor Components:** Update the audited components one by one to use the new data models directly from the API.
    3.  **Update API Calls:** Modify frontend API calls to send and expect data in the new format.
    4.  **Remove Legacy Code:** Once the frontend is fully migrated, remove all data transformation logic from the API handlers (`guest.handler.ts`, etc.) and the `temp-storage` fallbacks.

### 1.2. Unify the Design System

*   **Goal:** Create a consistent and polished user interface by committing to a single design system.
*   **Why:** A unified design system improves UI/UX consistency, brand identity, and developer efficiency.
*   **Key Steps:**
    1.  **Decision:** Formally decide to use **shadcn/ui (with Tailwind CSS)** as the primary UI library.
    2.  **Component Inventory:** List all components currently built with MUI.
    3.  **Migration:** Rebuild or replace the MUI components with their `shadcn/ui` and Tailwind equivalents.
    4.  **Deprecation:** Remove the MUI and Emotion dependencies from `package.json`.

---

## Phase 2: Core Feature & UI/UX Enhancement

With a stable foundation, this phase focuses on improving the usability of existing features.

### 2.1. Implement Optimistic UI Updates

*   **Goal:** Make the application feel faster and more responsive.
*   **Why:** Instant feedback improves the user experience significantly.
*   **Target Areas:**
    *   Guest management (adding/deleting guests, updating RSVP status).
    *   Budgeting (adding/updating line items).
    *   Vendor management (marking vendors as favorites).

### 2.2. Build Intuitive Bulk Operations UI

*   **Goal:** Allow users to efficiently manage multiple items at once.
*   **Why:** Reduces repetitive tasks and saves users time.
*   **Key Steps:**
    1.  **Guest List:** Implement a table with checkboxes for selecting multiple guests.
    2.  **Action Bar:** Add a contextual action bar that appears when items are selected, with options like "Mark Invitation Sent," "Update RSVP Status," or "Assign to Household."
    3.  **Connect to API:** Wire this UI to the existing `/api/guests/bulk` endpoint.

### 2.3. Design Helpful Empty States

*   **Goal:** Guide users when they encounter empty pages or lists.
*   **Why:** Improves user onboarding and reduces confusion.
*   **Target Areas:**
    *   **Guest List:** Show a message like "Your guest list is empty. Add your first guest to get started!" with a primary "Add Guest" button.
    *   **Budget Dashboard:** Display a prompt to "Create your wedding budget" and guide them to the first step.
    *   **Vendor Dashboard:** Encourage users to "Start searching for vendors" or "Add a vendor you've already booked."

---

## Phase 3: New Feature Implementation

This phase focuses on expanding the application's capabilities with high-value new features.

### 3.1. Checklist & Task Management

*   **Features:**
    *   Templated checklists based on wedding timelines (e.g., 12+ months, 6 months, etc.).
    *   Ability to create custom tasks, assign due dates, and mark them as complete.
    *   Assign tasks to different users (e.g., bride, groom, planner).
*   **Data Model:** Requires a new `Task` model in `schema.prisma`.

### 3.2. Visual Seating Chart Manager

*   **Features:**
    *   A visual interface to create tables (round, rectangle).
    *   Drag-and-drop guests from the guest list onto seats.
    *   Track which guests have been seated and which have not.
*   **Data Model:** Requires new `Table` and `Seat` models in `schema.prisma`.

### 3.3. Vendor Communication Hub

*   **Features:**
    *   A centralized messaging interface within the vendor portal.
    *   Keep all vendor conversations, quotes, and contracts in one place.
    *   Email notifications for new messages.
*   **Data Model:** Requires a new `Message` model and potentially a `Conversation` model.

---

## Phase 4: Advanced Features & Intelligence Layer

This final phase introduces premium features that set the application apart.

### 4.1. Public Wedding Website Generator

*   **Features:**
    *   Allow couples to create a simple, elegant, and public-facing website.
    *   Include sections for their story, photos, event details, and gift registry links.
    *   Allow guests to RSVP directly through the website, which updates the main guest list.
*   **Data Model:** Could be an extension of the `WeddingDetails` model or a new `WeddingWebsite` model.

### 4.2. AI-Powered Suggestions

*   **Goal:** Provide smart, personalized assistance to users.
*   **Implementation:**
    *   **AI Budgeting:** Use guest count and total budget to suggest spending allocations per category.
    *   **AI Vendor Matching:** Recommend vendors from the directory based on the couple's style, budget, and location.
    *   **AI Timeline Generation:** Automatically create a detailed wedding day timeline based on ceremony time and vendor bookings.
