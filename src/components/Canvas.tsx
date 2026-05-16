import { useState, useCallback, useEffect, useRef } from 'react'
import { useDocumentStore } from '../store/documentStore'
import PageEditor from './PageEditor'
import { useLangStore } from '../store/langStore'

const PAGE_W = 1280
const PAGE_H = 720

export default function Canvas() {
  const { t } = useLangStore()
  const { document, activePageId, setActivePage } = useDocumentStore()
  const themeCSS = document.theme.css
  const pages = document.pages

  const [scale, setScale] = useState(1)
  const isPresentation = document.mode === 'presentation'
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrollRef = useRef<HTMLDivElement>(null)
  const isScrollingTo = useRef(false)
  const isEditing = useRef(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Ctrl + 滾輪縮放
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    setScale(prev => {
      const delta = e.deltaY < 0 ? 0.1 : -0.1
      return Math.min(1.5, Math.max(0.5, Math.round((prev + delta) * 10) / 10))
    })
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    const el = canvasRef.current
    const compute = () => {
      const available = Math.max(0, el.clientWidth - 48)
      const fitted = Math.min(1.5, Math.max(0.5, available / PAGE_W))
      setScale(Math.round(fitted * 10) / 10)
    }
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    compute()
    return () => ro.disconnect()
  }, [isPresentation])

  // 點 sidebar 時捲到該頁
  useEffect(() => {
    if (!activePageId) return
    const el = pageRefs.current.get(activePageId)
    if (!el) return
    isScrollingTo.current = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => { isScrollingTo.current = false }, 600)
  }, [activePageId])

  // IntersectionObserver：捲動時更新 activePageId
  useEffect(() => {
    if (pages.length === 0) return
    const observers: IntersectionObserver[] = []

    pages.forEach(page => {
      const el = pageRefs.current.get(page.id)
      if (!el) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (isScrollingTo.current || isEditing.current) return
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActivePage(page.id)
            }
          })
        },
        { threshold: 0.1, root: scrollRef.current }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [pages, setActivePage])

  return (
    <div className="canvas" onWheel={handleWheel} ref={canvasRef} onFocusCapture={() => { isEditing.current = true }} onBlurCapture={() => { isEditing.current = false }}>
      {themeCSS && <style>{themeCSS}</style>}
      {scale !== 1 && (
        <div className="canvas-scale-indicator">
          {Math.round(scale * 100)}%
        </div>
      )}
      <div className="canvas-scroll" ref={scrollRef}>
        {pages.length > 0 ? (
          pages.map(page => {
            const slotW = isPresentation ? PAGE_W * scale : 794
            return (
              <div
                key={page.id}
                ref={el => {
                  if (el) pageRefs.current.set(page.id, el)
                  else pageRefs.current.delete(page.id)
                }}
                style={{
                  position: 'relative',
                  width: slotW,
                  height: isPresentation ? PAGE_H * scale : undefined,
                  minHeight: isPresentation ? PAGE_H * scale : undefined,
                  flexShrink: 0,
                  marginBottom: 24,
                }}
              >
                <div style={isPresentation ? {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: PAGE_W,
                  height: PAGE_H,
                  transformOrigin: 'top left',
                  transform: `scale(${scale})`,
                } : undefined}>
                  <PageEditor page={page} />
                </div>
              </div>
            )
          })
        ) : (
          <div className="canvas-empty-state">
            <div className="canvas-empty-content">
              <h2 className="canvas-empty-title">{t.onboardingTitle}</h2>
              <p className="canvas-empty-desc">{t.onboardingOr}</p>
              <div className="canvas-empty-steps">
                <div className="canvas-empty-step">
                  <span className="step-num">1</span>
                  <span>{t.onboardingStep1}</span>
                </div>
                <div className="canvas-empty-step">
                  <span className="step-num">2</span>
                  <span>{t.onboardingStep2}</span>
                </div>
                <div className="canvas-empty-step">
                  <span className="step-num">3</span>
                  <span>{t.onboardingStep3}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
