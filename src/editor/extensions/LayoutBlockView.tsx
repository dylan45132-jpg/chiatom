import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { NodeViewProps } from '@tiptap/react'
import { useCallback, useRef } from 'react'

export function LayoutBlockView({ node, updateAttributes }: NodeViewProps) {
  const columns = node.attrs.columns ?? '1fr 1fr'
  const layoutKey = node.attrs.key ?? ''
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startRatio = useRef(0.5)

  // 從 columns 字串解析目前左欄比例
  const parseLeftRatio = (cols: string) => {
    const parts = cols.split(' ')
    if (parts.length !== 2) return 0.5
    const left = parseFloat(parts[0])
    const right = parseFloat(parts[1])
    return left / (left + right)
  }

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    startX.current = e.clientX
    startRatio.current = parseLeftRatio(node.attrs.columns ?? '1fr 1fr')

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const ratio = Math.min(0.8, Math.max(0.2, (e.clientX - rect.left) / rect.width))
      const left = Math.round(ratio * 100)
      const right = 100 - left
      updateAttributes({ columns: `${left}fr ${right}fr` })
    }

    const onMouseUp = () => {
      isResizing.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [node.attrs.columns, updateAttributes])

  // 計算 drag handle 的左側位置
  const leftRatio = parseLeftRatio(columns)
  const handleLeft = `calc(${leftRatio * 100}% - 6px)`

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      data-type="layout-block"
      data-key={layoutKey}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: columns,
        gap: '0',
        whiteSpace: 'normal',
      }}
    >
      <div
        className="layout-resize-handle"
        contentEditable={false}
        style={{ left: handleLeft }}
        onMouseDown={handleResizeStart}
      />
      <NodeViewContent />
    </NodeViewWrapper>
  )
}