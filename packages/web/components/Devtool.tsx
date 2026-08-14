import { lazy, Suspense } from 'react'

// Lazily imported so `@tanstack/react-query-devtools` (and its whole
// dependency subtree) stays out of the production bundle: the dynamic
// import sits behind `import.meta.env.DEV`, which Vite statically replaces
// with `false` and rollup then dead-code-eliminates.
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then(d => ({
    default: d.ReactQueryDevtools,
  }))
)

const Devtool = () => {
  if (!import.meta.env.DEV) return null

  return (
    <Suspense fallback={null}>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition='top-right' />
    </Suspense>
  )
}

export default Devtool
