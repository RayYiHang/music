import { cx } from '@emotion/css'
import Icon from './Icon'
import { IconNames } from './Icon/iconNamesType'

function Tabs<T>({
  tabs,
  value,
  onChange,
  className,
  style,
}: {
  tabs: {
    id: T
    name: string
    iconName?: IconNames
  }[]
  value: string
  onChange: (id: T) => void
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cx('no-scrollbar flex flex-wrap gap-4 overflow-y-auto', className)}
      style={style}
    >
      {tabs.map(tab => (
        <div
          key={tab.id as string}
          className={cx(
            // No backdrop-blur: these chips sit above the virtualized
            // grid, and a backdrop-filter re-filtered the scrolling
            // covers behind every chip on every frame. The slightly
            // raised tint below keeps the same legibility.
            'mr-1 whitespace-nowrap rounded-12 px-6 py-3 text-16 font-medium transition duration-500',
            'dark:bg-white/15 dark:text-white/80 hover:dark:bg-white/25 ',
            'bg-black/15 text-black/80 hover:bg-black/25',
            value === tab.id &&
              'bg-accent-color-400 text-black/80 dark:bg-neutral-500 dark:text-white/80',
            tab.iconName && 'iterms-center flex flex-row gap-1 '
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.iconName && <Icon name={tab.iconName} className='h-5 w-5' />}
          {tab.name}
        </div>
      ))}
    </div>
  )
}

export default Tabs
