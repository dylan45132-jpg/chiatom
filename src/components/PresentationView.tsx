import { useEffect, useState, useCallback } from 'react'
import { useNavigationStore } from '../store/navigationStore'
import { useDocumentStore } from '../store/documentStore'
import { exportPageHtml } from '../editor/renderer'
import { getCurrentWindow } from '@tauri-apps/api/window'

const SLIDE_W = 1280
const SLIDE_H = 720


export default function PresentationView() {
  const { goBack } = useNavigationStore()
  const { document } = useDocumentStore()
  const pages = document?.pages ?? []
  const theme = document?.theme
  const mode = document?.mode

  const [currentIndex, setCurrentIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [visible, setVisible] = useState(false)

  const currentPage = pages[currentIndex]
  const html = currentPage
    ? exportPageHtml(currentPage, theme!, mode as 'handout' | 'presentation')
    : ''


  // 單螢幕模式：進入全螢幕
  useEffect(() => {
    getCurrentWindow().setFullscreen(true)
    const updateScale = () => {
      const scaleX = window.innerWidth / SLIDE_W
      const scaleY = window.innerHeight / SLIDE_H
      setScale(Math.min(scaleX, scaleY))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    const t = setTimeout(() => setVisible(true), 100)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', updateScale)
      getCurrentWindow().setFullscreen(false)
    }
  }, [])

  const handleExit = useCallback(() => {
    setVisible(false)
    getCurrentWindow().setFullscreen(false)
    setTimeout(() => goBack(), 150)
  }, [goBack])

  const nextSlide = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, pages.length - 1))
  }, [pages.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0))
  }, [])

  // 鍵盤事件（單螢幕模式）
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevSlide()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleExit()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [nextSlide, prevSlide, handleExit])


  // 單螢幕放映模式
  return (
    <div
      onClick={(e) => {
        if (e.clientX > window.innerWidth / 2) nextSlide()
        else prevSlide()
      }}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s ease',
        cursor: 'pointer',
      }}
    >
      <iframe
        srcDoc={html}
        style={{
          width: `${SLIDE_W}px`,
          height: `${SLIDE_H}px`,
          border: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
        sandbox="allow-same-origin"
      />
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '24px',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}>
        {currentIndex + 1} / {pages.length}
      </div>
      {currentIndex === 0 && (
        <div style={{
          position: 'fixed',
          bottom: '48px',
          left: '24px',
          color: 'rgba(0,0,0,0.75)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}>
          ◀ 第一頁
        </div>
      )}
      {currentIndex === pages.length - 1 && (
        <div style={{
          position: 'fixed',
          bottom: '48px',
          left: '24px',
          color: 'rgba(0,0,0,0.75)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}>
          最後一頁 ▶
        </div>
      )}
    </div>
  )
}