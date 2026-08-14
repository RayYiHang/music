import { useEffect } from 'react'

/**
 * App-wide scroll-idle tracker.
 *
 * Mounted once by Layout. While ANY scroll container in the document
 * is scrolling, `data-scrolling` is set on `<html>`; it is removed as
 * soon as scrolling stops — via the native `scrollend` event where
 * available, otherwise (and always as a safety net) after a ~160ms
 * idle window.
 *
 * CSS uses the attribute to temporarily drop expensive effects (e.g.
 * the topbar's backdrop-filter, see `.top-bar-frost` in global.css)
 * during motion — imperceptible while content is moving — and restore
 * them at rest.
 *
 * One shared module with a refcount: components never attach their own
 * scroll listeners, and the listeners themselves are passive.
 */

const IDLE_TIMEOUT_MS = 160

let refCount = 0
let scrolling = false
let idleTimer: number | null = null

function setScrolling(next: boolean) {
  if (scrolling === next) return
  scrolling = next
  if (next) {
    document.documentElement.setAttribute('data-scrolling', '')
  } else {
    document.documentElement.removeAttribute('data-scrolling')
  }
}

function clearIdleTimer() {
  if (idleTimer != null) {
    window.clearTimeout(idleTimer)
    idleTimer = null
  }
}

function onScroll() {
  setScrolling(true)
  clearIdleTimer()
  // Safety net: if `scrollend` never fires (older engines, interrupted
  // scrolls), the attribute still clears after a short idle window.
  idleTimer = window.setTimeout(() => setScrolling(false), IDLE_TIMEOUT_MS)
}

function onScrollEnd() {
  clearIdleTimer()
  setScrolling(false)
}

function attach() {
  // Scroll events don't bubble, but the capture phase on window sees
  // them from every scroll container in the document. Passive: we
  // never preventDefault or read layout here.
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  if ('onscrollend' in window) {
    window.addEventListener('scrollend', onScrollEnd, { capture: true, passive: true })
  }
}

function detach() {
  clearIdleTimer()
  setScrolling(false)
  window.removeEventListener('scroll', onScroll, { capture: true })
  window.removeEventListener('scrollend', onScrollEnd, { capture: true })
}

const useScrollIdle = () => {
  useEffect(() => {
    if (refCount === 0) attach()
    refCount++
    return () => {
      refCount--
      if (refCount === 0) detach()
    }
  }, [])
}

export default useScrollIdle
