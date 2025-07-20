import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { InputModal } from '@/components/ui/input-modal';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  RotateCcw,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

interface SimpleToolbarProps {
  editor: Editor | null;
}

export const SimpleToolbar: React.FC<SimpleToolbarProps> = ({ editor }) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white p-2">
      {/* Undo / Redo */}
      <Button
        size="icon"
        variant="outline"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <RotateCcw />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <RotateCw />
      </Button>
      {/* Text alignment */}
      <Button
        size="icon"
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft />
      </Button>
      <Button
        size="icon"
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter />
      </Button>
      <Button
        size="icon"
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight />
      </Button>
      <Button
        size="icon"
        variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustify />
      </Button>
      {/* Basic formatting */}
      <Button
        size="icon"
        variant={editor.isActive('bold') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </Button>
      <Button
        size="icon"
        variant={editor.isActive('italic') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </Button>
      <Button
        size="icon"
        variant={editor.isActive('underline') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline />
      </Button>
      {/* Heading selector */}
      <Select
        value={
          editor.isActive('heading', { level: 1 })
            ? 'h1'
            : editor.isActive('heading', { level: 2 })
            ? 'h2'
            : editor.isActive('heading', { level: 3 })
            ? 'h3'
            : 'paragraph'
        }
        onValueChange={(value) => {
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else {
            const lvl = Number(value.replace('h', ''));
            editor.chain().focus().toggleHeading({ level: lvl }).run();
          }
        }}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Paragraph" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>
      {/* Lists */}
      <Button
        size="icon"
        variant={editor.isActive('bulletList') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </Button>
      <Button
        size="icon"
        variant={editor.isActive('orderedList') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </Button>
      {/* Link */}
      <Button
        size="icon"
        variant={editor.isActive('link') ? 'default' : 'outline'}
        onClick={() => setShowLinkModal(true)}
      >
        <Link2 />
      </Button>

      {/* Link Modal */}
      <InputModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onConfirm={(url) => {
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        title="Add Link"
        description="Enter the URL you want to link to"
        placeholder="https://example.com"
        confirmText="Add Link"
        cancelText="Cancel"
        required={true}
      />
    </div>
  );
};