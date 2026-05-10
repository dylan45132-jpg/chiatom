import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { pickImageAsDataUrl } from '../../utils/tauriImage'
import { toast } from '../../store/toastStore'

export default function ImagePlaceholderView({ node, updateAttributes, selected }: NodeViewProps) {
  const hasSrc = !!node.attrs.src

  const handlePick = async () => {
    try {
      const result = await pickImageAsDataUrl()
      if (!result) return
      updateAttributes({ src: result.dataUrl, filePath: result.path })
    } catch {
      toast.error('圖片載入失敗')
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
            替換圖片
          </button>
        </div>
      ) : (
        <button
          className="image-placeholder-empty"
          onClick={handlePick}
          contentEditable={false}
        >
          <span className="image-placeholder-icon">🖼</span>
          <span>點擊上傳圖片</span>
        </button>
      )}
    </NodeViewWrapper>
  )
}