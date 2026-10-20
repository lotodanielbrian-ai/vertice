import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  ignores: ['**/dist/**', '**/node_modules/**', '**/drizzle/**', 'pc_builder_3d_showcase.tsx'],
})
