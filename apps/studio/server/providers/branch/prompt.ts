export type BranchCandidate = {
  strategy: string;
  predicted_next_intent: string;
  score: number;
  status: "kept" | "preserved" | "pruned";
  reason: string;
};

export type BranchResult = {
  candidates: BranchCandidate[];
  championStrategy: string;
  agentResponse: string;
};

export function buildBranchPrompt(
  englishTranscript: string,
  ctx: { shopperMode: string; badges: string[]; intent: string; situationTags?: string[] },
  gen: { maxCandidates: number },
): string {
  const tags = (ctx.situationTags ?? []).join(", ") || "none";
  return `You are the policy engine for a retail support voice agent.
Shopper mode: ${ctx.shopperMode}. Badges: ${ctx.badges.join(", ")}. Current intent: ${ctx.intent}. Situation tags: ${tags}.
Policy: when the situation involves an urgent event deadline, DO NOT lead with standard shipping policy. Acknowledge the deadline, then check inventory/replacement before any refund/policy talk. Mark policy-first strategies as "pruned".
Latest shopper message (English): "${englishTranscript}"

Propose ${gen.maxCandidates} candidate agent response strategies. For each, give:
- strategy: a short label (3-5 words)
- predicted_next_intent: the shopper's likely next intent if you use it
- score: 0..1 expected containment quality
- status: "kept" for the single best, "preserved" for a viable alternative, "pruned" for weak/unsafe
- reason: one short clause

Then pick the champion (the "kept" one) and write its actual agent response in natural ENGLISH (one or two sentences, empathetic, no policy-first language).

Return ONLY compact JSON:
{"candidates":[{"strategy":"","predicted_next_intent":"","score":0.0,"status":"kept|preserved|pruned","reason":""}],"championStrategy":"","agentResponse":""}
No markdown.`;
}