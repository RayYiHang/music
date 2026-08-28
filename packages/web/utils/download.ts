import player from '@/web/states/player'
import toast from 'react-hot-toast'
import i18n from '@/web/i18n/i18n'
import { fetchTracksWithReactQuery } from '@/web/api/hooks/useTracks'

/**
 * Download a track's audio file. Gated behind `settings.showDownloadActions`
 * at the UI layer — this util only performs the download itself.
 *
 * The audio URL comes from the NetEase CDN (cross-origin). A blob download
 * preserves the pretty filename; if the fetch is blocked (browser web build),
 * fall back to a plain link and let the browser handle it.
 */
export async function downloadTrack(trackID: number) {
  try {
    const [source, tracks] = await Promise.all([
      player.getAudioSource(trackID),
      fetchTracksWithReactQuery({ ids: [trackID] }),
    ])
    const url = source.audio
    if (!url) {
      toast.error(i18n.t('toasts.download-failed'))
      return
    }
    const track = tracks?.songs?.[0]
    const artists = track?.ar?.map(a => a.name).join(', ')
    const filename = `${artists ? `${artists} - ` : ''}${track?.name ?? String(trackID)}.mp3`
    toast.success(i18n.t('toasts.download-started'))
    try {
      const blob = await (await fetch(url)).blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch {
      // Cross-origin fetch blocked — plain link; the browser may pick its own
      // filename. In Electron this still downloads without opening a tab.
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.target = '_blank'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  } catch {
    toast.error(i18n.t('toasts.download-failed'))
  }
}
