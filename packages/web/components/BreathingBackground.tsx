import { memo, useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import player from '@/web/states/player'
import settings, { isLowPowerDevice } from '@/web/states/settings'
import { resizeImage } from '@/web/utils/common'
import { subscribeAudioVolume } from '@/web/utils/audioVolume'

/**
 * Audio-reactive ambient background.
 *
 * Two copies of the same blurred cover (quiet + loud appearance) dimmed
 * by an overlay. The shared analyser loop writes `--vol` (0..1) to the
 * wrapper element; CSS cross-fades the loud copy in with `opacity` and
 * thins the overlay — both compositor-only properties, so no filter is
 * ever re-rasterized while music plays. No React re-renders happen on
 * the per-tick path.
 *
 * On low-power devices (autoLowPowerMode enabled) the second image
 * layer is skipped and only the overlay opacity pulses, halving the
 * background's texture memory while keeping the breathing effect.
 */
const BreathingBackground = memo(() => {
  const { track } = useSnapshot(player)
  const { enableBreathingEffect, theme, autoLowPowerMode } = useSnapshot(settings)
  const isDark = theme === 'dark'

  const coverUrl = track?.al?.picUrl || ''
  const rootRef = useRef<HTMLDivElement>(null)
  const lastVolRef = useRef<string | null>(null)
  const lowPower = autoLowPowerMode && isLowPowerDevice()

  useEffect(() => {
    if (!enableBreathingEffect) return
    const root = rootRef.current
    if (!root) return
    lastVolRef.current = null

    return subscribeAudioVolume(vol => {
      // Quantize to 2 decimals — when loudness is steady (pause,
      // silence, quiet passage) the CSS var stops being written at all.
      const value = vol.toFixed(2)
      if (lastVolRef.current === value) return
      lastVolRef.current = value
      root.style.setProperty('--vol', value)
    })
  }, [enableBreathingEffect])

  if (!enableBreathingEffect) return null

  return (
    <div
      ref={rootRef}
      className='breathing-bg pointer-events-none absolute inset-0 z-0'
      style={
        {
          ['--vol' as any]: 0,
          ['--cover-brightness' as any]: isDark ? 0.35 : 0.75,
          // "Loud" layer brightness, precomputed (cover-brightness + 0.4)
          // so no filter ever needs calc().
          ['--cover-brightness-loud' as any]: isDark ? 0.75 : 1.15,
          ['--overlay-color' as any]: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)',
        } as React.CSSProperties
      }
    >
      {coverUrl && (
        <>
          {/* Quiet layer — static filter, rasterized once. */}
          <div
            className='breathing-bg__cover absolute inset-0'
            style={{
              backgroundImage: `url(${resizeImage(coverUrl, 'xs')})`,
            }}
          />
          {/* Loud layer — same blurred cover with full punch, faded in
              with loudness (opacity only). */}
          {!lowPower && (
            <div
              className='breathing-bg__pulse absolute inset-0'
              style={{
                backgroundImage: `url(${resizeImage(coverUrl, 'xs')})`,
              }}
            />
          )}
        </>
      )}

      <div className='breathing-bg__overlay absolute inset-0' />
    </div>
  )
})
BreathingBackground.displayName = 'BreathingBackground'

export default BreathingBackground
