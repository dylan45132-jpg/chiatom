import { useState, useEffect } from 'react'
import katex from 'katex'

interface MathModalProps {
  isOpen: boolean
  initialLatex: string
  mode: 'inline' | 'block'
  onConfirm: (latex: string) => void
  onClose: () => void
}

const SNIPPETS = [
  { label: '分數', latex: '\\frac{a}{b}' },
  { label: '根號', latex: '\\sqrt{x}' },
  { label: '次方', latex: 'x^{n}' },
  { label: '下標', latex: 'x_{n}' },
  { label: '積分', latex: '\\int_{a}^{b} f(x)\\,dx' },
  { label: '極限', latex: '\\lim_{x \\to 0}' },
  { label: '求和', latex: '\\sum_{i=1}^{n}' },
  { label: '希臘字母', latex: '\\alpha \\beta \\gamma' },
  { label: '矩陣', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
]

export function MathModal({ isOpen, initialLatex, mode, onConfirm, onClose }: MathModalProps) {
  const [latex, setLatex] = useState(initialLatex)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

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
      setError(e.message || '語法錯誤')
    }
  }, [latex, mode])

  if (!isOpen) return null

  return (
    <div className="math-modal-overlay" onClick={onClose}>
      <div className="math-modal" onClick={e => e.stopPropagation()}>
        <div className="math-modal-header">
          <span className="math-modal-title">
            {mode === 'inline' ? '行內方程式' : '區塊方程式'}
          </span>
          <button className="math-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="math-modal-body">
          {/* 預覽區 */}
          <div className="math-preview-label">預覽</div>
          <div className="math-preview">
            {preview
              ? <span dangerouslySetInnerHTML={{ __html: preview }} />
              : <span className="math-preview-empty">{error || '輸入 LaTeX 查看預覽'}</span>
            }
          </div>

          {/* 輸入區 */}
          <div className="math-input-label">LaTeX</div>
          <textarea
            className="math-input"
            value={latex}
            onChange={e => setLatex(e.target.value)}
            rows={3}
            placeholder="輸入 LaTeX，例如：E=mc^2"
            autoFocus
            spellCheck={false}
          />

          {/* 常用語法 */}
          <div className="math-snippets-label">常用語法</div>
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
          <button className="math-btn-cancel" onClick={onClose}>取消</button>
          <button
            className="math-btn-confirm"
            onClick={() => { if (!error) onConfirm(latex) }}
            disabled={!!error}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  )
}