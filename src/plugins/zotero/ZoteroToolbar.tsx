import { useState, useEffect, useRef } from 'react'
import { getZoteroMeta, setZoteroMeta, searchZotero, ZoteroMeta } from './zoteroStore'
import { useDocumentStore } from '../../store/documentStore'

export default function ZoteroToolbar() {
  const document = useDocumentStore(state => state.document)
  const [meta, setMeta] = useState<ZoteroMeta | null>(null)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ZoteroMeta[]>([])
  const [newTag, setNewTag] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMeta(getZoteroMeta())
  }, [document?.pluginData])

  function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      const found = await searchZotero(q)
      setResults(found)
    }, 300)
  }

  function handleSelectPaper(item: ZoteroMeta) {
    setZoteroMeta({ citekey: item.citekey, paperTitle: item.paperTitle })
    setSearching(false)
    setQuery('')
    setResults([])
  }

  function handleAddTag() {
    if (!newTag.trim()) return
    const current = meta?.tags ?? []
    if (current.includes(newTag.trim())) return
    setZoteroMeta({ tags: [...current, newTag.trim()] })
    setNewTag('')
  }

  function handleRemoveTag(tag: string) {
    const current = meta?.tags ?? []
    setZoteroMeta({ tags: current.filter(t => t !== tag) })
  }

  if (!document) return null

  return (
    <div className='zotero-toolbar'>
      <div className='zotero-paper'>
        {meta?.citekey ? (
          <button
            className='zotero-paper-btn linked'
            onClick={() => setSearching(true)}
            title={meta.paperTitle}
          >
            📎 {meta.citekey}
          </button>
        ) : (
          <button
            className='zotero-paper-btn'
            onClick={() => setSearching(true)}
          >
            📎 連結文獻
          </button>
        )}
        {searching && (
          <div className='zotero-search-popup'>
            <input
              autoFocus
              className='zotero-search-input'
              placeholder='搜尋 citekey 或標題...'
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearching(false)}
            />
            {results.length > 0 && (
              <div className='zotero-search-results'>
                {results.map(item => (
                  <div
                    key={item.citekey}
                    className='zotero-search-item'
                    onClick={() => handleSelectPaper(item)}
                  >
                    <span className='zotero-search-citekey'>{item.citekey}</span>
                    <span className='zotero-search-title'>{item.paperTitle}</span>
                  </div>
                ))}
              </div>
            )}
            {query.length >= 2 && results.length === 0 && (
              <div className='zotero-search-empty'>找不到結果，請確認 Zotero 已開啟</div>
            )}
          </div>
        )}
      </div>
      <div className='zotero-tags'>
        {(meta?.tags ?? []).map(tag => (
          <span key={tag} className='zotero-tag'>
            {tag}
            <button className='zotero-tag-remove' onClick={() => handleRemoveTag(tag)}>×</button>
          </span>
        ))}
        <div className='zotero-tag-input-wrap'>
          <input
            className='zotero-tag-input'
            placeholder='+ 新增標記'
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
          />
        </div>
      </div>
    </div>
  )
}