import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { cx } from '@emotion/css'
import useLyric from '@/web/api/hooks/useLyric'
import { lyricParser } from '@/web/utils/lyric'
import player from '@/web/states/player'
import { subscribeAudioTime } from '@/web/utils/audioTime'
import LyricsWindowTitleBar from '@/web/components/LyricsWindow/LyricsWindowTitleBar'

// Spring-ish easing standing in for the previous framer-motion spring
// ({ duration: 0.6, bounce: 0.36 }) — slight overshoot, driven by a plain
// CSS transition so no per-row animation instances exist.
const SPRING_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

/**
 * One lyric line. Props are minimal (two strings + one boolean) so memo()
 * stays effective: when the active line moves, only the two affected rows
 * re-render instead of the whole list rebuilding at 2Hz like before.
 */
const LyricRow = memo(
  ({
    index,
    lyric,
    tLyric,
    isActive,
  }: {
    index: number
    lyric?: string
    tLyric?: string
    isActive: boolean
  }) => {
    return (
      <div
        data-index={index}
        className={cx(
          'lyrics-row my-2 p-4 ease-in-out iterms-center text-center',
          'tracking-lyric leading-lyric text-md transition duration-400 dark:hover:bg-white/10 hover:bg-gray-500/10  rounded-lg',
          'font-barlow',
          isActive
            ? 'transition duration-400 font-bold text-accent-color-700 dark:text-accent-color-500 text-lg my-2' // 浅色模式使用700提高对比度，深色模式使用500
            : 'transition duration-400 text-black dark:text-white/90 ' // 提高非活跃行对比度
        )}
      >
        <div
          style={{
            transform: isActive ? 'translateY(0px)' : 'translateY(-5px)',
            transition: `transform 0.6s ${SPRING_EASE}`,
          }}
        >
          <span>{lyric}</span>
          {tLyric && (
            <>
              <br />
              <span>{tLyric}</span>
            </>
          )}
        </div>
      </div>
    )
  }
)
LyricRow.displayName = 'LyricRow'

/** Last line whose time <= t — O(log n) instead of the old O(n) scan. */
const findLineIndex = (time: number, lines: { time: number }[]) => {
  let lo = 0
  let hi = lines.length - 1
  let ans = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid].time <= time) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

const LyricsDesktop = memo(() => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  // Only re-renders when the active line actually changes.
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const { trackID } = useSnapshot(player)

  const lyricsRes = useLyric({ id: trackID })
  const lyricsResponse = lyricsRes.data

  // Parse once per lyric response — the full LRC regex parse used to run
  // in the render body twice a second.
  const { lyric: lyrics, tlyric: tlyric } = useMemo(
    () => lyricParser(lyricsResponse),
    [lyricsResponse]
  )

  const linesRef = useRef(lyrics)
  const lastIndexRef = useRef(-1)
  useEffect(() => {
    linesRef.current = lyrics
    lastIndexRef.current = -1
    setCurrentLineIndex(0)
  }, [lyrics])

  // Line tracking runs on the shared RAF loop (utils/audioTime.ts) reading
  // liveCurrentTime() — no per-frame React state, no 2Hz re-render from
  // snapshotting `progress`. The index guard means setState only fires
  // when the active line actually changes.
  useEffect(() => {
    return subscribeAudioTime(time => {
      const lines = linesRef.current
      if (lines.length === 0) return
      // +0.2s lead so lines highlight slightly early, as before.
      const index = findLineIndex(time + 0.2, lines)
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index
        setCurrentLineIndex(index)
      }
    })
  }, [])

  // Keep the active line centered.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || lyrics.length === 0) return
    const line = scroller.querySelector(
      `.lyrics-row[data-index='${currentLineIndex}']`
    ) as HTMLElement | null
    if (!line) return
    // Rect-based math — independent of offsetParent chains.
    const scrollerRect = scroller.getBoundingClientRect()
    const lineRect = line.getBoundingClientRect()
    const target =
      scroller.scrollTop +
      (lineRect.top - scrollerRect.top) +
      lineRect.height / 2 -
      scroller.clientHeight / 2
    scroller.scrollTo({ top: target, behavior: 'smooth' })
  }, [currentLineIndex, lyrics])

  const renderedLyrics = useMemo(() => {
    const maxLength = Math.max(lyrics.length, tlyric.length)
    return Array.from({ length: maxLength }, (_, index) => (
      <LyricRow
        key={index}
        index={index}
        lyric={lyrics[index]?.content}
        tLyric={tlyric[index]?.content}
        isActive={index === currentLineIndex}
      />
    ))
  }, [lyrics, tlyric, currentLineIndex])

  return (
    <>
      <LyricsWindowTitleBar />
      <div
        ref={scrollerRef}
        className={cx(
          'h-[600px] overflow-scroll rounded-md',
          'no-scrollbar text-center',
          'font-Roboto font-bold'
        )}
      >
        <div className={cx('inline-block py-80 text-center')}>
          {renderedLyrics.length == 0 ? <>Enjoy the music</> : renderedLyrics}
        </div>
      </div>
    </>
  )
})
LyricsDesktop.displayName = 'LyricsDesktop'

export default LyricsDesktop
