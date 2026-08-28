import { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import { AnimatePresence, motion } from 'framer-motion'
import { Virtuoso } from 'react-virtuoso'
import { css, cx } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import Icon from '@/web/components/Icon'
import Wave from '@/web/components/Animation/Wave'
import Loading from '@/web/components/Animation/Loading'
import { openContextMenu } from '@/web/states/contextMenus'
import player from '@/web/states/player'
import settings from '@/web/states/settings'
import { ease } from '@/web/utils/const'
import { downloadTrack } from '@/web/utils/download'
import { fetchArtistSongs } from '@/web/api/artist'
import { formatDuration, resizeImage } from '@/web/utils/common'

const PAGE_SIZE = 50
const COLLAPSED_HEIGHT = 264 // ≈3 rows — a preview, not a scroll area
const EXPANDED_VIEWPORT_RATIO = 0.72

// One virtualized row — same layout as the track lists elsewhere in the
// app (cover / name+artists / album / duration), plus hover download
// gated behind settings.showDownloadActions.
const Row = memo(
  ({
    track,
    index,
    isPlaying,
    state,
    showDownloadActions,
    onPlay,
  }: {
    track: Track
    index: number
    isPlaying: boolean
    state: string
    showDownloadActions: boolean
    onPlay: (id: number) => void
  }) => {
    return (
      <div
        className={cx(
          'group p-1 mb-3 grid duration-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-12',
          css`
            grid-template-columns: 3fr 2fr 1fr;
          `
        )}
        onClick={e => {
          if (e.detail === 2) onPlay(track.id)
        }}
        onContextMenu={e => {
          e.preventDefault()
          openContextMenu({
            event: e,
            type: 'track',
            dataSourceID: track.id,
            options: { useCursorPosition: true },
          })
        }}
      >
        <div className='flex items-center'>
          {/* Index / playing wave */}
          <div className='mr-4 w-6 shrink-0 text-right text-14 font-bold text-black/40 dark:text-white/40'>
            {isPlaying ? <Wave playing={state === 'playing'} /> : index + 1}
          </div>
          <img
            alt='Cover'
            className='mr-4 aspect-square h-14 w-14 shrink-0 rounded-12'
            src={resizeImage(track.al?.picUrl || '', 'sm')}
            loading='lazy'
            decoding='async'
          />
          <div className='mr-3 min-w-0'>
            <div
              className={cx(
                'line-clamp-1 flex items-center text-16 font-medium transition-colors duration-500',
                isPlaying ? 'text-brand-700' : 'text-neutral-700 dark:text-neutral-200'
              )}
            >
              {track.name}
              {[1318912, 1310848].includes(track.mark || 0) && (
                <Icon name='explicit' className='ml-2 mt-px mr-4 h-3.5 w-3.5' />
              )}
            </div>
            <div className='line-clamp-1 mt-1 text-14 font-bold'>
              {track.ar?.map((a, idx) => (
                <Fragment key={`${a.id}-${idx}`}>
                  {idx > 0 && ', '}
                  {a.name}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className='flex items-center'>
          <div className='line-clamp-1 text-14 font-bold text-neutral-700 dark:text-neutral-300'>
            {track.al?.name}
          </div>
        </div>

        <div className='line-clamp-1 flex items-center justify-end text-14 font-bold'>
          {showDownloadActions && (
            <button
              className='mr-2 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-black/30 dark:hover:bg-white/30'
              onClick={e => {
                e.stopPropagation()
                downloadTrack(track.id)
              }}
            >
              <Icon name='download' className='h-4 w-4' />
            </button>
          )}
          {formatDuration(track.dt || 0, 'en-US', 'hh:mm:ss')}
        </div>
      </div>
    )
  }
)
Row.displayName = 'ArtistSongsRow'

const ListFooter = ({ context }: { context?: { isLoadingMore: boolean } }) => (
  <div className='flex h-16 items-center justify-center'>
    {context?.isLoadingMore && <Loading />}
  </div>
)
const listComponents = { Footer: ListFooter }

const ArtistSongs = () => {
  const params = useParams()
  const { t } = useTranslation()
  const artistID = Number(params.id) || 0

  const [expanded, setExpanded] = useState(false)

  const { trackID, state } = useSnapshot(player)
  const { showDownloadActions } = useSnapshot(settings)

  const songsQuery = useInfiniteQuery({
    queryKey: ['artist-all-songs', artistID],
    queryFn: ({ pageParam = 0 }) =>
      fetchArtistSongs({
        id: artistID,
        // order=time breaks has-more paging on this endpoint — keep ''.
        order: '',
        limit: PAGE_SIZE,
        offset: (pageParam as number) * PAGE_SIZE,
      }),
    enabled: artistID > 0,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage?.more ? pages.length : undefined),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const songs = useMemo(() => {
    const seen = new Set<number>()
    const list: Track[] = []
    songsQuery.data?.pages.forEach(page =>
      page?.songs?.forEach(song => {
        if (seen.has(song.id)) return
        seen.add(song.id)
        list.push(song)
      })
    )
    return list
  }, [songsQuery.data])

  const songIDs = useMemo(() => songs.map(s => s.id), [songs])

  const onPlay = useCallback(
    (id: number) => {
      player.playAList(songIDs, id)
    },
    [songIDs]
  )

  const handleEndReached = useCallback(() => {
    if (expanded && songsQuery.hasNextPage && !songsQuery.isFetchingNextPage) {
      songsQuery.fetchNextPage()
    }
  }, [expanded, songsQuery.hasNextPage, songsQuery.isFetchingNextPage, songsQuery.fetchNextPage])

  // Numbers, not vh strings — framer-motion animates between unitless
  // pixel values cleanly; vh↔px interpolation would jump.
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight)
  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const expandedHeight = Math.round(viewportHeight * EXPANDED_VIEWPORT_RATIO)

  const virtuosoContext = useMemo(
    () => ({ isLoadingMore: songsQuery.isFetchingNextPage }),
    [songsQuery.isFetchingNextPage]
  )

  const itemContent = useCallback(
    (index: number, track: Track) => (
      <Row
        key={track.id}
        track={track}
        index={index}
        isPlaying={track.id === trackID}
        state={state}
        showDownloadActions={showDownloadActions}
        onPlay={onPlay}
      />
    ),
    [trackID, state, showDownloadActions, onPlay]
  )

  return (
    <div>
      {/* Section header + expand/collapse toggle */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='text-12 font-medium uppercase text-neutral-700 dark:text-neutral-300'>
          {t`artist.all-songs`}
          {songs.length > 0 && (
            <span className='ml-2 text-black/40 dark:text-white/40'>{songs.length}</span>
          )}
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className='flex items-center gap-1 text-12 font-bold uppercase text-black/70 transition-colors hover:text-black dark:text-white/70 dark:hover:text-white'
        >
          {expanded ? t`artist.collapse` : t`artist.expand`}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3, ease }}>
            <Icon name='dropdown-triangle' className='h-2.5 w-2.5' />
          </motion.span>
        </button>
      </div>

      {/* Animated viewport: collapsed = short preview, expanded = large
          scroll area. Height animation pushes the sections below down and
          pulls them back up on collapse (framer-motion, ease curve). The
          list keeps its OWN scroll container — a customScrollParent tied
          to #main made Virtuoso overlap the following sections. */}
      <motion.div
        className='relative overflow-hidden'
        initial={false}
        animate={{ height: expanded ? expandedHeight : COLLAPSED_HEIGHT }}
        transition={{ duration: 0.45, ease }}
      >
        <Virtuoso
          className='no-scrollbar h-full'
          data={songs}
          components={listComponents}
          context={virtuosoContext}
          computeItemKey={(_, track) => track.id}
          itemContent={itemContent}
          endReached={handleEndReached}
          defaultItemHeight={72}
          increaseViewportBy={{ top: 800, bottom: 1200 }}
          overscan={800}
        />
        {/* Collapsed: fade the last visible row out so the cut reads as
            "there is more", and block stray clicks on the half-shown row. */}
        <AnimatePresence>
          {!expanded && (
            <motion.div
              className={cx(
                'pointer-events-none absolute bottom-0 left-0 right-0 h-20',
                css`
                  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.92));
                  .dark & {
                    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.6));
                  }
                `
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default ArtistSongs
