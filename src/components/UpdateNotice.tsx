import { useState } from 'react'
import { UpdateInfo, downloadAndInstall } from '../utils/updater'

interface Props {
  update: UpdateInfo
  onDismiss: () => void
}

export default function UpdateNotice({ update, onDismiss }: Props) {
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState(0)

  async function handleUpdate() {
    setInstalling(true)
    await downloadAndInstall((downloaded, total) => {
      if (total) setProgress(Math.round((downloaded / total) * 100))
    })
  }

  return (
    <div className='update-notice'>
      <div className='update-notice-content'>
        <span className='update-notice-text'>
          v{update.version} 已發布
        </span>
        {installing ? (
          <span className='update-notice-progress'>
            {progress > 0 ? `${progress}%` : '下載中...'}
          </span>
        ) : (
          <div className='update-notice-actions'>
            <button className='toolbar-btn primary' onClick={handleUpdate}>
              更新
            </button>
            <button className='toolbar-btn' onClick={onDismiss}>
              稍後
            </button>
          </div>
        )}
      </div>
    </div>
  )
}