// 過渡層：re-export 通用 projectStore，讓現有 Zotero import 暫時不壞
// 步驟 5（Zotero 疊加視圖）完成後移除此檔案

export { useProjectStore as useZoteroProjectStore } from '../../store/projectStore'
export type { } from '../../store/projectStore'

// getDefaultRoles 已移除（Role 改為自由輸入）
// 若有地方還在呼叫此函式，請直接刪除對應呼叫
export function getDefaultRoles(): string[] {
  return []
}
