---
name: Seller profile identifiers
description: Public seller profile URLs and listing ownership use different identifiers.
---

Listings are owned by the seller user ID, while public seller profile routes use the seller-profile ID. API responses should expose the canonical profile ID for listing-to-profile navigation.

**Why:** Numeric IDs can overlap across the users and seller profiles tables, causing a listing to open the wrong company profile.

**How to apply:** When adding listing cards, detail pages, inquiries, or seller links, use the profile ID for `/sellers/:id` and the user ID for ownership and authenticated mutations.