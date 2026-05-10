import { useDocumentStore } from '../store/documentStore'
import PageEditor from './PageEditor'

export default function Canvas() {
  const { document, activePageId } = useDocumentStore()
  const activePage = document.pages.find(p => p.id === activePageId)
  const themeCSS = document.theme.css

  return (
    <div className="canvas">
      {themeCSS && (
        <style>{themeCSS}</style>
      )}
      <div className="canvas-scroll">
        {activePage ? (
          <PageEditor key={activePage.id} page={activePage} />
        ) : (
          <div className="canvas-empty-state">
            <div className="canvas-empty-content">
              <h2 className="canvas-empty-title">開始製作講義</h2>
              <p className="canvas-empty-desc">
                在左側面板點擊「＋」新增頁面，<br />
                或開啟現有的 .handout 檔案。
              </p>
              <div className="canvas-empty-steps">
                <div className="canvas-empty-step">
                  <span className="step-num">1</span>
                  <span>匯入或選擇主題</span>
                </div>
                <div className="canvas-empty-step">
                  <span className="step-num">2</span>
                  <span>新增頁面</span>
                </div>
                <div className="canvas-empty-step">
                  <span className="step-num">3</span>
                  <span>打 / 插入區塊，開始編輯</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}