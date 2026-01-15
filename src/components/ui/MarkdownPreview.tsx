'use client'

import dynamic from 'next/dynamic'
import '@uiw/react-markdown-preview/markdown.css'

const MDPreview = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false })

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content) {
    return <p className="text-slate-500 italic">No content</p>
  }

  return (
    <div data-color-mode="dark" className={className}>
      <MDPreview
        source={content}
        style={{
          backgroundColor: 'transparent',
          padding: 0,
        }}
      />
    </div>
  )
}
