import type { Candidate } from "./contracts.js";

export function streamBranches(
  payload: {
    englishTranscript: string;
    ctx: { shopperMode: string; badges: string[]; intent?: string; situationTags?: string[] };
    gen: { model: string; maxCandidates: number };
  },
  handlers: {
    onCandidate(c: Candidate): void;
    onChampion(strategy: string, response: string): void;
    onError(m: string): void;
    onDone(): void;
  },
): void {
  const ws = new WebSocket(`ws://${location.host}/api/branch`);
  ws.binaryType = "arraybuffer";
  ws.onopen = () => ws.send(JSON.stringify(payload));
  ws.onmessage = (ev) => {
    const raw = ev.data instanceof ArrayBuffer ? new TextDecoder().decode(ev.data) : ev.data;
    const m = JSON.parse(raw);
    if (m.type === "candidate") handlers.onCandidate({ ...m.candidate, id: m.id });
    else if (m.type === "champion") handlers.onChampion(m.championStrategy, m.agentResponse);
    else if (m.type === "error") handlers.onError(m.message);
    else if (m.type === "done") { handlers.onDone(); ws.close(); }
  };
}