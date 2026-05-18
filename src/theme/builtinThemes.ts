import slateCss from './themes/slate/theme.css?raw'
import slateJson from './themes/slate/theme.json'
import linenDeckCss from './themes/linen-deck/theme.css?raw'
import linenDeckJson from './themes/linen-deck/theme.json'
import type { ThemeDefinition } from '../store/documentStore'
import { useLangStore } from '../store/langStore'

interface BuiltinTheme {
  id: string
  name: string
  description: string
  css: string
  json: ThemeDefinition
  mode: 'handout' | 'presentation'
}

export function getBuiltinThemes(mode?: 'handout' | 'presentation'): BuiltinTheme[] {
  const t = useLangStore.getState().t
  const all: BuiltinTheme[] = [
    {
      id: 'slate',
      name: 'Slate',
      description: t.slateDesc,
      css: slateCss,
      json: slateJson as ThemeDefinition,
      mode: 'handout',
    },
    {
      id: 'linen-deck',
      name: 'Linen Deck',
      description: t.linenDesc,
      json: linenDeckJson as ThemeDefinition,
      css: linenDeckCss,
      mode: 'presentation',
    },
  ]
  return mode ? all.filter(t => t.mode === mode) : all
}