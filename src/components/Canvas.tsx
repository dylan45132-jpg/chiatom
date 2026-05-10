import { useDocumentStore } from '../store/documentStore'
import PageEditor from './PageEditor'
import { useLangStore } from '../store/langStore'

export default function Canvas() {
  const { t } = useLangStore()
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
              <h2 className="canvas-empty-title">{t.onboardingTitle}</h2>
              <p className="canvas-empty-desc">
                {t.onboardingOr}
              </p>
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
