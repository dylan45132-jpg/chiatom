import { useNavigationStore } from '../store/navigationStore'
import type { LibraryPageEntry } from '../utils/libraryIndex'
import { useState, useEffect } from 'react'
import { readProjects } from '../store/projects'
import { getSettings } from '../store/settingsStore'
import { loadHandoutFromPath } from '../utils/handoutPackage'
import { useDocumentStore } from '../store/documentStore'

interface Props {
  entry: LibraryPageEntry
}

export default function LibraryPageDetail({ entry }: Props) {
  const { navigate } = useNavigationStore()

  const [projectNames, setProjectNames] = useState<Record<string, string>>({})
      
  useEffect(() => {
    const { workspacePath } = getSettings()
    if (!workspacePath || entry.projectIds.length === 0) return
    readProjects(workspacePath).then((projects) => {
      const map: Record<string, string> = {}
      for (const p of projects) map[p.id] = p.name
      setProjectNames(map)
    })
  }, [entry.projectIds])

  async function openPage(docId: string, pageId: string) {
    const { savePath: currentSavePath } = useDocumentStore.getState()
    // 如果目標文件與當前開啟的文件不同，先載入
    if (currentSavePath !== docId) {
      try {
        const result = await loadHandoutFromPath(docId)
        if (result) {
          useDocumentStore.getState().loadFromDocument(result.doc, docId)
        }
      } catch {
        // 載入失敗則直接導航
      }
    }
    navigate({ view: 'editor', savePath: docId, pageId })
    if (pageId) {
      useDocumentStore.getState().setActivePage(pageId)
    }
  }

  return (
    <div className='library-detail-panel'>
      <div className='library-detail-page-title'>{entry.pageTitle || '（未命名）'}</div>

      {/* 所在文件 */}
      <section className='library-detail-section'>
        <div className='library-detail-label'>所在文件</div>
        <button
          className='library-detail-link'
          onClick={() => openPage(entry.docId, entry.pageId)}
        >
          {entry.docTitle}
        </button>
      </section>

      {/* 所屬專案 */}
      {entry.projectIds.length > 0 && (
        <section className='library-detail-section'>
          <div className='library-detail-label'>所屬專案</div>
          <div className='library-detail-list'>
            {entry.projectIds.map((id) => (
              <span key={id} className='library-detail-tag'>{projectNames[id] ?? id}</span>
            ))}
          </div>
        </section>
      )}

      {/* 被引用 */}
      {(entry.referencedBy?.length ?? 0) > 0 && (
        <section className='library-detail-section'>
          <div className='library-detail-label'>被引用</div>
          <div className='library-detail-list'>
            {entry.referencedBy.map((ref) => (
              <button
                key={ref.docId + '::' + ref.pageId}
                className='library-detail-ref'
                onClick={() => openPage(ref.docId, ref.pageId)}
              >
                <span className='library-detail-ref-page'>{ref.pageTitle || ref.docTitle || '（未命名）'}</span>
                <span className='library-detail-ref-doc'>{ref.docTitle}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 引用 */}
      {(entry.references?.length ?? 0) > 0 && (
        <section className='library-detail-section'>
          <div className='library-detail-label'>引用</div>
          <div className='library-detail-list'>
            {entry.references.map((ref) => (
              <button
                key={ref.docId + '::' + ref.pageId}
                className='library-detail-ref'
                onClick={() => openPage(ref.docId, ref.pageId)}
              >
                <span className='library-detail-ref-page'>{ref.pageTitle || ref.docTitle || '（未命名）'}</span>
                <span className='library-detail-ref-doc'>{ref.docTitle}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}