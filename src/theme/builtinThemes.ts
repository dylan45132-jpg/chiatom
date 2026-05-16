import slateCss from './themes/slate/theme.css?raw'
import slateJson from './themes/slate/theme.json'
import washiCss from './themes/washi/theme.css?raw'
import washiJson from './themes/washi/theme.json'
import mossCss from './themes/moss/theme.css?raw'
import mossJson from './themes/moss/theme.json'
import chalkCss from './themes/chalk/theme.css?raw'
import chalkJson from './themes/chalk/theme.json'
import linenCss from './themes/linen/theme.css?raw'
import linenJson from './themes/linen/theme.json'
import deckCss from './themes/deck/theme.css?raw'
import deckJson from './themes/deck/theme.json'
import monoCss from './themes/mono/theme.css?raw'
import monoJson from './themes/mono/theme.json'
import fieldCss from './themes/field/theme.css?raw'
import fieldJson from './themes/field/theme.json'
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
      id: 'washi',
      name: 'Washi',
      description: t.washiDesc,
      css: washiCss,
      json: washiJson as ThemeDefinition,
      mode: 'handout',
    },
    {
      id: 'moss',
      name: 'Moss',
      description: t.mossDesc,
      css: mossCss,
      json: mossJson as ThemeDefinition,
      mode: 'handout',
    },
    {
      id: 'chalk',
      name: 'Chalk',
      description: t.chalkDesc,
      css: chalkCss,
      json: chalkJson as ThemeDefinition,
      mode: 'presentation',
    },
    {
      id: 'linen',
      name: 'Linen',
      description: t.linenDesc,
      css: linenCss,
      json: linenJson as ThemeDefinition,
      mode: 'presentation',
    },
    {
      id: 'deck',
      name: 'Deck',
      description: t.deckDesc,
      css: deckCss,
      json: deckJson as ThemeDefinition,
      mode: 'presentation',
    },
    {
      id: 'mono',
      name: 'Mono',
      description: t.monoDesc,
      css: monoCss,
      json: monoJson as ThemeDefinition,
      mode: 'presentation',
    },
    {
      id: 'field',
      name: 'Field',
      description: t.fieldDesc,
      css: fieldCss,
      json: fieldJson as ThemeDefinition,
      mode: 'presentation',
    },
  ]
  return mode ? all.filter(t => t.mode === mode) : all
}
