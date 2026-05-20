# Code Review Report

## Summary
對 `src/` 目錄的掃描發現了一個嚴重的安全性漏洞，以及一些潛在的改進機會。程式碼中沒有找到 `TODO` 標籤。整體而言，程式碼結構良好，但在資料處理和 React hooks 的使用上需要更加謹慎。

## Status: CHANGES REQUESTED

## Key Findings
### 🔴 Critical Issues
- **XSS Vulnerability in `LibraryPage.tsx`**: 在搜尋結果的高亮顯示功能中，存在一個跨站腳本攻擊 (XSS) 漏洞。

### 🟡 Important Improvements
- **`useEffect` Dependency Review**: 專案中有大量 `useEffect` hook 的使用。建議進行一次全面的審查，以確保所有相依性都已正確設置，避免因相依性陣列不完整而導致的陳舊狀態 (stale state) 或非預期行為。

### 🔵 Minor Suggestions & Nitpicks
- **Code Smell in `PresentationNotes.tsx`**: 在同步編輯器狀態時使用了 `setTimeout`。這雖然可以運作，但通常被認為是一個「程式碼壞味道」，建議未來尋找更穩健的狀態同步方法。

---

## In-depth Investigation

### 1. XSS Vulnerability in `LibraryPage.tsx`
*   **Root Cause**: The vulnerability exists in the `highlight` function (L92-L108). This function is designed to wrap search matches in `<mark>` tags. However, it does so by concatenating strings to build HTML, and it does not sanitize or escape the input `text` (`entry.pageTitle` or `entry.preview`). If this source text contains malicious HTML, it will be rendered directly to the DOM via `dangerouslySetInnerHTML`.

*   **Reproduction Scenario**:
    1.  A user creates a document where a page title contains a script, for example: `My harmless notes <script>alert("XSS triggered!")</script>`.
    2.  This document is saved, and its title is stored in the library index.
    3.  The user opens the Library page and searches for "notes".
    4.  The `highlight` function will process the malicious title string. It will find the word "notes" and wrap it, but it will leave the `<script>` tag untouched.
    5.  The final HTML string, still containing the script, is passed to `dangerouslySetInnerHTML` and rendered in the browser.
    6.  The script executes, and an alert box appears, confirming the XSS vulnerability.

### 2. `useEffect` Dependency Review
*   **Root Cause**: A project-wide audit is recommended because missing dependencies in `useEffect` can lead to subtle bugs that are hard to trace. When a hook's dependency array is incomplete, the effect's closure captures stale values of props and state, and the effect fails to re-run when those values change.

*   **Concrete Example**: A clear instance of this issue is found in **`src/components/Canvas.tsx` at line 94**.
    *   **The Code**: This `useEffect` hook is responsible for calculating the horizontal margin (`offsetX`) to center the page in note mode. It has an empty dependency array `[]`, meaning it only runs once when the component mounts.
    *   **The Bug**: The calculation logic implicitly depends on the app being in note mode (it uses `NOTE_W`). However, `isPresentation` (which controls the mode) is not in the dependency array. If the user switches from presentation mode back to note mode, this effect **does not re-run**. As a result, the `offsetX` is not recalculated, and the page layout becomes incorrect, appearing off-center.
    *   **The Fix**: Adding `isPresentation` to the dependency array (`useEffect(..., [isPresentation])`) would solve this bug by ensuring the layout calculation re-runs whenever the mode changes.

### 3. Code Smell in `PresentationNotes.tsx`
*   **Root Cause**: The component uses `setTimeout` within a `useEffect` hook (L34-L45) to update the content of the Tiptap editor (`notesEditor.commands.setContent(doc.speakerNotes)`).

*   **Analysis**: This is a "code smell" for the following reasons:
    *   **Fragility**: A `0`ms timeout is not a guarantee. It only defers the execution to the end of the current browser event loop task. If the editor component has a complex lifecycle, or if the system is under heavy load, this timing might not be sufficient, leading to inconsistent updates.
    *   **Obscures Intent**: It hides the real problem, which is a race condition between the React render cycle and the Tiptap editor's internal state updates. The code doesn't explicitly state "wait for the editor to be ready," but rather "wait for an arbitrary short time."
    *   **Better Alternatives**: Modern editors like Tiptap often provide more robust, built-in APIs to handle such scenarios. A proper investigation would involve consulting the Tiptap documentation for an idiomatic solution, such as:
        *   Using the `editor.on('update', ...)` or other lifecycle events.
        *   Using a chained command or transaction that ensures the editor is in a ready state.
    While the current code might work, it's brittle and could be a source of future bugs.

---

## Detailed Feedback
| File | Line | Issue | Suggestion |
| :--- | :--- | :--- | :--- |
| `src/components/LibraryPage.tsx` | L143, L149 | **XSS Vulnerability** | The `highlight` function creates HTML by concatenating strings without escaping user-provided search queries and content from the library index. This allows malicious HTML (like `<script>`) in the source documents or previews to be rendered, leading to an XSS vulnerability. | Instead of using `dangerouslySetInnerHTML`, generate the highlighted content using DOM APIs (e.g., creating Text nodes and `<mark>` elements) which are safe by default. Alternatively, use a library like `dompurify` to sanitize the generated HTML string before rendering. |
| `src/components/MathModal.tsx` | L107 | **Low-risk `dangerouslySetInnerHTML`** | This component uses `dangerouslySetInnerHTML` to render math equations generated by the KaTeX library. | While `dangerouslySetInnerHTML` is always a risk, this specific usage is considered low-risk as the HTML is generated by a trusted, specialized library (KaTeX) from a domain-specific language (LaTeX). No immediate action is required, but it's good to be aware of it. |
| Project-wide | - | **`useEffect` Dependency Audit** | There are 37 instances of `useEffect` hooks that seem to use an empty dependency array (`[]`). While many are likely correct (for run-on-mount effects), this pattern can easily hide bugs if the effect implicitly depends on props or state that can change over time. | Conduct a full audit of all `useEffect` hooks. For each one, verify that all variables and functions from the component scope that are used inside the effect are included in the dependency array. Enable the `react-hooks/exhaustive-deps` ESLint rule to automate this check. |

## Positive Highlights
- The codebase is well-structured into components, stores, and utilities.
- The use of Zustand for state management is clean and efficient.
- The implementation of the draggable and resizable panels (`MathModal`, `PresentationNotes`) is well-contained and demonstrates good use of `useCallback` and `useRef`.
