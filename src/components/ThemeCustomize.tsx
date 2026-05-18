import { useState } from 'react'
import { useNavigationStore } from '../store/navigationStore'
import { useLangStore } from '../store/langStore'
import { importThemeFromFolder } from '../theme/themeLoader'
import { useDocumentStore } from '../store/documentStore'
import { toast } from '../store/toastStore'

const CUSTOM_THEME_PROMPT = `你是一位專業的 CSS 設計師，我需要你為 Chiatom 設計一套自訂主題。

Chiatom 是一個以 A4 頁面為單位的區塊式文件編輯器，主題由兩個檔案組成：
- theme.css：所有頁面樣式
- theme.json：主題 metadata 與複合區塊宣告

---

【我想要的風格】

（請在這裡描述你的需求，例如：
- 色調：暗綠色系、工業風灰、溫暖橘調…
- 字體感：嚴謹學術、現代無衬線、手寫感…
- 用途：講義、簡報、個人筆記…
- 參考：某本書的排版、某個網站的風格…）

---

【輸出要求】

請輸出兩個完整檔案的內容：

**1. theme.json**

必須包含以下欄位：

\`\`\`json
{
  "name": "主題名稱",
  "version": "1.0.0",
  "author": "",
  "description": "一句話描述風格",
  "pageSize": "A4",
  "tags": [],
  "palette": [],
  "preview": "preview.png",
  "blocks": []
}
\`\`\`

**2. theme.css**

樣式必須全部寫在 \`.page {}\` 選擇器之內，並包含以下必要區塊：

\`\`\`css
.page { font-family: ...; font-size: ...; line-height: ...; color: ...; background: ...; padding: 72px 80px; }
.page h1 { ... }
.page h2 { ... }
.page h3 { ... }
.page p { margin: 0 0 10px 0; }
.page ul, .page ol { margin: 0 0 10px 0; padding-left: 20px; }
.page li { margin-bottom: 4px; }
.page blockquote { ... }
.page table { width: 100%; border-collapse: collapse; margin: 12px 0; }
.page th { ... }
.page td { ... }
.page hr { border: none; border-top: 1px solid ...; margin: 20px 0; }
.page img { max-width: 100%; display: block; margin: 12px auto; }
.page [data-type="layout-block"] { width: 100%; box-sizing: border-box; }
.page [data-type="column-slot"] { overflow: hidden; display: flex; flex-direction: column; }
.page [data-key="layout-two-col"], .page [data-key="layout-text-image"], .page [data-key="layout-image-text"] { align-items: start; }
@media print { .page { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
\`\`\`

---

【注意事項】

- 所有樣式必須在 \`.page {}\` 內，不要寫全域樣式
- \`padding: 72px 80px\` 是 A4 內距，請保持不變
- \`[data-type="layout-block"]\` 禁止加 \`height: 100%\`
- 字體優先使用系統字體（Georgia、Helvetica Neue、Noto Serif TC、Noto Sans TC）

輸出時請直接給出兩個檔案的完整內容，不需要額外說明。`

export default function ThemeCustomize() {
  const { t } = useLangStore()
  const { goBack } = useNavigationStore()
  const { setTheme } = useDocumentStore()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CUSTOM_THEME_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('複製失敗')
    }
  }

  const handleImportFolder = async () => {
    setLoading(true)
    try {
      const theme = await importThemeFromFolder()
      if (!theme) return
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
    <div className='theme-customize-shell'>
      <div className='theme-store-header'>
        <button className='toolbar-btn icon-btn' onClick={goBack}>←</button>
        <span className='theme-store-title'>{t.themeCustomize}</span>
      </div>

      <div className='theme-customize-body'>
        <div className='theme-customize-steps'>
          <div className='theme-customize-step'>
            <span className='theme-customize-step-num'>1</span>
            <span className='theme-customize-step-text'>複製下方 prompt</span>
          </div>
          <div className='theme-customize-step'>
            <span className='theme-customize-step-num'>2</span>
            <span className='theme-customize-step-text'>貼到你習慣的 AI 工具，描述你想要的風格</span>
          </div>
          <div className='theme-customize-step'>
            <span className='theme-customize-step-num'>3</span>
            <span className='theme-customize-step-text'>把 AI 輸出的資料夾匯入 Chiatom</span>
          </div>
        </div>

        <div className='theme-customize-actions'>
          <button
            className='modal-btn-primary'
            onClick={handleCopyPrompt}
          >
            {copied ? t.themeCopied : t.themeCopyPrompt}
          </button>

          <button
            className='modal-btn-primary'
            onClick={handleImportFolder}
            disabled={loading}
          >
            {loading ? t.selectingFolder : t.themeImportFolder}
          </button>
        </div>
      </div>
    </div>
  )
}