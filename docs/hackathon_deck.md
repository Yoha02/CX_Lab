# CX Dojo Hackathon Slide Deck (4 High-Level Slides)

This deck outlines the presentation starting from **Slide 4** (the first content slide in the master template), removing Google Cloud branding while keeping the original layout guides, fonts (*Google Sans Medium*), and color palettes (G Blue, G Green, G Red, G Grey).

* **View Presentation Link:** [Google Slides](https://docs.google.com/presentation/d/1tDiCJFlyxtT1Tdy0UlJFwmZO0Q5SR09xG6HQcD-2cz0/edit)
* **Make a Copy Link:** [Duplicate Slide Deck in Google Drive](https://docs.google.com/presentation/d/1tDiCJFlyxtT1Tdy0UlJFwmZO0Q5SR09xG6HQcD-2cz0/copy)

---

## Slide 1: Cover Slide (Slide 4 Layout)
* **Layout Preset:** 01. Title slide (Deep G Blue background, bold white typography)
* **Header Size:** 115pt Google Sans Medium
* **Subtitle Size:** 48pt Google Sans Medium

### Content
# CX Dojo
## The Recursive Self-Improvement Loop for Conversational Commerce

---

## Slide 2: The Problem (Slide 5 Layout — Hero Statement)
* **Layout Preset:** 05. Statement slides (White background, centered high-impact statement)
* **Header Size:** 72pt Google Sans Medium (G Red highlighted words)
* **Body Text Size:** 32pt Google Sans Medium

### Content
> "Static customer service playbooks force a broken trade-off: **escalate to humans** too early, or **alienate shoppers** with rigid policies."

### Context Points (24pt / 20pt)
* Customer support agents use playbooks that cannot adapt to real-time containment failures.
* Over-correcting for one customer persona breaks containment flow for another.
* When failures occur, the valuable transcripts go into unread databases rather than fixing the core guidelines.

---

## Slide 3: The Market Gap (Slide 7 Layout — 2-Column List)
* **Layout Preset:** 07. Type slides (Two parallel columns comparing traditional vs. cluster learning)
* **Heading Size:** 48pt Google Sans Medium
* **Body Text Size:** 24pt Google Sans Medium

### Left Column: Traditional Persona Tuning (G Grey)
* **The Trap:** Optimizing rules purely by customer persona IDs (e.g. Loyal Shopper vs. First-time Buyer).
* **The Result:** High overhead, slow revisions, and failure to generalize lessons across customer journeys.

### Right Column: Behavioral Failure Clusters (G Blue Highlight)
* **The Missing Link:** Grouping failures by behavioral keys (`intent + situation_tags + agent_strategy + failure_mode`).
* **The Advantage:** Identifying the core behavioral pattern (e.g., explaining late delivery policy on urgent event deadlines) across all personas simultaneously.

---

## Slide 4: The Solution (Slide 9 Layout — Timeline & Flow)
* **Layout Preset:** 09. Bullet & lists slides (Flow/Timeline visualization of the RSI Loop)
* **Heading Size:** 48pt Google Sans Medium
* **Body Text Size:** 24pt Google Sans Medium

### The 3-Step Recursive Self-Improvement (RSI) Loop

* **1. Vectorized Capture (G Blue):** 
  Every failed agent session is automatically vectorized using `pgvector` and saved, allowing instant similarity lookup for human operators during escalations.
* **2. Clustered Dream Pass (G Yellow):** 
  Offline background agents analyze unprocessed failures, grouping them into behavioral clusters instead of persona silos to identify structural playbook bugs.
* **3. Consolidated Patch Propagation (G Green):** 
  The system automatically generates a global playbook rule paired with customized persona overrides, promoting and deploying updated playbooks to production.
