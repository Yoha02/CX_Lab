# RACX Hackathon Slide Deck (4 High-Level Slides)

This deck outlines the presentation starting from **Slide 4** (the first content slide in the master template), removing Google Cloud branding while keeping the original layout guides, fonts (*Google Sans Medium*), and color palettes (G Blue, G Green, G Red, G Grey).

* **View Presentation Link:** [Google Slides](https://docs.google.com/presentation/d/1tDiCJFlyxtT1Tdy0UlJFwmZO0Q5SR09xG6HQcD-2cz0/edit)
* **Make a Copy Link:** [Duplicate Slide Deck in Google Drive](https://docs.google.com/presentation/d/1tDiCJFlyxtT1Tdy0UlJFwmZO0Q5SR09xG6HQcD-2cz0/copy)

---

## Slide 1: Cover Slide (Slide 4 Layout)
* **Layout Preset:** 01. Title slide (Deep G Blue background, bold white typography)
* **Header Size:** 115pt Google Sans Medium
* **Subtitle Size:** 48pt Google Sans Medium

### Content
# RACX
## Customer Experience Platform via Continuous Resolution Loops, Engineered for Containment

---

## Slide 2: The Problem (Slide 5 Layout — Hero Statement)
* **Layout Preset:** 05. Statement slides (White background, centered high-impact statement)
* **Header Size:** 72pt Google Sans Medium (G Red highlighted words)
* **Body Text Size:** 32pt Google Sans Medium

### Content
> "Static playbooks force AI agents to hit **The Static Containment Ceiling**: they repeat the same failures because they cannot learn."

### Context Points (24pt / 20pt)
* Support transcripts are buried in databases, leaving agent rules frozen.
* Traditional support tools focus on *"answering a question"* rather than *"solving the underlying ticket."*
* Rigorous guidelines force a broken trade-off: premature human escalation or customer frustration.

---

## Slide 3: The Market Gap (Slide 7 Layout — 2-Column List)
* **Layout Preset:** 07. Type slides (Two parallel columns comparing traditional vs. cluster learning)
* **Heading Size:** 48pt Google Sans Medium
* **Body Text Size:** 24pt Google Sans Medium

### Left Column: Traditional Persona Tuning (G Grey)
* **The Silo:** Trying to fix support flows based purely on customer persona IDs (e.g. Loyal Shopper vs. First-time Buyer).
* **The Limitation:** Overfits instructions to individual profiles; fails to identify core behavioral patterns across different shoppers.

### Right Column: Behavioral Failure Clusters (G Blue Highlight)
* **The Breakthrough:** Grouping failures by composite behavioral keys (`intent + situation_tags + agent_strategy + failure_mode`).
* **The Reality:** *Personas personalize the fix, but failure clusters discover the fix.* Solving the common root breakdown across all personas simultaneously.

---

## Slide 4: The Solution (Slide 9 Layout — Timeline & Flow)
* **Layout Preset:** 09. Bullet & lists slides (Flow/Timeline visualization of the RSI Loop)
* **Heading Size:** 48pt Google Sans Medium
* **Body Text Size:** 24pt Google Sans Medium

### The 3-Loop Continuous Resolution Loop Engine

* **1. Vectorized Capture (G Blue):** 
  Failed calls are automatically embedded and saved using `pgvector`, creating a real-time semantic memory search for live containment retrieval.
* **2. Clustered Dreaming (G Yellow):** 
  Offline background agents analyze unprocessed failure runs, grouping them into behavioral clusters to identify structural playbook bugs.
* **3. Playbook Patch Propagation (G Green):** 
  The system automatically generates a global playbook rule paired with customized persona overrides, promoting and deploying updated playbooks back to production.
