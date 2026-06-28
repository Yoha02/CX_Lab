import { AccessToken } from "livekit-server-sdk";
import { env } from "../../lib/env.js";

export async function createLiveKitToken(room: string, identity: string): Promise<string> {
  if (!env.livekitApiKey || !env.livekitApiSecret) throw new Error("LiveKit credentials not set");
  const at = new AccessToken(env.livekitApiKey, env.livekitApiSecret, { identity });
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
  return await at.toJwt();
}
