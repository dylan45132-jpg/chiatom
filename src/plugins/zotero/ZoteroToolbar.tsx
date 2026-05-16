import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getZoteroMeta, setZoteroMeta, clearZoteroMeta, searchZotero, ZoteroMeta } from './zoteroStore'
import { useDocumentStore } from '../../store/documentStore'
import { useLangStore } from '../../store/langStore'

export default function ZoteroToolbar() {
  const doc = useDocumentStore(state => state.document)
  const [meta, setMeta] = useState<ZoteroMeta | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ZoteroMeta[]>([])
  const [loading, setLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useLangStore(state => state.t)

  useEffect(() => {
    setMeta(getZoteroMeta())
  }, [doc?.pluginData])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setLoading(false)
    }
  }, [open])

  function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 1) {
      setResults([])
      setLoading(false)
      return
    }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setLoading(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const found = await searchZotero(q)
        setResults(found)
        setLoading(false)
      } catch {
        setResults([])
        setLoading(false)
      }
    }, 300)
  }

  function handleSelectPaper(item: ZoteroMeta) {
    setZoteroMeta({
      citekey: item.citekey,
      paperTitle: item.paperTitle,
      firstAuthor: item.firstAuthor,
      year: item.year,
    })
    setOpen(false)
  }

  if (!doc) return null

  return (
    <>
      <div className='zotero-widget'>
        <button
          className='zotero-paper-btn'
          onClick={() => setOpen(true)}
          title={meta ? `${meta.paperTitle}` : undefined}
        >
          📎 {meta
            ? [meta.firstAuthor, meta.year].filter(Boolean).join(', ') || meta.paperTitle
            : t.zoteroAttach}
        </button>
        {meta && (
          <button className='zotero-unlink-btn' onClick={clearZoteroMeta} title={t.zoteroUnlink}>
            ×
          </button>
        )}
      </div>

      {open && createPortal(
        <div className='modal-overlay' onClick={() => setOpen(false)}>
          <div className='modal' style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <p className='modal-title'>連結 Zotero 文獻</p>
            <input
              ref={inputRef}
              className='modal-input'
              placeholder='搜尋 citekey 或標題...'
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
            />
            {loading && (
              <div className='zotero-search-empty'>搜尋中...</div>
            )}
            {!loading && results.length > 0 && (
              <div className='zotero-search-results'>
                {results.map(item => (
                  <div
                    key={item.citekey}
                    className='zotero-search-item'
                    onClick={() => handleSelectPaper(item)}
                  >
                    <span className='zotero-search-title'>{item.paperTitle}</span>
                    <span className='zotero-search-meta'>
                      {[item.firstAuthor, item.year, item.venue].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {!loading && query.length >= 1 && results.length === 0 && (
              <div className='zotero-search-empty'>找不到結果，請確認 Zotero 已開啟</div>
            )}
            <div className='modal-actions'>
              <button className='toolbar-btn' onClick={() => setOpen(false)}>取消</button>
            </div>
          </div>
        </div>,
        window.document.body
      )}
    </>
  )
}