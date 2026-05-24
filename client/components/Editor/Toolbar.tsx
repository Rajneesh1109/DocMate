'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Terminal
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    {
      icon: <Bold className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      title: 'Bold (Ctrl+B)',
    },
    {
      icon: <Italic className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      title: 'Italic (Ctrl+I)',
    },
    {
      icon: <Strikethrough className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
      title: 'Strikethrough',
    },
    {
      icon: <Code className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
      title: 'Code Inline',
    },
    { type: 'divider' },
    {
      icon: <Heading1 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
      title: 'Heading 1',
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
      title: 'Heading 2',
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
      title: 'Heading 3',
    },
    { type: 'divider' },
    {
      icon: <List className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      title: 'Bullet List',
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      title: 'Ordered List',
    },
    {
      icon: <Quote className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
      title: 'Blockquote',
    },
    {
      icon: <Terminal className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive('codeBlock'),
      title: 'Code Block',
    },
    {
      icon: <Minus className="h-4 w-4" />,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: false,
      title: 'Horizontal Rule',
    },
    { type: 'divider' },
    {
      icon: <Undo className="h-4 w-4" />,
      onClick: () => editor.chain().focus().undo().run(),
      isActive: false,
      title: 'Undo (Ctrl+Z)',
    },
    {
      icon: <Redo className="h-4 w-4" />,
      onClick: () => editor.chain().focus().redo().run(),
      isActive: false,
      title: 'Redo (Ctrl+Y)',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 bg-zinc-950 p-2.5">
      {buttons.map((btn, index) => {
        if (btn.type === 'divider') {
          return <div key={index} className="mx-1.5 h-5 w-[1px] bg-zinc-800" />;
        }

        return (
          <button
            key={index}
            type="button"
            onClick={btn.onClick}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
              btn.isActive
                ? 'bg-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
            title={btn.title}
          >
            {btn.icon}
          </button>
        );
      })}
    </div>
  );
};

export default Toolbar;
