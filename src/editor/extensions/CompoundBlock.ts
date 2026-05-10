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
    return [{ tag: 'compound-block' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['compound-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CompoundBlockView)
  },
})