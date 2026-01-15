'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import '@uiw/react-markdown-preview/markdown.css'

const MDPreview = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false })

interface MarkdownPreviewProps {
  content: string
  className?: string
}

// Image lightbox modal
function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Full size"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
      >
        ×
      </button>
    </div>
  )
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  if (!content) {
    return <p className="text-slate-500 italic">No content</p>
  }

  return (
    <>
      <div
        data-color-mode="dark"
        className={className}
        onClick={(e) => {
          // Check if clicked element is an image
          const target = e.target as HTMLElement
          if (target.tagName === 'IMG') {
            const img = target as HTMLImageElement
            setLightboxSrc(img.src)
          }
        }}
      >
        <MDPreview
          source={content}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
          }}
          components={{
            img: ({ src, alt, ...props }) => (
              <img
                src={src}
                alt={alt}
                {...props}
                className="cursor-pointer hover:opacity-80 transition-opacity max-w-full rounded"
                style={{ maxHeight: '400px' }}
              />
            ),
          }}
        />
      </div>
      {lightboxSrc && (
        <ImageModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  )
}
