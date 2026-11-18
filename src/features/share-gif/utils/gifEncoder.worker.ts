/**
 * Module worker that builds the GIF's palette and encodes its frames, so the
 * page stays responsive while a game is turned into a GIF. The frames are
 * drawn on the page (they need the canvas, the piece images and the fonts)
 * and their pixels transferred here. See createWorkerBackend.
 */
import { createEncoderHandler } from "./gifEncoder";
import type { EncoderReply, EncoderRequest } from "./gifEncoderClient";

// The app is typed with the DOM library; this is the worker's own scope
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<EncoderRequest>) => void) | null;
  postMessage(message: EncoderReply, transfer: Transferable[]): void;
};

const handle = createEncoderHandler((reply, transfer = []) => scope.postMessage(reply, transfer));
scope.onmessage = (event) => handle(event.data);
