import { cx } from '@emotion/css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import uiStates from '@/web/states/uiStates'
import Icon from '@/web/components/Icon'
import { useSearchHot } from '@/web/api/hooks/useSearch'
import useLockMainScroll from '@/web/hooks/useLockMainScroll'
import useOSPlatform from '@/web/hooks/useOSPlatform'
import { ease } from '@/web/utils/const'

const SUGGEST_DEBOUNCE_MS = 300

const SearchModal = () => {
  const { showSearchModal } = useSnapshot(uiStates)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const platform = useOSPlatform()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  const [searchText, setSearchText] = useState('')

  const close = () => {
    uiStates.showSearchModal = false
  }

  // ── Debounce cleanup (input state itself is uncommitted — the modal
  // never shows live results; Enter jumps to the full results page). ──
  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    },
    []
  )

  const handleChange = (text: string) => {
    setSearchText(text)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = undefined
    }, SUGGEST_DEBOUNCE_MS)
  }

  useLockMainScroll(showSearchModal)

  // ── ⌘F / Ctrl+F toggle — fixed listener, works even while typing in an
  // input (useApplyKeyboardShortcuts deliberately skips input targets). ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyF') return
      const mod =
        platform === 'darwin' ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey
      if (!mod) return
      e.preventDefault()
      uiStates.showSearchModal = !uiStates.showSearchModal
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [platform])

  // Auto-focus + select-all on open: keep the previous query but select it
  // so retyping replaces it (Spotlight behavior).
  useEffect(() => {
    if (showSearchModal) {
      // Wait a tick for the input to mount before focusing.
      window.setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [showSearchModal])

  const submit = (override?: string) => {
    const keywords = (override ?? searchText).trim()
    // Never navigate with an empty keyword — it renders a blank search page.
    if (!keywords) return
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = undefined
    }
    close()
    navigate(`/search/${encodeURIComponent(keywords)}`)
  }

  // Hot search words for the empty state (fetched only while the modal is
  // open on an empty query; cached 10 min afterwards).
  const empty = searchText.trim().length === 0
  const hotQuery = useSearchHot(showSearchModal && empty)
  const hotWords = useMemo(
    () => (hotQuery.data?.code === 200 ? (hotQuery.data.data ?? []).slice(0, 10) : []),
    [hotQuery.data]
  )

  return (
    <>
      {/* Backdrop — click closes */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            className='fixed inset-0 z-30 bg-black/60 backdrop-blur-3xl'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Content — top-biased center, Spotlight style */}
      <AnimatePresence>
        {showSearchModal && (
          <div className='pointer-events-none fixed inset-0 z-30 flex items-start justify-center pt-[10vh]'>
            <motion.div
              className={cx(
                'app-region-no-drag pointer-events-auto flex flex-col rounded-24 shadow-2xl',
                'border border-black/10 bg-white/95 dark:border-white/10 dark:bg-black/95',
                'backdrop-blur-2xl',
                'w-[min(640px,92vw)]'
              )}
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.25, ease },
              }}
              exit={{
                opacity: 0,
                y: -8,
                scale: 0.98,
                transition: { duration: 0.15, ease },
              }}
            >
              {/* Input row — divider only when hot words render below it,
                  otherwise the border dangles as a stray line. */}
              <div
                className={cx(
                  'flex items-center p-4',
                  empty && hotWords.length > 0 && 'border-b border-black/10 dark:border-white/10'
                )}
              >
                <Icon name='search' className='mr-3 h-6 w-6 shrink-0 opacity-50' />
                <input
                  ref={inputRef}
                  placeholder={t`search.search`.toString()}
                  className='grow bg-transparent text-18 font-medium outline-hidden placeholder:text-black/40 dark:placeholder:text-white/40'
                  value={searchText}
                  onChange={e => handleChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      close()
                      return
                    }
                    if (e.key !== 'Enter') return
                    // The Enter that confirms an IME composition (zh-CN input
                    // methods report isComposing / keyCode 229) must not navigate.
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return
                    e.preventDefault()
                    submit()
                  }}
                />
              </div>

              {/* Empty state — hot search words; a click goes straight to
                  the full results page. No in-modal result lists: the modal
                  stays a launcher, results live on /search/:keywords. */}
              {empty && hotWords.length > 0 && (
                <div className='p-3'>
                  <div className='px-3 pb-1 pt-3 text-12 font-medium uppercase tracking-wider text-black/40 dark:text-white/40'>
                    {t`search.hot-search`}
                  </div>
                  <div className='flex flex-wrap gap-2 p-1 pt-1'>
                    {hotWords.map((hot, i) => (
                      <button
                        key={`${hot.searchWord}-${i}`}
                        onClick={() => submit(hot.searchWord)}
                        className={cx(
                          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-14 font-medium transition-colors',
                          'bg-black/5 text-black/70 hover:bg-black/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10'
                        )}
                      >
                        <span
                          className={cx(
                            'text-12 font-bold',
                            i < 3 ? 'text-brand-700' : 'text-black/30 dark:text-white/30'
                          )}
                        >
                          {i + 1}
                        </span>
                        {hot.searchWord}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SearchModal
