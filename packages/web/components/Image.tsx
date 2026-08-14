import { css, cx } from '@emotion/css'
import { useEffect, useRef, useState } from 'react'
import { ease } from '@/web/utils/const'
import useIsMobile from '@/web/hooks/useIsMobile'

// Fade-in on load — a plain CSS class toggle, visually equivalent to the
// previous per-image framer-motion animation but with zero JS animation
// instances. Non-virtualized pages (Discover cover walls, CoverRow) mount
// dozens of these during scroll, so each Image must stay cheap: no
// IntersectionObserver, no preloader promise, no animation objects.
const fadeInClass = css`
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(${ease.join(', ')});
  &.img-loaded {
    opacity: 1;
  }
`

type Props = {
  src?: string
  srcSet?: string
  sizes?: string
  className?: string
  lazyLoad?: boolean
  placeholder?: 'artist' | 'album' | 'playlist' | 'podcast' | 'blank' | false
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void
  onMouseOver?: (e: React.MouseEvent<HTMLImageElement>) => void
  animation?: boolean
  fetchPriority?: 'high' | 'auto' | 'low'
}

const ImageDesktop = ({
  src,
  srcSet,
  className,
  lazyLoad = true,
  sizes,
  placeholder = 'blank',
  onClick,
  onMouseOver,
  animation = true,
  fetchPriority = 'auto',
}: Props) => {
  const [loaded, setLoaded] = useState(false)
  const isMobile = useIsMobile()
  const isAnimate = animation && !isMobile
  const imgRef = useRef<HTMLImageElement>(null)

  // Reset state when src changes
  useEffect(() => {
    setLoaded(false)
  }, [src])

  // Cached images can finish loading before React attaches onLoad — check
  // `complete` so the fade doesn't leave the image stuck at opacity 0.
  useEffect(() => {
    if (src && imgRef.current?.complete) setLoaded(true)
  }, [src])

  return (
    <div
      onClick={onClick}
      onMouseOver={onMouseOver}
      className={cx(
        'overflow-hidden',
        className,
        className?.includes('absolute') === false && 'relative'
      )}
    >
      {src && (
        <img
          ref={imgRef}
          className={cx(
            'absolute inset-0 h-full w-full',
            isAnimate && fadeInClass,
            isAnimate && loaded && 'img-loaded'
          )}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          decoding='async'
          loading={lazyLoad ? 'lazy' : undefined}
          fetchPriority={fetchPriority}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}

      {placeholder && !loaded && (
        <div className='absolute inset-0 h-full w-full bg-black/10 dark:bg-white/10'></div>
      )}
    </div>
  )
}

const ImageMobile = (props: Props) => {
  const { src, className, srcSet, sizes, lazyLoad, onClick, onMouseOver, fetchPriority = 'auto' } = props
  return (
    <div
      onClick={onClick}
      onMouseOver={onMouseOver}
      className={cx(
        'overflow-hidden',
        className,
        className?.includes('absolute') === false && 'relative'
      )}
    >
      {src && (
        <img
          className='absolute inset-0 h-full w-full'
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          decoding='async'
          loading={lazyLoad ? 'lazy' : undefined}
          fetchPriority={fetchPriority}
        />
      )}
    </div>
  )
}

const Image = (props: Props) => {
  const isMobile = useIsMobile()
  return isMobile ? <ImageMobile {...props} /> : <ImageDesktop {...props} />
}

export default Image
