import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * Shared Tiptap extensions for resume editing.
 * These provide core formatting: headings, lists, bold/italic,
 * links, underline, and a placeholder for empty content.
 */
export const tiptapExtensions = [
  StarterKit,
  Link.configure({
    openOnClick: false,
    linkOnPaste: true,
    autolink: true,
  }),
  Underline,
  Placeholder.configure({
    placeholder: 'Click to edit...',
  }),
];