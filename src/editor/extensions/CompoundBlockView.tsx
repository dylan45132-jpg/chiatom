import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { useDocumentStore } from '../../store/documentStore'
import { useLangStore } from '../../store/langStore'

export default function CompoundBlockView({ node, selected }: NodeViewProps) {
  const { t } = useLangStore()
  const { document } = useDocumentStore()
  const blocks = document.theme.json.blocks ?? []
  const def = blocks.find(b => b.key === node.attrs.key)

  const className = def?.class ?? node.attrs.class ?? ''
  const isUnknown = !def

  return (
    <NodeViewWrapper
      className={`compound-block-node ${selected ? 'is-selected' : ''} ${isUnknown ? 'compound-block-unknown' : ''}`}
    >
      {isUnknown && (
        <div className="compound-block-warning" contentEditable={false}>
          {t.compoundFallback} ({node.attrs.key})
        </div>
      )}
      <div className={className}>
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}
