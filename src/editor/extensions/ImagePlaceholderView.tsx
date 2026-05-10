import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { pickImageAsDataUrl } from '../../utils/tauriImage'
import { toast } from '../../store/toastStore'
import { useLangStore } from '../../store/langStore'

export default function ImagePlaceholderView({ node, updateAttributes, selected }: NodeViewProps) {
  const { t } = useLangStore()
  const hasSrc = !!node.attrs.src

  const handlePick = async () => {
    try {
      const result = await pickImageAsDataUrl()
      if (!result) return
      updateAttributes({ src: result.dataUrl, filePath: result.path })
    } catch {
      toast.error(t.toastImageFailed)
    }
  }

  return (
    <NodeViewWrapper
      className={`image-placeholder-node ${selected ? 'is-selected' : ''}`}
      data-drag-handle
    >
      {hasSrc ? (
        <div className="image-placeholder-loaded">
          <img src={node.attrs.src} alt={node.attrs.alt ?? ''} />
          <button
            className="image-placeholder-replace"
            onClick={handlePick}
            contentEditable={false}
          >
            {t.replaceImage}
          </button>
        </div>
      ) : (
        <button
          className="image-placeholder-empty"
          onClick={handlePick}
          contentEditable={false}
        >
          <span className="image-placeholder-icon">🖼</span>
          <span>{t.uploadImage}</span>
        </button>
      )}
    </NodeViewWrapper>
  )
}
