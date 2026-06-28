import { Room, RoomEvent, type TranscriptionSegment } from "livekit-client";

export interface LiveKitHandle { leave(): void; }

export async function joinLiveKitRoom(onTranscript: (text: string, final: boolean) => void): Promise<LiveKitHandle> {
  const res = await fetch(`/api/livekit/token?room=cx-demo&identity=studio-${Date.now()}`);
  const { url, token } = await res.json();
  const room = new Room();
  room.on(RoomEvent.TranscriptionReceived, (segments: TranscriptionSegment[]) => {
    for (const s of segments) onTranscript(s.text, s.final);
  });
  await room.connect(url, token);
  await room.localParticipant.setMicrophoneEnabled(true);
  return { leave() { room.disconnect(); } };
}