export enum SearchApiNames {
  Search = 'search',
  CloudSearch = 'cloudSearch',
  MultiMatchSearch = 'multiMatchSearch',
  FetchSearchSuggestions = 'fetchSearchSuggestions',
  FetchSearchHot = 'fetchSearchHot',
}

// 搜索
export enum SearchTypes {
  Single = '1',
  Album = '10',
  Artist = '100',
  Playlist = '1000',
  User = '1002',
  Mv = '1004',
  Lyrics = '1006',
  Radio = '1009',
  Video = '1014',
  All = '1018',
}
export interface SearchParams {
  keywords: string
  limit?: number // 返回数量 , 默认为 30
  offset?: number // 偏移数量，用于分页 , 如 : 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
  type: keyof typeof SearchTypes // type: 搜索类型
}
export interface SearchResponse {
  code: number
  result: {
    album: {
      albums: Album[]
      more: boolean
      moreText: string
      resourceIds: number[]
    }
    artist: {
      artists: Artist[]
      more: boolean
      moreText: string
      resourceIds: number[]
    }
    playList: {
      playLists: Playlist[]
      more: boolean
      moreText: string
      resourceIds: number[]
    }
    song: {
      songs: Track[]
      more: boolean
      moreText: string
      resourceIds: number[]
    }
    user: {
      users: User[]
      more: boolean
      moreText: string
      resourceIds: number[]
    }
    circle: unknown
    new_mlog: unknown
    order: string[]
    rec_type: null
    rec_query: null[]
    sim_query: unknown
    voice: unknown
    voiceList: unknown
  }
}

export interface CloudSearchResponse {
  code: number
  result: {
    // type=1 (Single)
    songCount?: number
    songs?: Track[]
    // type=10 (Album)
    albumCount?: number
    albums?: Album[]
    // type=100 (Artist)
    artistCount?: number
    artists?: Artist[]
    // type=1000 (Playlist)
    playlistCount?: number
    playlists?: Playlist[]
  }
}

// 搜索多重匹配
export interface MultiMatchSearchParams {
  keywords: string
}
export interface MultiMatchSearchResponse {
  code: number
  result: {
    album?: Album[]
    artist?: Artist[]
    playlist?: Playlist[]
    orpheus: unknown
    orders?: Array<'artist' | 'album'>
  }
}

// 搜索建议
export interface FetchSearchSuggestionsParams {
  keywords: string
  type?: 'mobile'
}
export interface FetchSearchSuggestionsResponse {
  code: number
  result: {
    albums?: Album[]
    artists?: Artist[]
    playlists?: Playlist[]
    songs?: Track[]
    order: Array<'songs' | 'artists' | 'albums' | 'playlists'>
  }
}

// 热搜列表（/search/hot/detail）
export interface FetchSearchHotResponse {
  code: number
  data: {
    searchWord: string
    score: number
    content?: string
    iconUrl?: string
    iconType?: number
    url?: string
  }[]
}
