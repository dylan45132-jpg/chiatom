import { useEffect } from 'react'
import './styles/tokens.css'
import './styles/base.css'
import './styles/editor.css'

import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import Toast from './components/Toast'
import { useDocumentStore } from './store/documentStore'

export default function App() {
  const { document, activePageId, setActivePage } = useDocumentStore()

  // 初始化：確保 activePageId 有值
  useEffect(() => {
    if (!activePageId && document.pages.length > 0) {
      setActivePage(document.pages[0].id)
    }
  }, [])

  return (
    <div className="app-shell">
      <Toolbar />
      <div className="app-body">
        <Sidebar />
        <Canvas />
      </div>
      <Toast />
    </div>
  )
}