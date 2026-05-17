import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ColumnSlotView } from './ColumnSlotView'

export const ColumnSlot = Node.create({
  name: 'columnSlot',

  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      verticalAlign: { default: 'top' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column-slot"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-type': 'column-slot' }, 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnSlotView)
  },
})