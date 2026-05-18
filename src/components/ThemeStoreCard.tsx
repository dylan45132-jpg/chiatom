import type { StoreThemeMeta } from '../store/themeStoreStore'
import { useLangStore } from '../store/langStore'

interface ThemeStoreCardProps {
  theme: StoreThemeMeta
  isInstalled: boolean
  isInstalling: boolean
  isBuiltin: boolean
  onInstall: (theme: StoreThemeMeta) => void
}

export default function ThemeStoreCard({
  theme,
  isInstalled,
  isInstalling,
  isBuiltin,
  onInstall,
}: ThemeStoreCardProps) {
  const { t } = useLangStore()

  const renderButton = () => {
    if (isBuiltin) {
      return (
        <button className='theme-card-btn is-builtin' disabled>
          {t.themeBuiltin ?? '內建'}
        </button>
      )
    }
    if (isInstalled) {
      return (
        <button className='theme-card-btn is-installed' disabled>
          {t.themeInstalled ?? '已安裝'}
        </button>
      )
    }
    if (isInstalling) {
      return (
        <button className='theme-card-btn is-installing' disabled>
          {t.themeInstalling ?? '安裝中…'}
        </button>
      )
    }
    return (
      <button
        className='theme-card-btn'
        onClick={() => onInstall(theme)}
      >
        {t.themeInstall ?? '安裝'}
      </button>
    )
  }

  return (
    <div className='theme-card'>
      {/* 色盤預覽區 */}
      <div className='theme-card-preview'>
        {theme.palette.map((color, i) => (
          <div
            key={i}
            className='theme-card-palette-bar'
            style={{ background: color }}
          />
        ))}
        <span className='theme-card-size-badge'>
          {theme.pageSize === 'A4' ? '講義' : '簡報'}
        </span>
      </div>

      {/* 資訊區 */}
      <div className='theme-card-body'>
        <span className='theme-card-name'>{theme.name}</span>
        <p className='theme-card-desc'>{theme.description}</p>
        <div className='theme-card-footer'>
          <div className='theme-card-palette-dots'>
            {theme.palette.slice(0, 4).map((color, i) => (
              <span
                key={i}
                className='theme-card-dot'
                style={{ background: color }}
              />
            ))}
          </div>
          {renderButton()}
        </div>
      </div>
    </div>
  )
}