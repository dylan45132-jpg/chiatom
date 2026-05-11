import { useState, useCallback, useEffect, useRef } from 'react'
import { useDocumentStore } from '../store/documentStore'
import PageEditor from './PageEditor'
import { useLangStore } from '../store/langStore'

const SCALE_MIN = 0.5
const SCALE_MAX = 1.5
const SCALE_STEP = 0.1

export default function Canvas() {
  const { t } = useLangStore()
  const { document, activePageId, setActivePage } = useDocumentStore()
  const themeCSS = document.theme.css
  const pages = document.pages

  const [scale, setScale] = useState(1)
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrollRef = useRef<HTMLDivElement>(null)
  const isScrollingTo = useRef(false)

  // Ctrl + 滾輪縮放
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    setScale(prev => {
      const delta = e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP
      return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round((prev + delta) * 10) / 10))
    })
  }, [])

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
          if (isScrollingTo.current) return
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActivePage(page.id)
            }
          })
        },
        { threshold: 0.3, root: scrollRef.current }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [pages, setActivePage])

  return (
    <div className="canvas" onWheel={handleWheel}>
      {themeCSS && <style>{themeCSS}</style>}
      {scale !== 1 && (
        <div className="canvas-scale-indicator">
          {Math.round(scale * 100)}%
        </div>
      )}
      <div className="canvas-scroll" ref={scrollRef}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.1s ease' }}>
          {pages.length > 0 ? (
            pages.map(page => (
              <div
                key={page.id}
                ref={el => {
                  if (el) pageRefs.current.set(page.id, el)
                  else pageRefs.current.delete(page.id)
                }}
              >
                <PageEditor page={page} />
              </div>
            ))
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
    </div>
  )
}
