import { useState, useEffect, useMemo } from 'react'
import { useNavigationStore } from '../store/navigationStore'
import { loadLibraryIndex } from '../utils/libraryIndex'
import { getSettings } from '../store/settingsStore'
import type { LibraryIndex, LibraryPageEntry } from '../utils/libraryIndex'
import LibraryPageDetail from './LibraryPageDetail'

interface GroupedDoc {
  docId: string
  docTitle: string
  pages: LibraryPageEntry[]
  isReferencedByOthers?: boolean
}

interface LibraryPageProps {
  strings: {
    library: string
    librarySearch: string
    libraryEmpty: string
    libraryNoResults: string
    back: string
  }
}

export default function LibraryPage({ strings }: LibraryPageProps) {
  const { goBack } = useNavigationStore()
  const [index, setIndex] = useState<LibraryIndex | null>(null)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [selectedEntry, setSelectedEntry] = useState<LibraryPageEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { workspacePath } = getSettings()
    if (!workspacePath) { setLoading(false); return }
    loadLibraryIndex(workspacePath).then((idx) => {
      setIndex(idx)
      setLoading(false)
    })
  }, [])

  const grouped = useMemo((): GroupedDoc[] => {
    if (!index) return []
    const map = new Map<string, GroupedDoc>()
    for (const entry of Object.values(index.entries)) {
      // 跳過文件層級 entry（pageId 為空字串）
      if (entry.pageId === '') continue
      if (!map.has(entry.docId)) {
        map.set(entry.docId, { docId: entry.docId, docTitle: entry.docTitle, pages: [] })
      }
      map.get(entry.docId)!.pages.push(entry)
    }
    return Array.from(map.values())
      .map((doc) => {
        const docEntry = index?.entries[doc.docId + '::']
        return { ...doc, isReferencedByOthers: (docEntry?.referencedBy?.length ?? 0) > 0 }
      })
      .sort((a, b) => a.docTitle.localeCompare(b.docTitle))
  }, [index])

  const searchResults = useMemo((): LibraryPageEntry[] => {
    if (!searchQuery.trim() || !index) return []
    const q = searchQuery.toLowerCase()
    const results: Array<{ entry: LibraryPageEntry; score: number }> = []
    for (const entry of Object.values(index.entries)) {
      if (entry.pageId === '') continue
      const titleMatch = entry.pageTitle.toLowerCase().includes(q)
      const previewMatch = entry.preview.toLowerCase().includes(q)
      if (titleMatch || previewMatch) {
        results.push({ entry, score: titleMatch ? 1 : 0 })
      }
    }
    return results
      .sort((a, b) => b.score - a.score)
      .map((r) => r.entry)
  }, [searchQuery, index])

  const isSearching = searchQuery.trim().length > 0

  function toggleDoc(docId: string) {
    setExpandedDocs((prev) => {
      const next = new Set(prev)
      next.has(docId) ? next.delete(docId) : next.add(docId)
      return next
    })
  }

  function handleSelectEntry(entry: LibraryPageEntry) {
    setSelectedEntry(entry)
  }

  function highlight(text: string, query: string): string {
    if (!query) return text
    const q = query.toLowerCase()
    let result = ''
    let remaining = text
    let lowerRemaining = remaining.toLowerCase()
    let idx = lowerRemaining.indexOf(q)
    while (idx !== -1) {
      result += remaining.slice(0, idx)
      result += '<mark>' + remaining.slice(idx, idx + q.length) + '</mark>'
      remaining = remaining.slice(idx + q.length)
      lowerRemaining = remaining.toLowerCase()
      idx = lowerRemaining.indexOf(q)
    }
    result += remaining
    return result
  }

  return (
    <div className='library-root'>
      {/* 頂部 header */}
      <div className='library-header'>
        <button className='library-back-btn' onClick={goBack}>←</button>
        <span className='library-title'>{strings.library}</span>
        <input
          className='library-search'
          placeholder={strings.librarySearch}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 主體：左側列表 + 右側詳情 */}
      <div className='library-body'>
        <div className='library-list'>
          {loading && (
            <div className='library-empty'>…</div>
          )}

          {/* 搜尋結果模式 */}
          {!loading && isSearching && searchResults.length === 0 && (
            <div className='library-empty'>{strings.libraryNoResults}</div>
          )}
          {!loading && isSearching && searchResults.map((entry) => (
            <div
              key={entry.docId + '::' + entry.pageId}
              className={'library-search-result' + (selectedEntry?.pageId === entry.pageId && selectedEntry?.docId === entry.docId ? ' active' : '')}
              onClick={() => handleSelectEntry(entry)}
            >
              <div
                className='library-result-title'
                dangerouslySetInnerHTML={{ __html: highlight(entry.pageTitle, searchQuery) }}
              />
              <div className='library-result-doc'>{entry.docTitle}</div>
              {entry.preview && (
                <div
                  className='library-result-preview'
                  dangerouslySetInnerHTML={{ __html: highlight(entry.preview, searchQuery) }}
                />
              )}
            </div>
          ))}

          {/* 文件列表模式 */}
          {!loading && !isSearching && grouped.length === 0 && (
            <div className='library-empty'>{strings.libraryEmpty}</div>
          )}
          {!loading && !isSearching && grouped.map((doc) => (
            <div key={doc.docId} className='library-doc-group'>
              <div
                className={'library-doc-row' + (expandedDocs.has(doc.docId) ? ' expanded' : '')}
                onClick={() => toggleDoc(doc.docId)}
              >
                <span className='library-doc-chevron'>{expandedDocs.has(doc.docId) ? '▾' : '▸'}</span>
                <span className='library-doc-title'>{doc.docTitle}</span>
                {doc.isReferencedByOthers && (
                  <span
                    className='library-doc-ref-badge'
                    onClick={(e) => {
                      e.stopPropagation()
                      const docEntry = index?.entries[doc.docId + '::']
                      if (docEntry) handleSelectEntry(docEntry)
                    }}
                  >
                    被引用
                  </span>
                )}
                <span className='library-doc-count'>{doc.pages.length}</span>
              </div>
              {expandedDocs.has(doc.docId) && (
                <div className='library-pages'>
                  {doc.pages.map((entry) => (
                    <div
                      key={entry.pageId}
                      className={'library-page-row' + (selectedEntry?.pageId === entry.pageId && selectedEntry?.docId === entry.docId ? ' active' : '')}
                      onClick={() => handleSelectEntry(entry)}
                    >
                      <span className='library-page-title'>{entry.pageTitle || '（未命名）'}</span>
                      {entry.preview && (
                        <span className='library-page-preview'>{entry.preview}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 右側詳情面板 */}
        <div className='library-detail'>
          {selectedEntry ? (
            <LibraryPageDetail entry={selectedEntry} />
          ) : (
            <div className='library-detail-empty' />
          )}
        </div>
      </div>
    </div>
  )
}