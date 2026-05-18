import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import { useNavigationStore } from '../store/navigationStore'
import { useLangStore } from '../store/langStore'
import { ThemeDefinition, useDocumentStore } from '../store/documentStore'
import { toast } from '../store/toastStore'
import { getSettings } from '../store/settingsStore'
import { getThemesPath, ensureThemesDirExists } from '../utils/workspace'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

const CUSTOMIZE_PROMPT = `你是一個 CSS 主題設計師。請為 Chiatom 編輯器製作一套完整的主題包，包含以下兩個檔案：

1. theme.json — 主題設定檔，格式如下：
{
  "name": "主題名稱",
  "version": "1.0.0",
  "author": "",
  "description": "主題描述",
  "pageSize": "A4",
  "blocks": [],
  "tags": ["標籤1", "標籤2"],
  "palette": ["#深色", "#中色", "#輔色", "#淺輔", "#底色"]
}

2. theme.css — 樣式檔，定義以下選擇器的樣式：
.page { } — A4 頁面容器
h1, h2, h3 { } — 標題
p, ul, ol { } — 內文
blockquote { } — 引用
table { } — 表格

請告訴我你想要的風格、色調或參考對象，我會產出完整的主題包。`

const defaultThemeDefinition: ThemeDefinition = {
  name: '',
  version: '1.0.0',
  author: '',
  description: '',
  pageSize: 'A4',
  blocks: [],
}

export default function ThemeCustomize() {
  const { t } = useLangStore()
  const { goBack } = useNavigationStore()
  const { setTheme } = useDocumentStore()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCopy = async () => {
    await writeText(CUSTOMIZE_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImportFolder = async () => {
    setLoading(true)
    try {
      const { workspacePath } = getSettings()
      if (!workspacePath) {
        toast.error(t.errorNoWorkspace)
        return
      }

      await ensureThemesDirExists(workspacePath)
      const themesPath = await getThemesPath(workspacePath)

      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: themesPath,
        title: t.selectThemeFolder,
      })

      if (!selected || Array.isArray(selected)) return

      const folderPath = selected

      // 讀取 theme.css
      let css = ''
      try {
        const cssPath = await join(folderPath, 'theme.css')
        css = await readTextFile(cssPath)
      } catch {
        throw new Error(t.errorNoCss)
      }

      // 讀取 theme.json（可選）
      let json: ThemeDefinition = { ...defaultThemeDefinition }
      try {
        const jsonPath = await join(folderPath, 'theme.json')
        const raw = await readTextFile(jsonPath)
        json = { ...defaultThemeDefinition, ...JSON.parse(raw) }
      } catch {
        // theme.json 不存在時用預設值，不報錯
      }

      const name = json.name || folderPath.split(/[\\/]/).pop() || t.customTheme
      const theme = { name, css, json: { ...json, name } }

      setTheme(theme)
      toast.success(`${t.toastThemeApplied} ${theme.name}`)
      goBack()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.toastImportFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='theme-store-shell'>
      <div className='theme-store-header'>
        <button className='toolbar-btn icon-btn' onClick={goBack}>←</button>
        <span className='theme-store-title'>自訂主題</span>
      </div>

      <div className='theme-customize-body'>
        <h2 className='theme-customize-title'>用 AI 製作你的主題</h2>
        <p className='theme-customize-sub'>跟著以下三個步驟，讓 AI 幫你產生主題檔案，再匯入 Chiatom。</p>

        <div className='theme-customize-steps'>
          {/* Step 1 */}
          <div className='theme-customize-step'>
            <div className='theme-customize-step-left'>
              <div className='theme-customize-step-dot'>1</div>
              <div className='theme-customize-step-line' />
            </div>
            <div className='theme-customize-step-right'>
              <div className='theme-customize-step-label'>複製 prompt</div>
              <div className='theme-customize-step-desc'>下方是主題製作的指令，包含 theme.css 與 theme.json 的格式規範。</div>
              <div className='theme-customize-prompt-box'>
                <div className='theme-customize-prompt-header'>
                  <span className='theme-customize-prompt-lang'>PROMPT FOR AI</span>
                  <button className='ghost-btn' onClick={handleCopy}>
                    {copied ? (
                      <>
                        <i className='codicon codicon-check' />
                        已複製 ✓
                      </>
                    ) : (
                      <>
                        <i className='codicon codicon-copy' />
                        複製
                      </>
                    )}
                  </button>
                </div>
                <div className='theme-customize-prompt-text'>
                  {CUSTOMIZE_PROMPT}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className='theme-customize-step'>
            <div className='theme-customize-step-left'>
              <div className='theme-customize-step-dot'>2</div>
              <div className='theme-customize-step-line' />
            </div>
            <div className='theme-customize-step-right'>
              <div className='theme-customize-step-label'>貼到 AI 工具，描述風格</div>
              <div className='theme-customize-step-desc'>Claude、ChatGPT、Gemini 都可以。在 prompt 的基礎上，加上你對風格的描述。</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className='theme-customize-step'>
            <div className='theme-customize-step-left'>
              <div className='theme-customize-step-dot'>3</div>
            </div>
            <div className='theme-customize-step-right'>
              <div className='theme-customize-step-label'>儲存輸出為資料夾</div>
              <div className='theme-customize-step-desc'>把 AI 給你的 theme.css 和 theme.json 放進同一個資料夾。</div>
            </div>
          </div>
        </div>

        <div className='theme-customize-divider' />

        <div className='theme-customize-import'>
          <div className='theme-customize-import-text'>
            <div className='theme-customize-import-label'>從資料夾匯入主題</div>
            <div className='theme-customize-import-desc'>選取包含 theme.css 和 theme.json 的資料夾。</div>
          </div>
          <button
            className='modal-btn-white'
            onClick={handleImportFolder}
            disabled={loading}
          >
            <i className='codicon codicon-folder-opened' />
            {loading ? '匯入中...' : '選取資料夾'}
          </button>
        </div>
      </div>
    </div>
  )
}
