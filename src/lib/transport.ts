/**
 * Message transport contract: client sends user text, server returns
 * { text, audio }. Two implementations + a demo fallback.
 *
 * REST shape:
 *   POST <url>  { text }  →  { text, audio: base64, mimeType? }
 *
 * WebSocket shape:
 *   client → server  { type: 'user_message', text }
 *   server → client  { type: 'agent_response', text, audio: base64, mimeType? }
 */

export interface AgentResponse {
  text: string;
  audio: ArrayBuffer;
  mimeType: string;
}

export interface MessageTransport {
  send(userText: string): Promise<AgentResponse>;
  dispose?: () => void;
}

const DEFAULT_MIME = 'audio/mpeg';

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function createRestTransport(url: string): MessageTransport {
  return {
    async send(userText) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: userText }),
      });
      if (!res.ok) throw new Error(`Transport ${res.status}: ${await res.text()}`);
      const ct = res.headers.get('content-type') ?? '';

      if (ct.includes('application/json')) {
        const body = (await res.json()) as { text: string; audio: string; mimeType?: string };
        return {
          text: body.text,
          audio: base64ToArrayBuffer(body.audio),
          mimeType: body.mimeType ?? DEFAULT_MIME,
        };
      }
      // assume binary audio + text in headers (alternative server style)
      const text = res.headers.get('x-response-text') ?? '';
      return {
        text,
        audio: await res.arrayBuffer(),
        mimeType: ct || DEFAULT_MIME,
      };
    },
  };
}

export function createWsTransport(url: string): MessageTransport {
  let ws: WebSocket | null = null;
  let queue: Array<(r: AgentResponse) => void> = [];

  const ensure = (): WebSocket => {
    if (ws && ws.readyState === WebSocket.OPEN) return ws;
    ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('message', (ev) => {
      const resolver = queue.shift();
      if (!resolver) return;
      try {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
        if (msg.type !== 'agent_response') throw new Error('unexpected msg type');
        resolver({
          text: msg.text,
          audio: base64ToArrayBuffer(msg.audio),
          mimeType: msg.mimeType ?? DEFAULT_MIME,
        });
      } catch (e) {
        console.error('[transport] bad ws message', e);
      }
    });
    return ws;
  };

  return {
    async send(userText) {
      const sock = ensure();
      if (sock.readyState !== WebSocket.OPEN) {
        await new Promise<void>((resolve) =>
          sock.addEventListener('open', () => resolve(), { once: true }),
        );
      }
      const promise = new Promise<AgentResponse>((resolve) => queue.push(resolve));
      sock.send(JSON.stringify({ type: 'user_message', text: userText }));
      return promise;
    },
    dispose() {
      ws?.close();
      ws = null;
      queue = [];
    },
  };
}

/**
 * Demo: returns the bundled sample.mp3 with a hardcoded transcript so the
 * lipsync pipeline can be exercised without any backend.
 */
const DEMO_TEXT =
  "Hello there. I'm a 3D character with real-time lip sync, powered by " +
  'TalkingHead.js. Notice how my mouth shapes match the phonemes I speak ' +
  'rather than just opening and closing with the volume.';

export function createDemoTransport(): MessageTransport {
  return {
    async send() {
      const res = await fetch('/sample.mp3');
      if (!res.ok) throw new Error('demo: /sample.mp3 missing');
      return {
        text: DEMO_TEXT,
        audio: await res.arrayBuffer(),
        mimeType: 'audio/mpeg',
      };
    },
  };
}
