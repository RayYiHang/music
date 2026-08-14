import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import {
  cloudSearch,
  fetchSearchSuggestions,
  multiMatchSearch,
} from '@/web/api/search'
import {
  CloudSearchResponse,
  FetchSearchSuggestionsResponse,
  MultiMatchSearchResponse,
  SearchApiNames,
  SearchTypes,
} from '@/shared/api/Search'

// The server can answer 200 OK with an error body (code !== 200). Surface
// those as real errors so react-query can retry and the UI can show an
// error state instead of silently rendering an empty page.
const ensureOk = <T extends { code?: number }>(response: T): T => {
  if (!response || response.code !== 200) {
    throw new Error(`search api error, code: ${response?.code}`)
  }
  return response
}

const hasKeywords = (keywords: string) => keywords.trim().length > 0

// 搜索建议 (SearchBox dropdown)
export function useSearchSuggestions(keywords: string) {
  return useQuery<FetchSearchSuggestionsResponse>({
    queryKey: [SearchApiNames.FetchSearchSuggestions, keywords],
    queryFn: ({ signal }) =>
      fetchSearchSuggestions({ keywords }, { signal }).then(ensureOk),
    enabled: hasKeywords(keywords),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}

// 搜索多重匹配 (best match)
export function useSearchBestMatch(keywords: string) {
  return useQuery<MultiMatchSearchResponse>({
    queryKey: [SearchApiNames.MultiMatchSearch, keywords],
    queryFn: ({ signal }) => multiMatchSearch({ keywords }, { signal }).then(ensureOk),
    enabled: hasKeywords(keywords),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}

// Per-type cloudsearch. NOTE: we deliberately do NOT use the aggregated
// type=1018 (All) call here: the shape of its 1018 response is not typed in
// @neteasecloudmusicapienhanced/api (see module/cloudsearch.js — it only
// forwards the query), so per-type requests keep the response contract
// verifiable. All queries are cached + abortable instead.
export function useSearchResults(
  keywords: string,
  type: keyof typeof SearchTypes,
  limit = 30
) {
  return useQuery<CloudSearchResponse>({
    queryKey: [SearchApiNames.CloudSearch, keywords, type, limit],
    queryFn: ({ signal }) =>
      cloudSearch({ keywords, limit, offset: 0, type }, { signal }).then(
        ensureOk
      ),
    enabled: hasKeywords(keywords),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}

const SEARCH_PAGE_SIZE = 30

// 云搜索 - 单曲 (infinite)
export function useSearchTracksInfinite(keywords: string) {
  return useInfiniteQuery({
    queryKey: [SearchApiNames.CloudSearch, keywords, 'Single', 'infinite'],
    queryFn: ({ pageParam = 0, signal }) =>
      cloudSearch(
        {
          keywords,
          limit: SEARCH_PAGE_SIZE,
          offset: pageParam * SEARCH_PAGE_SIZE,
          type: 'Single',
        },
        { signal }
      ).then(ensureOk),
    enabled: hasKeywords(keywords),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const songCount = lastPage?.result?.songCount ?? 0
      return pages.length * SEARCH_PAGE_SIZE < songCount
        ? pages.length
        : undefined
    },
  })
}
