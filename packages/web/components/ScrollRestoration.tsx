import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import scrollPositions, { VIRTUOSO_SCROLL_PREFIX } from '@/web/states/scrollPositions'
import { throttle } from 'lodash-es'

const ScrollRestoration = () => {
  const location = useLocation()

  // Pages that scroll <main> itself. (Keyed by window.location.pathname to
  // match PageTransition's restore side.)
  useEffect(() => {
    const main = document.querySelector('main')
    const handleScroll = throttle(() => {
      scrollPositions.set(window.location.pathname, main?.scrollTop ?? 0)
    }, 200)
    main?.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      main?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Virtuoso pages (Browse, Search, Album/Playlist track lists) scroll
  // inside the Virtuoso scroller, not <main> — their positions were never
  // saved or restored. Attach to the real scroller once it exists (it may
  // mount late, after data loads) and save/restore per route. Positions
  // are stored under a `virt:`-prefixed key so pages that scroll both
  // <main> and an inner Virtuoso (Search) keep two independent positions.
  useLayoutEffect(() => {
    let scroller: HTMLElement | null = null
    let handleScroll: (() => void) | null = null
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined
    let rafId: number | undefined
    const retryTimers: ReturnType<typeof setTimeout>[] = []
    const saved = scrollPositions.get(VIRTUOSO_SCROLL_PREFIX + location.pathname) ?? 0

    const apply = () => {
      if (cancelled || !scroller) return
      // Don't fight the user: stop once they've scrolled somewhere that
      // isn't just a clamp against too-short content.
      const clamped = scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 4
      if (scroller.scrollTop !== 0 && !clamped) return
      scroller.scrollTop = saved
    }

    const attach = (el: HTMLElement) => {
      scroller = el
      handleScroll = throttle(() => {
        scrollPositions.set(
          VIRTUOSO_SCROLL_PREFIX + location.pathname,
          scroller?.scrollTop ?? 0
        )
      }, 200)
      el.addEventListener('scroll', handleScroll, { passive: true })
      // Restore now and re-apply for a short while — content often grows
      // after data loads, and a restore against short content gets clamped.
      apply()
      rafId = requestAnimationFrame(apply)
      ;[300, 1200, 3000].forEach(ms => retryTimers.push(setTimeout(apply, ms)))
    }

    const poll = () => {
      if (cancelled) return
      const els = document.querySelectorAll<HTMLElement>('[data-virtuoso-scroller]')
      // Prefer the last match — during route-exit animations both the old
      // and new page can be mounted; the incoming page is appended later.
      if (els.length > 0) attach(els[els.length - 1])
      else pollTimer = setTimeout(poll, 400)
    }
    poll()

    return () => {
      cancelled = true
      clearTimeout(pollTimer)
      if (rafId) cancelAnimationFrame(rafId)
      retryTimers.forEach(clearTimeout)
      if (scroller && handleScroll) scroller.removeEventListener('scroll', handleScroll)
    }
  }, [location.pathname])

  return <></>
}

export default ScrollRestoration
