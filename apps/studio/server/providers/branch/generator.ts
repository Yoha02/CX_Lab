import { env } from "../../lib/env.js";
import { buildBranchPrompt, type BranchResult, type BranchCandidate } from "./prompt.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export function coerceBranchResult(raw: any): BranchResult {
  const cands: BranchCandidate[] = (raw?.candidates ?? []).map((c: any) => ({
    strategy: String(c.strategy ?? "strategy"),
    predicted_next_intent: String(c.predicted_next_intent ?? "unknown"),
    score: Math.max(0, Math.min(1, Number(c.score ?? 0))),
    status: ["kept", "preserved", "pruned"].includes(c.status) ? c.status : "pruned",
    reason: String(c.reason ?? ""),
  }));
  let seenKept = false;
  for (const c of cands) {
    if (c.status === "kept") {
      if (seenKept) c.status = "preserved";
      else seenKept = true;
    }
  }
  if (!seenKept && cands.length) cands[0].status = "kept";
  return {
    candidates: cands,
    championStrategy: String(
      raw?.championStrategy ?? cands.find((c) => c.status === "kept")?.strategy ?? "",
    ),
    agentResponse: String(raw?.agentResponse ?? ""),
  };
}

export async function generateBranches(
  englishTranscript: string,
  ctx: { shopperMode: string; badges: string[]; intent: string; situationTags?: string[] },
  gen: { model: string; maxCandidates: number },
): Promise<BranchResult> {
  const prompt = buildBranchPrompt(englishTranscript, ctx, gen);
  const url = `${BASE}/models/${gen.model}:generateContent?key=${env.geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Branch ${res.status}: ${await res.text()}`);
  const out: any = await res.json();
  const text = out.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  return coerceBranchResult(JSON.parse(m ? m[0] : text));
}