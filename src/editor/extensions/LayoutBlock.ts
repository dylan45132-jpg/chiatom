import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { LayoutBlockView } from './LayoutBlockView'

export const LayoutBlock = Node.create({
  name: 'layoutBlock',
  group: 'block',
  content: 'columnSlot+',

  addAttributes() {
    return {
      key: { default: '' },
      columns: { default: '1fr 1fr' },  // CSS grid-template-columns
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="layout-block"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      {
        ...HTMLAttributes,
        'data-type': 'layout-block',
        'data-key': node.attrs.key,
        style: `display: grid; grid-template-columns: ${node.attrs.columns}; gap: 24px;`,
      },
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(LayoutBlockView)
  },
})