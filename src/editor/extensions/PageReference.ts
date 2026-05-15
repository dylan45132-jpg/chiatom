import { Node, mergeAttributes } from '@tiptap/core'
import { useNavigationStore } from '../../store/navigationStore'
import { useDocumentStore } from '../../store/documentStore'
import { loadHandoutFromPath } from '../../utils/handoutPackage'

export interface PageReferenceAttrs {
  docId: string
  pageId: string
  label: string
}

export const PageReference = Node.create({
  name: 'pageReference',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      docId: { default: '' },
      pageId: { default: '' },
      label: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-page-reference]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-page-reference': '',
      class: 'page-reference',
    }), HTMLAttributes.label ?? '']
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span')
      dom.className = 'page-reference'
      dom.setAttribute('data-page-reference', '')
      dom.setAttribute('data-doc-id', node.attrs.docId)
      dom.setAttribute('data-page-id', node.attrs.pageId)
      dom.textContent = node.attrs.label
      dom.style.cursor = 'pointer'

      dom.addEventListener('click', async () => {
        const { docId, pageId } = node.attrs
        try {
          const navStore = useNavigationStore.getState()
          const docStore = useDocumentStore.getState()
          const currentSavePath = docStore.savePath
          const currentPageId = docStore.activePageId

          const result = await loadHandoutFromPath(docId)
          if (result) {
            docStore.loadFromDocument(result.doc, docId)
            const targetPageId = pageId || result.doc.pages[0]?.id || ''
            docStore.setActivePage(targetPageId)
            navStore.navigate({
              view: 'editor',
              savePath: docId,
              pageId,
            })
            const prevEntry = { view: 'editor' as const, savePath: currentSavePath ?? undefined, pageId: currentPageId ?? undefined }
            useNavigationStore.setState(state => ({
              history: [...state.history.slice(0, -1), prevEntry],
            }))
          }
        } catch (e) {
          console.error('PageReference click failed:', e)
        }
      })

      return { dom }
    }
  },
})