module.exports = {
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  semi: false,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  bracketSpacing: true,
  htmlWhitespaceSensitivity: 'strict',
  singleQuote: true,
  jsxSingleQuote: true,
  printWidth: 100,

  // Tailwind CSS v4 (CSS-first config; no tailwind.config.js anymore)
  plugins: [require('prettier-plugin-tailwindcss')],
  tailwindStylesheet: './packages/web/styles/global.css',
}
