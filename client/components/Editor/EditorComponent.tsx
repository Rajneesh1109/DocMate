'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Toolbar from './Toolbar';
import { User } from '../../types';

interface EditorComponentProps {
  docId: string;
  currentUser: User;
  userColor: string;
  role: 'editor' | 'viewer';
}

interface EditorInnerComponentProps extends EditorComponentProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
}

const EditorInnerComponent: React.FC<EditorInnerComponentProps> = ({
  docId,
  currentUser,
  userColor,
  role,
  ydoc,
  provider,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable history because collaboration sync manages history conflicts
        history: false,
      } as any),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider: provider,
        user: {
          name: currentUser.name,
          color: userColor,
        },
      }),
    ],
    // Set editable based on permission role
    editable: role === 'editor',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6 text-zinc-100 selection:bg-indigo-500/30',
      },
    },
  }, [ydoc, provider]);

  // Dynamically update editable status if role changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(role === 'editor');
    }
  }, [editor, role]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/30 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      {/* Rich Formatting Toolbar */}
      {role === 'editor' && <Toolbar editor={editor} />}
      
      {/* Editor Body */}
      <div className="relative overflow-y-auto max-h-[70vh] bg-zinc-900/10 min-h-[500px]">
        {role === 'viewer' && (
          <div className="absolute top-3 right-3 z-10 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-400 uppercase">
            Read Only Mode
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export const EditorComponent: React.FC<EditorComponentProps> = ({
  docId,
  currentUser,
  userColor,
  role,
}) => {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    // Create Yjs Doc and Websocket Provider on client side only
    const doc = new Y.Doc();
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
    
    // Connect to Yjs websocket handler on the server
    const wsProvider = new WebsocketProvider(wsUrl, docId, doc);

    setYdoc(doc);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      doc.destroy();
    };
  }, [docId]);

  if (!ydoc || !provider) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm font-medium text-zinc-400">Connecting to document session...</p>
      </div>
    );
  }

  return (
    <EditorInnerComponent
      docId={docId}
      currentUser={currentUser}
      userColor={userColor}
      role={role}
      ydoc={ydoc}
      provider={provider}
    />
  );
};

export default EditorComponent;
