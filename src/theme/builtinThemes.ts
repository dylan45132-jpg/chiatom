import slateCss from './themes/slate/theme.css?raw'
import slateJson from './themes/slate/theme.json'
import washiCss from './themes/washi/theme.css?raw'
import washiJson from './themes/washi/theme.json'
import mossCss from './themes/moss/theme.css?raw'
import mossJson from './themes/moss/theme.json'
import type { ThemeDefinition } from '../store/documentStore'
import { useLangStore } from '../store/langStore'

interface BuiltinTheme {
  id: string
  name: string
  description: string
  css: string
  json: ThemeDefinition
}

export function getBuiltinThemes(): BuiltinTheme[] {
  const t = useLangStore.getState().t
  return [
    {
      id: 'slate',
      name: 'Slate',
      description: t.slateDesc,
      css: slateCss,
      json: slateJson as ThemeDefinition,
    },
    {
      id: 'washi',
      name: 'Washi',
      description: t.washiDesc,
      css: washiCss,
      json: washiJson as ThemeDefinition,
    },
    {
      id: 'moss',
      name: 'Moss',
      description: t.mossDesc,
      css: mossCss,
      json: mossJson as ThemeDefinition,
    },
  ]
}
