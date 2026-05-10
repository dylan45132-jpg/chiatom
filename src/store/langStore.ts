import { create } from 'zustand'
import { strings, type Lang } from '../i18n/strings'

interface LangStore {
  lang: Lang
  t: typeof strings.en
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

export const useLangStore = create<LangStore>((set) => ({
  lang: 'en',
  t: strings.en,
  setLang: (lang) => set({ lang, t: strings[lang] }),
  toggleLang: () => set((state) => {
    const next: Lang = state.lang === 'en' ? 'zh' : 'en'
    return { lang: next, t: strings[next] }
  }),
}))