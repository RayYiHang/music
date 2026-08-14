import request from '@/web/utils/request'
import {
  SearchParams,
  SearchTypes,
  MultiMatchSearchParams,
  MultiMatchSearchResponse,
  FetchSearchSuggestionsParams,
  FetchSearchSuggestionsResponse,
  CloudSearchResponse,
} from '@/shared/api/Search'

// Search endpoints are interactive; a stuck request should fail fast so
// react-query can retry/refetch instead of hanging for the 50s default.
export interface SearchRequestConfig {
  signal?: AbortSignal
  timeout?: number
}

const SEARCH_TIMEOUT = 15000

// 云搜索
export function cloudSearch(
  params: SearchParams,
  config: SearchRequestConfig = {}
): Promise<CloudSearchResponse> {
  return request({
    url: '/cloudsearch',
    method: 'get',
    timeout: config.timeout ?? SEARCH_TIMEOUT,
    signal: config.signal,
    params: {
      ...params,
      type: SearchTypes[params.type],
    },
  })
}

// 搜索多重匹配
export function multiMatchSearch(
  params: MultiMatchSearchParams,
  config: SearchRequestConfig = {}
): Promise<MultiMatchSearchResponse> {
  return request({
    url: '/search/multimatch',
    method: 'get',
    timeout: config.timeout ?? SEARCH_TIMEOUT,
    signal: config.signal,
    params: params,
  })
}

// 搜索建议
export function fetchSearchSuggestions(
  params: FetchSearchSuggestionsParams,
  config: SearchRequestConfig = {}
): Promise<FetchSearchSuggestionsResponse> {
  return request({
    url: '/search/suggest',
    method: 'get',
    timeout: config.timeout ?? SEARCH_TIMEOUT,
    signal: config.signal,
    params,
  })
}
