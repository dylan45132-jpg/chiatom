import { useEffect, useState } from 'react'
import { useToastStore } from '../store/toastStore'

export default function Toast() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

// ── 單一 Toast 項目 ──────────────────────

interface ToastItemProps {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

function ToastItem({ message, type, onClose }: ToastItemProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 進場動畫
    requestAnimationFrame(() => setVisible(true))

    // 3 秒後退場
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 200) // 等退場動畫完成再移除
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`toast-item toast-${type} ${visible ? 'toast-visible' : ''}`}>
      <span className="toast-dot" />
      <span className="toast-message">{message}</span>
    </div>
  )
}