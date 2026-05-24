import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
// @ts-ignore
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import Document from '../models/Document';

export const initYjsWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    try {
      const url = req.url || '';
      // URL format is typically /ws/docId
      const docId = url.split('/').pop() || 'default';

      console.log(`[YJS WebSocket] Connection established for docId: ${docId}`);

      // Bind the ws client to the Yjs document session
      setupWSConnection(ws, req, { docName: docId });
    } catch (err) {
      console.error('[YJS WebSocket] Error during connection setup:', err);
    }
  });

  // Background auto-save interval: Run every 60 seconds
  setInterval(async () => {
    try {
      if (docs.size === 0) return;

      console.log(`[YJS Auto-Save] Running auto-save for ${docs.size} active document(s)...`);

      for (const [docId, ydoc] of docs.entries()) {
        // Tiptap stores rich text contents in a Y.XmlFragment named 'default'
        const xmlFragment = ydoc.getXmlFragment('default');
        const contentStr = xmlFragment.toString() || '';

        const doc = await Document.findById(docId);
        if (doc) {
          // If content is unmodified, skip to avoid bloating versions
          if (doc.content === contentStr) {
            continue;
          }

          // Update current state
          doc.content = contentStr;

          // Push snapshot to versions array
          doc.versions.push({
            title: doc.title || 'Auto-saved Version',
            content: contentStr,
            savedAt: new Date(),
            savedBy: doc.owner // Default attribution to the document owner
          });

          await doc.save();
          console.log(`[YJS Auto-Save] Saved new version snapshot for document: ${docId}`);
        }
      }
    } catch (error) {
      console.error('[YJS Auto-Save] Error during document snapshot auto-save:', error);
    }
  }, 60000); // 60,000ms = 60s
};
export default initYjsWebSocket;
