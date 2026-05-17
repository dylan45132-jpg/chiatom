import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { NodeViewProps } from '@tiptap/react'

export function ColumnSlotView({ node }: NodeViewProps) {
  const verticalAlign = node.attrs.verticalAlign ?? 'top'

  const justifyContent =
    verticalAlign === 'center' ? 'center' :
    verticalAlign === 'bottom' ? 'flex-end' :
    'flex-start'

  return (
    <NodeViewWrapper
      data-type="column-slot"
      style={{
        whiteSpace: 'normal',
        display: 'flex',
        flexDirection: 'column',
        justifyContent,
      }}
    >
      <NodeViewContent className="column-slot-content" />
    </NodeViewWrapper>
  )
}