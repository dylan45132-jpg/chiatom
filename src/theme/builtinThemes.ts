import slateCss from './themes/slate/theme.css?raw'
import slateJson from './themes/slate/theme.json'
import washiCss from './themes/washi/theme.css?raw'
import washiJson from './themes/washi/theme.json'
import mossCss from './themes/moss/theme.css?raw'
import mossJson from './themes/moss/theme.json'
import type { ThemeDefinition } from '../store/documentStore'

interface BuiltinTheme {
  id: string
  name: string
  description: string
  css: string
  json: ThemeDefinition
}

export const BUILTIN_THEMES: BuiltinTheme[] = [
  {
    id: 'slate',
    name: 'Slate',
    description: '石板灰調，細邊線，理工講義',
    css: slateCss,
    json: slateJson as ThemeDefinition,
  },
  {
    id: 'washi',
    name: 'Washi',
    description: '暖米白，和紙質感，人文課程',
    css: washiCss,
    json: washiJson as ThemeDefinition,
  },
  {
    id: 'moss',
    name: 'Moss',
    description: '低飽和草綠 accent，自然沉穩，通用型',
    css: mossCss,
    json: mossJson as ThemeDefinition,
  },
]
