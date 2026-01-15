'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  preview?: 'edit' | 'live' | 'preview'
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  minHeight = 200,
  preview = 'live',
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        preview={preview}
        height={minHeight}
        textareaProps={{
          placeholder,
        }}
        previewOptions={{
          style: {
            backgroundColor: 'transparent',
          },
        }}
      />
    </div>
  )
}
