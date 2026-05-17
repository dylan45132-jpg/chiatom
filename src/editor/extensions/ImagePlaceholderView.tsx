import { useRef, useCallback } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { pickImageAsDataUrl } from '../../utils/tauriImage'
import { toast } from '../../store/toastStore'
import { useLangStore } from '../../store/langStore'

export default function ImagePlaceholderView({ node, updateAttributes, selected }: NodeViewProps) {
  const { t } = useLangStore()
  const hasSrc = !!node.attrs.src
  const containerRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handlePick = async () => {
    try {
      const result = await pickImageAsDataUrl()
      if (!result) return
      updateAttributes({ src: result.dataUrl, filePath: result.path })
    } catch {
      toast.error(t.toastImageFailed)
    }
  }

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = node.attrs.width ?? 100

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return
      const pageEl = containerRef.current.closest('.page') as HTMLElement
      if (!pageEl) return
      const pageWidth = pageEl.offsetWidth
      const delta = e.clientX - startX.current
      const deltaPercent = (delta / pageWidth) * 100
      const newWidth = Math.min(100, Math.max(10, startWidth.current + deltaPercent))
      updateAttributes({ width: Math.round(newWidth) })
    }

    const onMouseUp = () => {
      isResizing.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [node.attrs.width, updateAttributes])

  return (
    <NodeViewWrapper
      className={`image-placeholder-node ${selected ? 'is-selected' : ''}`}
      data-drag-handle
    >
      {hasSrc ? (
        <div
          className='image-placeholder-loaded'
          ref={containerRef}
          style={{
  width: `${node.attrs.width ?? 100}%`,
  marginLeft: node.attrs.align === 'right' || node.attrs.align === 'center' ? 'auto' : '0',
  marginRight: node.attrs.align === 'left' || node.attrs.align === 'center' ? 'auto' : '0',
}}
        >
          <img src={node.attrs.src} alt={node.attrs.alt ?? ''} style={{ width: '100%' }} />
          <button
            className='image-placeholder-replace'
            onClick={handlePick}
            contentEditable={false}
          >
            {t.replaceImage}
          </button>
          <div
            className='image-resize-handle'
            contentEditable={false}
            onMouseDown={handleResizeStart}
          />
        </div>
      ) : (
        <button
          className='image-placeholder-empty'
          onClick={handlePick}
          contentEditable={false}
        >
          <span className='image-placeholder-icon'>🖼</span>
          <span>{t.uploadImage}</span>
        </button>
      )}
    </NodeViewWrapper>
  )
}