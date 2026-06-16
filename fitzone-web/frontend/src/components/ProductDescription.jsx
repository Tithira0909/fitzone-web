import React, { useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { api } from '../api/client.js';

function textBlock(text = '') {
  return [{ type: 'paragraph', content: text }];
}

export function parseDescription(value) {
  if (!value) return textBlock('');
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length ? parsed : textBlock('');
  } catch {
    return textBlock(value);
  }
}

async function uploadEditorFile(file) {
  const body = new FormData();
  body.append('images', file);
  const data = await api('/products/admin/images', { method: 'POST', body });
  return data.images[0];
}

export function ProductDescriptionEditor({ initialValue, onChange }) {
  const initialContent = useMemo(() => parseDescription(initialValue), [initialValue]);
  const editor = useCreateBlockNote({ initialContent, uploadFile: uploadEditorFile });

  return (
    <div className="blocknote-shell">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => onChange(JSON.stringify(editor.document))}
      />
    </div>
  );
}

export function ProductDescriptionViewer({ value }) {
  const initialContent = useMemo(() => parseDescription(value), [value]);
  const editor = useCreateBlockNote({ initialContent }, [value]);

  return (
    <div className="product-description-viewer">
      <BlockNoteView editor={editor} editable={false} theme="light" />
    </div>
  );
}
