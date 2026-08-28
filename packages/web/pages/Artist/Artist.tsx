import Header from './Header'
import Popular from './Popular'
import ArtistAlbum from './ArtistAlbums'
import FansAlsoLike from './FansAlsoLike'
import ArtistVideos from './ArtistVideos'
import ArtistSongs from './ArtistSongs'

const Artist = () => {
  return (
    <div>
      <Header />
      {/* Dividing line */}
      <div className='mb-7.5 mt-10 h-px w-full bg-black/20 dark:bg-white/20'></div>

      <Popular />

      {/* Dedicated "All songs" section — collapsed preview by default,
          expands in place (framer-motion height animation). Header and
          toggle live inside ArtistSongs. */}
      <div className='mb-7.5 mt-10 h-px w-full bg-black/20 dark:bg-white/20'></div>
      <ArtistSongs />

      <ArtistAlbum />
      <ArtistVideos />
      <FansAlsoLike />
      {/* Page padding */}
      <div className='h-16'></div>
    </div>
  )
}

export default Artist
