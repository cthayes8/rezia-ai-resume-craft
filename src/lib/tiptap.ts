import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * Shared Tiptap extensions for resume editing.
 * These provide core formatting: headings, lists, bold/italic,
 * links, underline, and a placeholder for empty content.
 */
export const tiptapExtensions = [
  // Core functionality: nodes, marks, and history (included in StarterKit)
  StarterKit,
  // Text alignment for headings and paragraphs
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  // Link handling
  Link.configure({
    openOnClick: false,
    linkOnPaste: true,
    autolink: true,
  }),
  // Underline formatting
  Underline,
  // Placeholder text when empty
  Placeholder.configure({
    placeholder: 'Click to edit...',
  }),
];