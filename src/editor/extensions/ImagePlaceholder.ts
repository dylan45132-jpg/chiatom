import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ImagePlaceholderView from './ImagePlaceholderView.tsx'

export const ImagePlaceholder = Node.create({
  name: 'imagePlaceholder',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src:      { default: null },
      alt:      { default: '' },
      filePath: { default: '' },
      width: { default: 100 },
    }
  },

  parseHTML() {
    return [{ tag: 'image-placeholder' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    // 匯出時：有圖片就輸出 <img>，否則輸出佔位
    if (HTMLAttributes.src) {
      const { attrs } = node
      return ['img', mergeAttributes({ alt: HTMLAttributes.alt ?? '' }, { src: HTMLAttributes.src, style: `width: ${attrs.width}%` })]
    }
    return ['div', mergeAttributes(HTMLAttributes, { class: 'image-placeholder-export' }), '[圖片]']
  },

  addCommands() {
    return {
      insertImagePlaceholder: () => ({ commands }: { commands: any }) => {
        return commands.insertContent({ type: this.name, attrs: {} })
      },
    } as any
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImagePlaceholderView)
  },
})