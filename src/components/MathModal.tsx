import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import katex from 'katex'
import { useLangStore } from '../store/langStore'

interface MathModalProps {
  isOpen: boolean
  initialLatex: string
  mode: 'inline' | 'block'
  clientX: number
  clientY: number
  onConfirm: (latex: string) => void
  onClose: () => void
}

export function MathModal({ isOpen, initialLatex, mode, clientX, clientY, onConfirm, onClose }: MathModalProps) {
  const { t } = useLangStore()
  const [latex, setLatex] = useState(initialLatex)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

  const [pos, setPos] = useState({
    x: Math.min(clientX, window.innerWidth - 440),
    y: Math.min(clientY + 12, window.innerHeight - 300),
  })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const SNIPPETS = [
    { label: t.mathSnippets.fraction, latex: '\\frac{a}{b}' },
    { label: t.mathSnippets.sqrt, latex: '\\sqrt{x}' },
    { label: t.mathSnippets.power, latex: 'x^{n}' },
    { label: t.mathSnippets.subscript, latex: 'x_{n}' },
    { label: t.mathSnippets.integral, latex: '\\int_{a}^{b} f(x)\\,dx' },
    { label: t.mathSnippets.limit, latex: '\\lim_{x \\to 0}' },
    { label: t.mathSnippets.sum, latex: '\\sum_{i=1}^{n}' },
    { label: t.mathSnippets.greek, latex: '\\alpha \\beta \\gamma' },
    { label: t.mathSnippets.matrix, latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  ]

  useEffect(() => {
    setLatex(initialLatex)
  }, [initialLatex, isOpen])

  useEffect(() => {
    try {
      const html = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: mode === 'block',
      })
      setPreview(html)
      setError('')
    } catch (e: any) {
      setPreview('')
      setError(e.message || 'Syntax error')
    }
  }, [latex, mode])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return
    setPos({
      x: Math.min(Math.max(0, e.clientX - dragOffset.current.x), window.innerWidth - 440),
      y: Math.min(Math.max(0, e.clientY - dragOffset.current.y), window.innerHeight - 100),
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    dragging.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  if (!isOpen) return null

  return createPortal(
    <div className="math-modal-overlay" onClick={onClose}>
      <div
        className="math-modal"
        style={{ position: 'fixed', left: pos.x, top: pos.y, transform: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="math-modal-header" onMouseDown={handleMouseDown} style={{ cursor: 'grab' }}>
          <span className="math-modal-title">
            {mode === 'inline' ? t.inlineEquation : t.blockEquation}
          </span>
          <button className="math-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="math-modal-body">
          {/* 預覽區 */}
          <div className="math-preview-label">{t.preview}</div>
          <div className="math-preview">
            {preview
              ? <span dangerouslySetInnerHTML={{ __html: preview }} />
              : <span className="math-preview-empty">{error || t.mathPreviewEmpty}</span>
            }
          </div>

          {/* 輸入區 */}
          <div className="math-input-label">{t.latex}</div>
          <textarea
            className="math-input"
            value={latex}
            onChange={e => setLatex(e.target.value)}
            rows={3}
            placeholder={t.mathPlaceholder}
            autoFocus
            spellCheck={false}
          />

          {/* 常用語法 */}
          <div className="math-snippets-label">{t.commonSyntax}</div>
          <div className="math-snippets">
            {SNIPPETS.map(s => (
              <button
                key={s.label}
                className="math-snippet-btn"
                onClick={() => setLatex(prev => prev + s.latex)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="math-modal-footer">
          <button className="math-btn-cancel" onClick={onClose}>{t.cancel}</button>
          <button
            className="math-btn-confirm"
            onClick={() => { if (!error) onConfirm(latex) }}
            disabled={!!error}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
