// Inner (Virtuoso) scroller positions are stored under a `virt:`-prefixed
// pathname so they can never collide with the <main> position of the same
// route (e.g. Search tabs scroll both scrollers). Prefixed keys bypass the
// nested-path parsing below — `virt:/search/x` must not be re-interpreted
// as a nested `/search` entry.
export const VIRTUOSO_SCROLL_PREFIX = 'virt:'

class ScrollPositions {
  private _nestedPaths: string[] = ['/artist', '/album', '/playlist', '/search']
  private _positions: Record<string, { path: string; top: number }[]> = {}
  private _generalPositions: Record<string, number> = {}

  constructor() {
    this._nestedPaths.forEach(path => (this._positions[path] = []))
  }

  get(pathname: string) {
    if (pathname.startsWith(VIRTUOSO_SCROLL_PREFIX)) {
      return this._generalPositions?.[pathname]
    }
    const nestedPath = `/${pathname.split('/')[1]}`
    const restPath = pathname.split('/').slice(2).join('/')
    if (this._nestedPaths.includes(nestedPath)) {
      return this._positions?.[nestedPath]?.find(({ path }) => path === restPath)?.top
    } else {
      return this._generalPositions?.[pathname]
    }
  }

  set(pathname: string, top: number) {
    // set general position
    if (pathname.startsWith(VIRTUOSO_SCROLL_PREFIX)) {
      this._generalPositions[pathname] = top
      return
    }

    const nestedPath = `/${pathname.split('/')[1]}`
    const restPath = pathname.split('/').slice(2).join('/')

    // set general position
    if (!this._nestedPaths.includes(nestedPath)) {
      this._generalPositions[pathname] = top
      return
    }

    // set nested position
    const existsPath = this._positions[nestedPath].find(p => p.path === restPath)
    if (existsPath) {
      existsPath.top = top
      this._positions[nestedPath] = this._positions[nestedPath].filter(p => p.path !== restPath)
      this._positions[nestedPath].push(existsPath)
    } else {
      this._positions[nestedPath].push({ path: restPath, top })
    }

    // delete oldest position when there are more than 10
    if (this._positions[nestedPath].length > 10) {
      this._positions[nestedPath].shift()
    }
  }
}

const scrollPositions = new ScrollPositions()

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-extra-semi
  ;(window as any).scrollPositions = scrollPositions
}

export default scrollPositions
