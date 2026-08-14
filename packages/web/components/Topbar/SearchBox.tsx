import { css, cx } from '@emotion/css'
import Icon from '../Icon'
import { breakpoint as bp } from '@/web/utils/const'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchSuggestions } from '@/web/api/hooks/useSearch'
import { useClickAway } from 'react-use'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import player from '@/web/states/player'

const SUGGEST_DEBOUNCE_MS = 300

function SearchIcon() {
  return (
    <div>
      <Icon name='search' className='mr-2.5 h-7 w-7' />
    </div>
  )
}

const SearchSuggestions = ({
  searchText,
  debouncedSearchText,
  isInputFocused,
}: {
  searchText: string
  debouncedSearchText: string
  isInputFocused: boolean
}) => {
  const navigate = useNavigate()

  const { data: suggestions, isFetching } = useSearchSuggestions(
    debouncedSearchText
  )

  const suggestionsArray = useMemo(() => {
    if (suggestions?.code !== 200) {
      return []
    }
    const suggestionsArray: {
      name: string
      type: 'album' | 'artist' | 'track'
      id: number
    }[] = []
    const rawItems = [
      ...(suggestions.result?.artists || []),
      ...(suggestions.result?.albums || []),
      ...(suggestions.result?.songs || []),
    ]
    rawItems.forEach(item => {
      const type = (item as Artist).albumSize
        ? 'artist'
        : (item as Track).duration
        ? 'track'
        : 'album'
      suggestionsArray.push({
        name: item.name,
        type,
        id: item.id,
      })
    })
    return suggestionsArray
  }, [suggestions])

  const [clickedSearchText, setClickedSearchText] = useState('')
  useEffect(() => {
    if (clickedSearchText !== searchText) {
      setClickedSearchText('')
    }
  }, [clickedSearchText, searchText])

  const panelRef = useRef<HTMLDivElement>(null)
  useClickAway(panelRef, () => setClickedSearchText(searchText))

  // KeepPreviousData: while the debounced keyword is being fetched the panel
  // stays open with the previous suggestions — no flicker during typing.
  return (
    <AnimatePresence>
      {isInputFocused &&
        searchText.trim().length > 0 &&
        suggestionsArray.length > 0 &&
        !clickedSearchText && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scaleY: 0.96 }}
            animate={{
              opacity: 1,
              scaleY: 1,
              transition: {
                duration: 0.1,
              },
            }}
            exit={{
              opacity: 0,
              scaleY: 0.96,
              transition: {
                duration: 0.2,
              },
            }}
            className={cx(
              'border-dark/10 absolute mt-2 origin-top rounded-24 border p-2 backdrop-blur-2xl dark:border-white/10',
              'bg-white/95 dark:bg-black/95',
              css`
                width: 286px;
              `
            )}
          >
            {isFetching && (
              <div className='absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-black/30 dark:bg-white/40' />
            )}
            {suggestionsArray?.map(suggestion => (
              <div
                key={`${suggestion.type}-${suggestion.id}`}
                className='line-clamp-1 rounded-12 p-2 hover:bg-black/10 dark:hover:bg-white/10'
                onClick={() => {
                  setClickedSearchText(searchText)
                  if (['album', 'artist'].includes(suggestion.type)) {
                    navigate(`/${suggestion.type}/${suggestion.id}`)
                  }
                  if (suggestion.type === 'track') {
                    player.playAList([suggestion.id], suggestion.id)
                  }
                }}
              >
                {suggestion.type} -{suggestion.name}
              </div>
            ))}
          </motion.div>
        )}
    </AnimatePresence>
  )
}

const SearchBox = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    },
    []
  )

  const handleChange = (text: string) => {
    setSearchText(text)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (text.trim().length === 0) {
      setDebouncedSearchText('')
      return
    }
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = undefined
      setDebouncedSearchText(text)
    }, SUGGEST_DEBOUNCE_MS)
  }

  const submit = () => {
    const keywords = searchText.trim()
    // Never navigate with an empty keyword — it renders a blank search page.
    if (!keywords) return
    // The trailing debounce would fire one more (now useless) suggest
    // request after navigating; cancel it.
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = undefined
    }
    navigate(`/search/${encodeURIComponent(keywords)}`)
  }

  return (
    <div
      className={cx(
        'relative',
        'bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20',
        'transition-all duration-100 ease-in',
        'rounded-full'
      )}
    >
      {/* Input */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cx(
          'app-region-no-drag flex cursor-text items-center rounded-full p-2.5',
          'text-black dark:text-white ',
          css`
            ${bp.lg} {
              min-width: 284px;
            }
          `
        )}
      >
        <SearchIcon />
        <input
          ref={inputRef}
          placeholder={t`search.search`.toString()}
          className={cx(
            'flex-shrink bg-transparent font-medium placeholder-black/60 outline-none dark:placeholder-white/60',
            css`
              @media (max-width: 420px) {
                width: 142px;
              }
            `
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={searchText}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => {
            if (e.key !== 'Enter') return
            // The Enter that confirms an IME composition (zh-CN input
            // methods report isComposing / keyCode 229) must not navigate.
            if (e.nativeEvent.isComposing || e.keyCode === 229) return
            e.preventDefault()
            submit()
          }}
        />
      </div>

      <SearchSuggestions
        searchText={searchText}
        debouncedSearchText={debouncedSearchText}
        isInputFocused={isFocused}
      />
    </div>
  )
}

export default SearchBox
