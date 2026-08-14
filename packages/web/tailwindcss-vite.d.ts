// @tailwindcss/vite ships only ESM + .d.mts types, which the classic "Node"
// moduleResolution in this tsconfig cannot resolve. The plugin takes no
// options in this repo, so a minimal ambient declaration suffices.
// (This file must stay a global script — no top-level imports/exports —
// otherwise `declare module` becomes module augmentation.)
declare module '@tailwindcss/vite' {
  import { Plugin } from 'vite'
  const tailwindcss: () => Plugin
  export default tailwindcss
}
