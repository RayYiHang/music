import { useQuery } from '@tanstack/react-query'
import { fetchAppleMusicAlbum } from '../appleMusic'

const useAppleMusicAlbum = (id: string | number) => {
  return useQuery({
    queryKey: ['useAppleMusicAlbum', id],
    queryFn: async () => {
      if (!id) return
      return fetchAppleMusicAlbum({ neteaseId: id })
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  })
}

export default useAppleMusicAlbum
