import { useEffect, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { useNavigationStore } from '../store/navigationStore'
import { checkForUpdates, UpdateInfo } from '../utils/updater'

interface ReleaseNote {
  version: string
  body: string
}

export default function AboutPage() {
  const { goBack } = useNavigationStore()
  const [version, setVersion] = useState<string>('')
  const [releases, setReleases] = useState<ReleaseNote[]>([])
  const [loadingReleases, setLoadingReleases] = useState(true)
  const [checking, setChecking] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [noUpdate, setNoUpdate] = useState(false)

  useEffect(() => {
    getVersion().then(v => setVersion(v))
    fetchReleases()
  }, [])

  const fetchReleases = async () => {
    setLoadingReleases(true)
    try {
      const res = await fetch('https://api.github.com/repos/dylan45132-jpg/chiatom/releases?per_page=5')
      const data = await res.json()
      const notes: ReleaseNote[] = data.map((r: { tag_name: string; body: string }) => ({
        version: r.tag_name,
        body: r.body ?? '',
      }))
      setReleases(notes)
    } catch {
      setReleases([])
    } finally {
      setLoadingReleases(false)
    }
  }

  const handleCheckUpdate = async () => {
    setChecking(true)
    setNoUpdate(false)
    setUpdateInfo(null)
    try {
      const info = await checkForUpdates()
      if (info) setUpdateInfo(info)
      else setNoUpdate(true)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className='settings-shell'>
      <div className='settings-header'>
        <button className='toolbar-btn icon-btn' onClick={goBack}>←</button>
        <span className='settings-title'>關於 Chiatom</span>
      </div>

      <div className='settings-body'>
        <div className='settings-section'>
          <div className='settings-row'>
            <div className='settings-row-label'>
              <span className='settings-label'>Chiatom</span>
              <span className='settings-desc'>v{version}</span>
            </div>
            <button className='toolbar-btn' onClick={handleCheckUpdate} disabled={checking}>
              {checking ? '檢查中...' : '檢查更新'}
            </button>
          </div>
          {updateInfo && (
            <div className='about-update-notice'>
              🎉 新版本 {updateInfo.version} 可用，請重啟 app 安裝。
            </div>
          )}
          {noUpdate && (
            <div className='about-update-notice'>
              ✓ 已是最新版本
            </div>
          )}
        </div>

        <div className='settings-section'>
          <span className='settings-label'>更新日誌</span>
          {loadingReleases ? (
            <div className='settings-desc'>載入中...</div>
          ) : releases.length === 0 ? (
            <div className='settings-desc'>無法載入更新日誌</div>
          ) : (
            <div className='about-releases'>
              {releases.map(r => (
                <div key={r.version} className='about-release-item'>
                  <div className='about-release-version'>{r.version}</div>
                  {r.body ? (
                    <pre className='about-release-body'>{r.body}</pre>
                  ) : (
                    <div className='settings-desc'>—</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}