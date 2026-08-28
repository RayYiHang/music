import { css, cx } from '@emotion/css'
import Icon from '../Icon'
import { breakpoint as bp } from '@/web/utils/const'
import { useTranslation } from 'react-i18next'
import uiStates from '@/web/states/uiStates'

function SearchIcon() {
  return (
    <div>
      <Icon name='search' className='mr-2.5 h-7 w-7' />
    </div>
  )
}

const SearchBox = () => {
  const { t } = useTranslation()
  const openSearchModal = () => {
    uiStates.showSearchModal = true
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
      {/* Trigger — opens the Spotlight-style SearchModal */}
      <div
        role='button'
        tabIndex={0}
        onClick={openSearchModal}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') openSearchModal()
        }}
        // Double-clicks (e.g. select-all attempts) must not bubble to
        // TopbarDesktop's onDoubleClick={maxRestore} and toggle the window.
        onDoubleClick={e => e.stopPropagation()}
        className={cx(
          'app-region-no-drag flex cursor-text items-center rounded-full p-2.5',
          'text-black dark:text-white',
          css`
            ${bp.lg} {
              min-width: 284px;
            }
          `
        )}
      >
        <SearchIcon />
        <div
          className={cx(
            'shrink font-medium text-black/60 dark:text-white/60',
            css`
              @media (max-width: 420px) {
                width: 142px;
              }
            `
          )}
        >
          {t`search.search`.toString()}
        </div>
        <div className='grow'></div>
      </div>
    </div>
  )
}

export default SearchBox
