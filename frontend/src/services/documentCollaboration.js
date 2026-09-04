import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export const createDocumentCollaboration = ({
  documentId,
  token,
}) => {
  const ydoc = new Y.Doc();

  const provider = new HocuspocusProvider({
    url: import.meta.env.VITE_HOCUSPOCUS_URL,
    name: `document:${documentId}`,
    document: ydoc,
    token,
  });

  return {
    ydoc,
    provider,
  };
};