import { useState, useCallback, useEffect, useRef } from 'react'
import { useDocumentStore } from '../store/documentStore'
import PageEditor from './PageEditor'
import { useLangStore } from '../store/langStore'

const PAGE_W = 1280
const PAGE_H = 720
const NOTE_W = 794
const NOTE_H = 1123

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

  const [offsetX, setOffsetX] = useState(0)

  // Ctrl + 滾輪縮放
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    setScale(prev => {
      const delta = e.deltaY < 0 ? 0.1 : -0.1
      return Math.min(1.5, Math.max(0.5, Math.round((prev + delta) * 10) / 10))
    })
  }, [])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

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
    const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
    const observers: IntersectionObserver[] = []

    pages.forEach(page => {
      const el = pageRefs.current.get(page.id)
      if (!el) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (isScrollingTo.current || isEditing.current) return
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (debounceTimers.has(page.id)) clearTimeout(debounceTimers.get(page.id)!)
              const timer = setTimeout(() => {
                setActivePage(page.id)
                debounceTimers.delete(page.id)
              }, 80)
              debounceTimers.set(page.id, timer)
            } else {
              if (debounceTimers.has(page.id)) {
                clearTimeout(debounceTimers.get(page.id)!)
                debounceTimers.delete(page.id)
              }
            }
          })
        },
        { threshold: 0.5, root: scrollRef.current }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => {
      observers.forEach(o => o.disconnect())
      debounceTimers.forEach(t => clearTimeout(t))
    }
  }, [pages, setActivePage])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    
    const update = () => {
      const containerW = el.clientWidth
      const offset = Math.max(0, (containerW - NOTE_W) / 2)
      setOffsetX(offset)
    }
    
    // 監聽 transition 結束後再更新（處理 Sidebar 動畫）
    const onTransitionEnd = () => update()
    
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener('transitionend', onTransitionEnd)
    
    return () => {
      ro.disconnect()
      el.removeEventListener('transitionend', onTransitionEnd)
    }
  }, [])

  return (
    <div className="canvas" ref={canvasRef} onFocusCapture={() => { isEditing.current = true }} onBlurCapture={() => { isEditing.current = false }}>
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
            return isPresentation ? (
              <div
                key={page.id}
                ref={el => {
                  if (el) pageRefs.current.set(page.id, el)
                  else pageRefs.current.delete(page.id)
                }}
                style={{
                  position: 'relative',
                  width: slotW,
                  height: PAGE_H * scale,
                  minHeight: PAGE_H * scale,
                  flexShrink: 0,
                  marginBottom: 24,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: PAGE_W,
                  height: PAGE_H,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}>
                  <PageEditor page={page} />
                </div>
              </div>
            ) : (
              <div
                key={page.id}
                ref={el => {
                  if (el) pageRefs.current.set(page.id, el)
                  else pageRefs.current.delete(page.id)
                }}
                style={{
                  width: NOTE_W,
                  height: NOTE_H * scale,
                  marginLeft: offsetX,
                  marginBottom: 'var(--ui-spacing-lg)',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: NOTE_W,
                  height: NOTE_H,
                  transform: `scale(${scale})`,
                  transformOrigin: `${NOTE_W / 2}px top`,
                }}>
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
