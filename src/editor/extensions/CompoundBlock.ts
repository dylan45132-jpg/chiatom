import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CompoundBlockView from './CompoundBlockView.tsx'

export const CompoundBlock = Node.create({
  name: 'compoundBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      key:   { default: '' },
      class: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="compound-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'compound-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CompoundBlockView)
  },
})