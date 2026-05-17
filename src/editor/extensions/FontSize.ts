import { Mark } from '@tiptap/core'

export const FontSize = Mark.create({
  name: 'fontSize',

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: el => el.style.fontSize || null,
        renderHTML: attrs => {
          if (!attrs.size) return {}
          return { style: `font-size: ${attrs.size}` }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: el => {
          const size = (el as HTMLElement).style.fontSize
          return size ? { size } : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },

  addCommands() {
  return {
    setFontSize:
      (size: string) =>
      ({ chain }: { chain: () => any }) => {
        return chain().setMark('fontSize', { size }).run()
      },
    unsetFontSize:
      () =>
      ({ chain }: { chain: () => any }) => {
        return chain().unsetMark('fontSize').run()
      },
  } as any
},
})