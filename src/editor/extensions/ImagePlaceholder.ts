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
      width:    { default: 100 },
      align: { default: 'left' },
    }
  },

  parseHTML() {
    return [
      { tag: 'image-placeholder' },
      { tag: 'img[data-image-placeholder]' },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    // 匯出和 clipboard 序列化：輸出帶識別 attribute 的 img
    if (HTMLAttributes.src) {
      return ['img', mergeAttributes(
        { alt: HTMLAttributes.alt ?? '' },
        {
          'data-image-placeholder': '',
          'data-file-path': HTMLAttributes.filePath ?? '',
          'data-width': HTMLAttributes.width ?? 100,
          src: HTMLAttributes.src,
          style: `width: ${node.attrs.width}%`,
        }
      )]
    }
    return ['image-placeholder', mergeAttributes(HTMLAttributes, { class: 'image-placeholder-export' }), '[圖片]']
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