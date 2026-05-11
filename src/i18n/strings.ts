export type Lang = 'en' | 'zh'

type StringsShape = {
  theme: string
  settings: string
  open: string
  save: string
  saving: string
  exportHtml: string
  themeGallery: string
  untitledDocument: string
  toastSaved: string
  saved: string
  unsaved: string
  toastSaveFailed: string
  toastOpened: string
  toastOpenFailed: string
  toastExported: string
  toastExportFailed: string
  pages: string
  addPage: string
  dragToSort: string
  deletePage: string
  onboardingTitle: string
  onboardingStep1: string
  onboardingStep2: string
  onboardingStep3: string
  onboardingOr: string
  placeholderHeading: string
  placeholderDefault: string
  overflowLabel: string
  insertAbove: string
  insertBelow: string
  duplicatePage: string
  deletePageMenu: string
  toastDuplicated: string
  toastDeleted: string
  pageTitle: string
  bold: string
  italic: string
  strike: string
  h1: string
  h2: string
  h3: string
  bulletList: string
  orderedList: string
  addColBefore: string
  addColAfter: string
  deleteCol: string
  addRowBefore: string
  addRowAfter: string
  deleteRow: string
  deleteTable: string
  colLeft: string
  colRight: string
  rowUp: string
  rowDown: string
  themeSettings: string
  currentTheme: string
  builtinThemes: string
  folderImport: string
  pasteCSS: string
  applyTheme: string
  selectFolder: string
  selectingFolder: string
  folderHint: string
  themeNamePlaceholder: string
  cssPastePlaceholder: string
  resetTheme: string
  defaultThemeName: string
  toastThemeApplied: string
  toastImportFailed: string
  toastNoCss: string
  toastReset: string
  inlineEquation: string
  blockEquation: string
  preview: string
  latex: string
  commonSyntax: string
  cancel: string
  confirm: string
  mathPlaceholder: string
  mathPreviewEmpty: string
  mathSnippets: {
    fraction: string
    sqrt: string
    power: string
    subscript: string
    integral: string
    limit: string
    sum: string
    greek: string
    matrix: string
  }
  slashParagraph: string
  slashH1: string
  slashH2: string
  slashH3: string
  slashBullet: string
  slashOrdered: string
  slashQuote: string
  slashDivider: string
  slashTable: string
  slashImage: string
  slashMathInline: string
  slashMathBlock: string
  slashNoMatch: string
  toastImageFailed: string
  replaceImage: string
  uploadImage: string
  compoundFallback: string
  filterDocument: string
  filterHtml: string
  filterImage: string
  selectThemeFolder: string
  errorNoCss: string
  customTheme: string
  defaultPageTitle: string
  defaultTheme: string
  slateDesc: string
  washiDesc: string
  mossDesc: string
  imagePlaceholder: string
  homeTitle: string
  recentFiles: string
  newDocument: string
  newDocumentTitle: string
  newFolder: string
  newFolderName: string
  emptyWorkspace: string
  emptyWorkspaceHint: string
  openFile: string
  settingsTitle: string
  themeMode: string
  lightMode: string
  darkMode: string
  workspacePath: string
  changeWorkspace: string
  language: string
  defaultThemeLabel: string
  github: string
  themeGalleryLabel: string
  back: string
  unsavedChanges: string
  homeGuide1: string
  homeGuide2: string
  homeGuide3: string
  rename: string
  moveToFolder: string
  deleteFile: string
  deleteFolder: string
  deleteFolderConfirm: string
  renamePrompt: string
  confirmDelete: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  alignJustify: string
  renamePage: string
  renamePagePlaceholder: string
}

export const strings: Record<Lang, StringsShape> = {
  en: {
    // Toolbar
    theme: 'Theme',
    settings: 'Settings',
    open: 'Open',
    save: 'Save',
    saving: 'Saving…',
    exportHtml: 'Export HTML',
    themeGallery: 'Themes',
    untitledDocument: 'Untitled',

    // Toolbar toasts
    toastSaved: 'Saved',
    saved: 'Saved',
    unsaved: 'Unsaved',
    toastSaveFailed: 'Save failed',
    toastOpened: 'Opened',
    toastOpenFailed: 'Open failed',
    toastExported: 'Exported HTML',
    toastExportFailed: 'Export failed',

    // Sidebar
    pages: 'Pages',
    addPage: 'Add page',
    dragToSort: 'Drag to sort',
    deletePage: 'Delete page',

    // Canvas (onboarding)
    onboardingTitle: 'Start Creating',
    onboardingStep1: 'Import or choose a theme',
    onboardingStep2: 'Add a page',
    onboardingStep3: 'Type / to insert a block',
    onboardingOr: 'or open an existing .handout file.',

    // PageEditor
    placeholderHeading: 'Enter heading…',
    placeholderDefault: 'Type content, or press / to insert a block',
    overflowLabel: 'Content exceeds A4',

    // PageContextMenu
    insertAbove: 'Insert page above',
    insertBelow: 'Insert page below',
    duplicatePage: 'Duplicate page',
    deletePageMenu: 'Delete page',
    toastDuplicated: 'Page duplicated',
    toastDeleted: 'Page deleted',
    pageTitle: 'Page',

    // BubbleToolbar
    bold: 'Bold',
    italic: 'Italic',
    strike: 'Strikethrough',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    bulletList: 'Bullet list',
    orderedList: 'Ordered list',
    addColBefore: 'Insert column left',
    addColAfter: 'Insert column right',
    deleteCol: 'Del col',
    addRowBefore: 'Insert row above',
    addRowAfter: 'Insert row below',
    deleteRow: 'Del row',
    deleteTable: 'Del table',
    colLeft: '←Col',
    colRight: 'Col→',
    rowUp: '↑Row',
    rowDown: 'Row↓',

    // ThemeImporter
    themeSettings: 'Theme Settings',
    currentTheme: 'Current:',
    builtinThemes: 'Built-in',
    folderImport: 'Folder',
    pasteCSS: 'Paste CSS',
    applyTheme: 'Apply',
    selectFolder: 'Select theme folder',
    selectingFolder: 'Importing…',
    folderHint: 'Select a folder containing theme.css and theme.json.',
    themeNamePlaceholder: 'Theme name',
    cssPastePlaceholder: 'Paste theme.css content…',
    resetTheme: 'Reset to default',
    defaultThemeName: 'Default',
    toastThemeApplied: 'Theme applied:',
    toastImportFailed: 'Import failed',
    toastNoCss: 'Please paste CSS content',
    toastReset: 'Reset to default theme',

    // MathModal
    inlineEquation: 'Inline equation',
    blockEquation: 'Block equation',
    preview: 'Preview',
    latex: 'LaTeX',
    commonSyntax: 'Common syntax',
    cancel: 'Cancel',
    confirm: 'OK',
    mathPlaceholder: 'Enter LaTeX, e.g.: E=mc^2',
    mathPreviewEmpty: 'Enter LaTeX to preview',
    mathSnippets: {
      fraction: 'Fraction',
      sqrt: 'Square root',
      power: 'Power',
      subscript: 'Subscript',
      integral: 'Integral',
      limit: 'Limit',
      sum: 'Sum',
      greek: 'Greek letters',
      matrix: 'Matrix',
    },

    // SlashCommand
    slashParagraph: 'Paragraph',
    slashH1: 'Heading 1',
    slashH2: 'Heading 2',
    slashH3: 'Heading 3',
    slashBullet: 'Bullet list',
    slashOrdered: 'Ordered list',
    slashQuote: 'Quote',
    slashDivider: 'Divider',
    slashTable: 'Table',
    slashImage: 'Image',
    slashMathInline: 'Inline equation',
    slashMathBlock: 'Block equation',
    slashNoMatch: 'No matching commands',

    // ImagePlaceholder
    toastImageFailed: 'Failed to load image',
    replaceImage: 'Replace image',
    uploadImage: 'Click to upload image',

    // CompoundBlock
    compoundFallback: 'This block has no style in the current theme',

    // File filters
    filterDocument: 'Chiatom Document',
    filterHtml: 'HTML File',
    filterImage: 'Image',

    // themeLoader
    selectThemeFolder: 'Select theme folder',
    errorNoCss: 'theme.css not found in folder',
    customTheme: 'Custom theme',

    // documentStore
    defaultPageTitle: 'Page',
    defaultTheme: 'Default',

    // builtinThemes descriptions
    slateDesc: 'Slate gray, fine borders, technical',
    washiDesc: 'Warm white, washi texture, humanities',
    mossDesc: 'Low-saturation green accent, calm, general use',

    // renderer
    imagePlaceholder: '[Image]',

    // Home page
    homeTitle: 'My Documents',
    recentFiles: 'Recent',
    newDocument: 'New Document',
    newDocumentTitle: 'Document Title',
    newFolder: 'New Folder',
    newFolderName: 'Folder Name',
    emptyWorkspace: 'No documents yet',
    emptyWorkspaceHint: 'Click "New Document" to get started',
    openFile: 'Open File',

    // Settings page
    settingsTitle: 'Settings',
    themeMode: 'Appearance',
    lightMode: 'Light',
    darkMode: 'Dark',
    workspacePath: 'Workspace Path',
    changeWorkspace: 'Change',
    language: 'Language',
    defaultThemeLabel: 'Default Theme',
    github: 'GitHub',
    themeGalleryLabel: 'Theme Gallery',
    back: 'Back',
    unsavedChanges: 'You have unsaved changes. Are you sure?',
    homeGuide1: 'Click a document to open it',
    homeGuide2: 'Click "New Document" to start writing',
    homeGuide3: 'Click "New Folder" to organize your documents',
    
    rename: 'Rename',
    moveToFolder: 'Move to Folder',
    deleteFile: 'Delete Document',
    deleteFolder: 'Delete Folder',
    deleteFolderConfirm: 'This folder contains documents. Delete anyway?',
    renamePrompt: 'New name',
    confirmDelete: 'Delete',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    alignJustify: 'Justify',
    renamePage: 'Rename page',
    renamePagePlaceholder: 'Page name',
  },

  zh: {
    // Toolbar
    theme: '主題',
    settings: '設定',
    open: '開啟',
    save: '儲存',
    saving: '儲存中…',
    exportHtml: '匯出 HTML',
    themeGallery: '主題庫',
    untitledDocument: '未命名文件',

    // Toolbar toasts
    toastSaved: '已儲存',
    saved: '已儲存',
    unsaved: '尚未儲存',
    toastSaveFailed: '儲存失敗',
    toastOpened: '已開啟',
    toastOpenFailed: '開啟失敗',
    toastExported: '已匯出 HTML',
    toastExportFailed: '匯出失敗',

    // Sidebar
    pages: '頁面',
    addPage: '新增頁面',
    dragToSort: '拖曳排序',
    deletePage: '刪除頁面',

    // Canvas (onboarding)
    onboardingTitle: '開始創作',
    onboardingStep1: '匯入或選擇主題',
    onboardingStep2: '新增頁面',
    onboardingStep3: '打 / 插入區塊，開始編輯',
    onboardingOr: '或開啟現有的 .handout 檔案。',

    // PageEditor
    placeholderHeading: '輸入標題…',
    placeholderDefault: '輸入內容，或按 / 插入區塊',
    overflowLabel: '內容超出 A4 範圍',

    // PageContextMenu
    insertAbove: '在上方插入頁面',
    insertBelow: '在下方插入頁面',
    duplicatePage: '複製頁面',
    deletePageMenu: '刪除頁面',
    toastDuplicated: '已複製頁面',
    toastDeleted: '已刪除頁面',
    pageTitle: '頁面',

    // BubbleToolbar
    bold: '粗體',
    italic: '斜體',
    strike: '刪除線',
    h1: '大標題',
    h2: '中標題',
    h3: '小標題',
    bulletList: '無序清單',
    orderedList: '有序清單',
    addColBefore: '左側插入欄',
    addColAfter: '右側插入欄',
    deleteCol: '刪欄',
    addRowBefore: '上方插入列',
    addRowAfter: '下方插入列',
    deleteRow: '刪列',
    deleteTable: '刪表格',
    colLeft: '←欄',
    colRight: '欄→',
    rowUp: '↑列',
    rowDown: '列↓',

    // ThemeImporter
    themeSettings: '主題設定',
    currentTheme: '目前：',
    builtinThemes: '內建主題',
    folderImport: '資料夾匯入',
    pasteCSS: '貼上 CSS',
    applyTheme: '套用',
    selectFolder: '選取主題資料夾',
    selectingFolder: '匯入中…',
    folderHint: '選取包含 theme.css 和 theme.json 的主題資料夾。',
    themeNamePlaceholder: '主題名稱',
    cssPastePlaceholder: '貼上 theme.css 內容…',
    resetTheme: '重設為預設主題',
    defaultThemeName: '預設主題',
    toastThemeApplied: '已套用主題：',
    toastImportFailed: '匯入失敗',
    toastNoCss: '請貼上 CSS 內容',
    toastReset: '已重設為預設主題',

    // MathModal
    inlineEquation: '行內方程式',
    blockEquation: '區塊方程式',
    preview: '預覽',
    latex: 'LaTeX',
    commonSyntax: '常用語法',
    cancel: '取消',
    confirm: '確定',
    mathPlaceholder: '輸入 LaTeX，例如：E=mc^2',
    mathPreviewEmpty: '輸入 LaTeX 查看預覽',
    mathSnippets: {
      fraction: '分數',
      sqrt: '根號',
      power: '次方',
      subscript: '下標',
      integral: '積分',
      limit: '極限',
      sum: '求和',
      greek: '希臘字母',
      matrix: '矩陣',
    },

    // SlashCommand
    slashParagraph: '段落',
    slashH1: '大標題',
    slashH2: '中標題',
    slashH3: '小標題',
    slashBullet: '無序清單',
    slashOrdered: '有序清單',
    slashQuote: '引用',
    slashDivider: '分隔線',
    slashTable: '表格',
    slashImage: '圖片',
    slashMathInline: '行內方程式',
    slashMathBlock: '區塊方程式',
    slashNoMatch: '沒有符合的指令',

    // ImagePlaceholder
    toastImageFailed: '圖片載入失敗',
    replaceImage: '替換圖片',
    uploadImage: '點擊上傳圖片',

    // CompoundBlock
    compoundFallback: '此區塊在目前主題無對應樣式',

    // File filters
    filterDocument: 'Chiatom 文件',
    filterHtml: 'HTML 檔案',
    filterImage: '圖片',

    // themeLoader
    selectThemeFolder: '選取主題資料夾',
    errorNoCss: '找不到 theme.css，請確認資料夾內有此檔案',
    customTheme: '自訂主題',

    // documentStore
    defaultPageTitle: '頁面',
    defaultTheme: '預設主題',

    // builtinThemes descriptions
    slateDesc: '石板灰調，細邊線，理工教材',
    washiDesc: '暖米白，和紙質感，人文課程',
    mossDesc: '低飽和草綠 accent，自然沉穩，通用型',

    // renderer
    imagePlaceholder: '[圖片]',

    // Home page
    homeTitle: '我的文件',
    recentFiles: '最近開啟',
    newDocument: '新增文件',
    newDocumentTitle: '文件標題',
    newFolder: '新增資料夾',
    newFolderName: '資料夾名稱',
    emptyWorkspace: '還沒有任何文件',
    emptyWorkspaceHint: '點擊「新增文件」開始',
    openFile: '開啟檔案',

    // Settings page
    settingsTitle: '設定',
    themeMode: '外觀',
    lightMode: '淺色',
    darkMode: '深色',
    workspacePath: '工作區路徑',
    changeWorkspace: '變更',
    language: '語言',
    defaultThemeLabel: '預設主題',
    github: 'GitHub',
    themeGalleryLabel: '主題商城',
    back: '返回',
    unsavedChanges: '有未儲存的變更，確定要離開？',
    homeGuide1: '點擊文件開啟編輯',
    homeGuide2: '點擊「新增文件」建立講義或筆記',
    homeGuide3: '點擊「新增資料夾」整理文件',
    
    rename: '重新命名',
    moveToFolder: '移至資料夾',
    deleteFile: '刪除文件',
    deleteFolder: '刪除資料夾',
    deleteFolderConfirm: '此資料夾內有文件，確定要一併刪除？',
    renamePrompt: '新名稱',
    confirmDelete: '確定刪除',
    alignLeft: '靠左對齊',
    alignCenter: '置中對齊',
    alignRight: '靠右對齊',
    alignJustify: '兩端對齊',
    renamePage: '重新命名頁面',
    renamePagePlaceholder: '頁面名稱',
  },
}
