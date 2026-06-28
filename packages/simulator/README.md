# Simulator

Owner: Person 2 - Experiment Engine + Scoring.

Purpose:

- Generate synthetic retail/ecommerce support calls.
- Run policy variants against shopper profiles and scenarios.
- Produce completed `ConversationResult` objects for eval and dream pass.

Initial scenarios:

- late birthday gift
- damaged item
- missing refund
- wrong size exchange

Initial shopper modes:

- New Shopper
- Regular Shopper
- Loyal Shopper
- At-Risk Shopper

Badges:

- Urgent
- Gift Order
- Discount Sensitive
- Return-Prone
- Prior Issue
- High Value
- Low Trust

Boundaries:

- Use contracts from `packages/contracts`.
- Use scoring functions from `packages/eval`.
- Do not directly couple to the frontend.
