import player from '@/web/states/player'
import { resizeImage } from '@/web/utils/common'
import dayjs from 'dayjs'
import { useMemo, useCallback, useState, useRef, memo } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import Image from '@/web/components/Image'
import Icon from '@/web/components/Icon'
import { cx } from '@emotion/css'
import CoverRowVirtual from '@/web/components/CoverRowVirtual'
import { Virtuoso } from 'react-virtuoso'
import { useTranslation } from 'react-i18next'
import Loading from '@/web/components/Animation/Loading'
import {
  useSearchBestMatch,
  useSearchResults,
  useSearchTracksInfinite,
} from '@/web/api/hooks/useSearch'

type SearchTab = 'all' | 'tracks' | 'artists' | 'albums' | 'playlists'

const TAB_LABEL_KEYS: Record<SearchTab, string> = {
  all: 'search.all',
  tracks: 'search.song',
  artists: 'search.artist',
  albums: 'search.album',
  playlists: 'search.playlist',
}

const TRACKS_PREVIEW_COUNT = 30
const TRACKS_GRID_COLUMNS = 3

const Artists = ({ artists }: { artists: Artist[] }) => {
  const navigate = useNavigate()
  return (
    <>
      {artists.map(artist => (
        <div
          onClick={() => navigate(`/artist/${artist.id}`)}
          key={artist.id}
          className='flex cursor-pointer items-center py-2.5'
        >
          <img
            src={resizeImage(artist.img1v1Url, 'xs')}
            className='mr-4 h-14 w-14 rounded-full'
          />
          <div>
            <div className='text-lg font-semibold'>{artist.name}</div>
            <div className='mt-0.5 text-sm font-semibold opacity-60'>
              {artist.occupation || 'Artist'}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

const Albums = ({ albums }: { albums: Album[] }) => {
  const navigate = useNavigate()
  return (
    <>
      {albums.map(album => (
        <div
          onClick={() => navigate(`/album/${album.id}`)}
          key={album.id}
          className='flex cursor-pointer items-center py-2.5'
        >
          <img src={resizeImage(album.picUrl, 'xs')} className='mr-4 h-14 w-14 rounded-lg' />
          <div>
            <div className='text-lg font-semibold'>{album.name}</div>
            <div className='mt-0.5 text-sm font-semibold opacity-60'>
              {album?.artist?.name} · {dayjs(album.publishTime).year()}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

const TrackItem = memo(
  ({
    track,
    onPlay,
    hint,
  }: {
    track?: Track
    onPlay: (id: number) => void
    hint?: string
  }) => {
    return (
      <div
        title={hint}
        className='flex cursor-pointer items-center justify-between'
        onClick={e => {
          if (e.detail === 2 && track?.id) onPlay(track.id)
        }}
      >
        <Image
          className='mr-4 aspect-square h-14 w-14 shrink-0 rounded-12'
          src={resizeImage(track?.al?.picUrl || '', 'sm')}
          animation={false}
          placeholder={false}
        />
        <div className='mr-3 grow'>
          <div className='line-clamp-1 text-16 font-medium text-neutral-700 dark:text-neutral-200'>
            {track?.name}
          </div>
          <div className='line-clamp-1 mt-1 text-14 font-bold text-neutral-700 dark:text-neutral-300'>
            {track?.ar?.map(a => a.name).join(', ')}
          </div>
        </div>
      </div>
    )
  }
)
TrackItem.displayName = 'SearchTrackItem'

const SectionError = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation()
  return (
    <div className='flex flex-col items-center justify-center gap-3 py-10'>
      <div className='text-14 font-bold text-neutral-700 dark:text-neutral-300'>
        {t`search.error`}
      </div>
      <button
        onClick={onRetry}
        className='flex items-center gap-1.5 rounded-full bg-black/10 px-4 py-1.5 text-14 font-bold text-neutral-800 hover:bg-black/20 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20'
      >
        <Icon name='refresh' className='h-4 w-4' />
        {t`search.retry`}
      </button>
    </div>
  )
}

const SectionHeader = ({
  title,
  hint,
  onShowAll,
}: {
  title: string
  hint?: string
  onShowAll?: () => void
}) => {
  const { t } = useTranslation()
  return (
    <div className='mb-2 flex items-baseline gap-3'>
      <div className='text-14 font-bold uppercase'>{title}</div>
      {hint && <div className='text-12 font-medium opacity-50'>{hint}</div>}
      {onShowAll && (
        <div
          onClick={onShowAll}
          className='ml-auto flex cursor-pointer items-center gap-1 text-12 font-bold uppercase opacity-70 hover:opacity-100'
        >
          {t`search.show-all`}
          <Icon name='right-arrow' className='flex h-4 w-4 items-center' />
        </div>
      )}
    </div>
  )
}

// Stable Footer — receives loading state via Virtuoso's `context` prop so its
// component identity never changes (prevents Virtuoso remount).
const TrackListFooter: React.ComponentType<{
  context?: { isLoadingMore: boolean }
}> = ({ context }) => (
  <div className='flex h-16 items-center justify-center'>
    {context?.isLoadingMore && <Loading />}
  </div>
)

// Stable components object — created once at module level so Virtuoso never
// sees a new reference and never remounts.
const trackListComponents = { Footer: TrackListFooter }

const chunkTracks = (tracks: Track[]): Track[][] => {
  const rows: Track[][] = []
  for (let i = 0; i < tracks.length; i += TRACKS_GRID_COLUMNS) {
    rows.push(tracks.slice(i, i + TRACKS_GRID_COLUMNS))
  }
  return rows
}

const Search = () => {
  const { keywords = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<SearchTab>('all')

  const bestMatchQuery = useSearchBestMatch(keywords)
  const tracksQuery = useSearchTracksInfinite(keywords)
  const artistQuery = useSearchResults(keywords, 'Artist', 30)
  const albumQuery = useSearchResults(keywords, 'Album', 30)
  const playlistQuery = useSearchResults(keywords, 'Playlist', 50)

  const queries = [bestMatchQuery, tracksQuery, artistQuery, albumQuery, playlistQuery]
  const isFetching = queries.some(q => q.isFetching)
  const hasAnyData = queries.some(q => q.data !== undefined)
  const hasError = queries.some(q => q.isError)
  // Full-page spinner only while nothing has rendered yet; once any query
  // resolves, sections stream in independently. keepPreviousData makes
  // keyword changes stale-while-revalidate instead of a loading flash.
  const showInitialLoader =
    keywords.length > 0 && !hasAnyData && queries.some(q => q.isLoading)

  const retryAll = useCallback(() => {
    queries.forEach(q => q.isError && q.refetch())
  }, [bestMatchQuery, tracksQuery, artistQuery, albumQuery, playlistQuery])

  const tracks = useMemo(
    () => tracksQuery.data?.pages.flatMap(page => page?.result?.songs ?? []) ?? [],
    [tracksQuery.data]
  )

  const artists = artistQuery.data?.result?.artists ?? []
  const albums = albumQuery.data?.result?.albums ?? []
  const playlists = playlistQuery.data?.result?.playlists ?? []

  // 最佳匹配
  const bestMatch = useMemo(() => {
    const result = bestMatchQuery.data?.result
    if (!result) return []
    return (result.orders ?? [])
      .filter(order => ['album', 'artist'].includes(order))
      .map(order => result[order]?.[0])
      .filter(Boolean)
      .slice(0, 2)
  }, [bestMatchQuery.data?.result])

  // A successful zero-result response still defines `data` — test content
  // emptiness, not data presence, or the "no results" state never shows.
  const showEmptyState =
    keywords.length > 0 &&
    !showInitialLoader &&
    !isFetching &&
    !hasError &&
    queries.every(q => !q.isLoading) &&
    tracks.length === 0 &&
    artists.length === 0 &&
    albums.length === 0 &&
    playlists.length === 0 &&
    bestMatch.length === 0

  // Keep onPlay identity stable so memoized TrackItems don't all re-render
  // when a new infinite page is appended.
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks
  const playHint = t`search.double-click-to-play`
  const handlePlayTracks = useCallback(
    (trackID: number | null = null) => {
      const list = tracksRef.current
      if (!list.length) {
        toast(t`common.no-playable-tracks` || '无法播放')
        return
      }
      player.playAList(
        list.map(track => track.id),
        trackID
      )
    },
    [t]
  )

  const navigateBestMatch = useCallback(
    (match: Artist | Album) => {
      if ((match as Artist).albumSize !== undefined) {
        navigate(`/artist/${match.id}`)
      } else if ((match as Album).artist !== undefined) {
        navigate(`/album/${match.id}`)
      }
    },
    [navigate]
  )

  const trackRows = useMemo(() => chunkTracks(tracks), [tracks])

  const handleEndReached = useCallback(() => {
    const { hasNextPage, isFetchingNextPage, fetchNextPage } = tracksQuery
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [tracksQuery.hasNextPage, tracksQuery.isFetchingNextPage, tracksQuery.fetchNextPage])

  const virtuosoContext = useMemo(
    () => ({ isLoadingMore: tracksQuery.isFetchingNextPage }),
    [tracksQuery.isFetchingNextPage]
  )

  const trackListItemContent = useCallback(
    (_index: number, row: Track[]) => (
      <div className='grid grid-cols-3 gap-5 gap-y-6 py-1'>
        {row.map(track => (
          <TrackItem key={track.id} track={track} onPlay={handlePlayTracks} hint={playHint} />
        ))}
      </div>
    ),
    [handlePlayTracks, playHint]
  )

  const tabs: SearchTab[] = ['all', 'tracks', 'artists', 'albums', 'playlists']

  return (
    <div>
      <div className='mt-6 mb-8 flex items-center gap-3 text-4xl font-semibold'>
        <span>
          {t`search.search`} &quot;{keywords}&quot;
        </span>
        {isFetching && (
          <span className='h-2.5 w-2.5 animate-pulse rounded-full bg-brand-700' />
        )}
      </div>

      {/* Tabs */}
      <div className='mb-6 flex gap-2'>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cx(
              'rounded-full px-4 py-1.5 text-14 font-bold transition-colors',
              activeTab === tab
                ? 'bg-brand-700 text-white'
                : 'bg-black/10 text-neutral-800 hover:bg-black/20 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20'
            )}
          >
            {t(TAB_LABEL_KEYS[tab])}
          </button>
        ))}
      </div>

      {showInitialLoader && (
        <div className='flex h-40 items-center justify-center'>
          <Loading />
        </div>
      )}

      {showEmptyState && (
        <div className='flex h-40 items-center justify-center text-14 font-bold text-neutral-700 opacity-50 dark:text-neutral-300'>
          {t`search.no-results`}
        </div>
      )}

      {hasError && !hasAnyData && !showInitialLoader && <SectionError onRetry={retryAll} />}

      {!showInitialLoader && !showEmptyState && activeTab === 'all' && (
        <>
          {/* 最佳匹配 */}
          {bestMatch.length > 0 && (
            <div className='mb-6'>
              <SectionHeader title={t`search.best-match`} />
              <div className='grid grid-cols-2'>
                {bestMatch.map((match: any) => (
                  <div
                    onClick={() => navigateBestMatch(match)}
                    key={`${match.id}${match.picUrl}`}
                    className='btn-hover-animation flex cursor-pointer items-center py-3 after:rounded-xl after:bg-gray-100 dark:after:bg-white/10'
                  >
                    <img
                      src={resizeImage(match.picUrl, 'xs')}
                      className={cx(
                        'mr-6 h-20 w-20',
                        match.occupation === '歌手' ? 'rounded-full' : 'rounded-xl'
                      )}
                    />
                    <div>
                      <div className='text-xl font-semibold'>{match.name}</div>
                      <div className='mt-0.5 font-medium opacity-60'>
                        {match.occupation === '歌手'
                          ? t`search.artist`
                          : `${match.artist?.name} · ${dayjs(match.publishTime).year()}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='grid grid-cols-2 gap-6'>
            {artists.length > 0 && (
              <div>
                <SectionHeader title={t`search.artist`} />
                <Artists artists={artists.slice(0, 5)} />
              </div>
            )}
            {albums.length > 0 && (
              <div>
                <SectionHeader title={t`search.album`} />
                <Albums albums={albums.slice(0, 5)} />
              </div>
            )}

            {(tracksQuery.isError || tracks.length > 0) && (
              <div className='col-span-2'>
                <SectionHeader
                  title={t`search.song`}
                  hint={playHint}
                  onShowAll={() => setActiveTab('tracks')}
                />
                {tracksQuery.isError && tracks.length === 0 ? (
                  <SectionError onRetry={tracksQuery.refetch} />
                ) : (
                  <div className='mt-4 grid grid-cols-3 gap-5 gap-y-6 pb-6'>
                    {tracks
                      .slice(0, TRACKS_PREVIEW_COUNT)
                      .map(track => (
                        <TrackItem
                          key={track.id}
                          track={track}
                          onPlay={handlePlayTracks}
                          hint={playHint}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}

            {playlists.length > 0 && (
              <div className='col-span-2'>
                <SectionHeader title={t`search.playlist`} />
                <CoverRowVirtual playlists={playlists} />
              </div>
            )}
          </div>
        </>
      )}

      {!showInitialLoader && !showEmptyState && activeTab === 'tracks' && (
        <div>
          <SectionHeader title={t`search.song`} hint={playHint} />
          {tracksQuery.isError && tracks.length === 0 ? (
            <SectionError onRetry={tracksQuery.refetch} />
          ) : (
            <Virtuoso
              className='no-scrollbar'
              style={{ height: 'calc(100vh - 260px)' }}
              components={trackListComponents}
              context={virtuosoContext}
              data={trackRows}
              overscan={800}
              defaultItemHeight={96}
              increaseViewportBy={{ top: 400, bottom: 800 }}
              endReached={handleEndReached}
              itemContent={trackListItemContent}
            />
          )}
        </div>
      )}

      {!showInitialLoader && !showEmptyState && activeTab === 'artists' && (
        <div>
          <SectionHeader title={t`search.artist`} />
          {artistQuery.isError ? (
            <SectionError onRetry={artistQuery.refetch} />
          ) : (
            <Artists artists={artists} />
          )}
        </div>
      )}

      {!showInitialLoader && !showEmptyState && activeTab === 'albums' && (
        <div>
          <SectionHeader title={t`search.album`} />
          {albumQuery.isError ? (
            <SectionError onRetry={albumQuery.refetch} />
          ) : (
            <Albums albums={albums} />
          )}
        </div>
      )}

      {!showInitialLoader && !showEmptyState && activeTab === 'playlists' && (
        <div>
          <SectionHeader title={t`search.playlist`} />
          {playlistQuery.isError ? (
            <SectionError onRetry={playlistQuery.refetch} />
          ) : (
            <CoverRowVirtual playlists={playlists} />
          )}
        </div>
      )}
    </div>
  )
}

export default Search
