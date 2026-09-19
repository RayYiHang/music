import DOMPurify from 'dompurify'

// 歌单/专辑/歌手简介来自上游 API（网易云、Apple Music），按不可信文本处理。
// 只放行有限的排版标签；DOMPurify 会剥掉事件属性、javascript: URL 等危险内容。
const ALLOWED_TAGS = ['a', 'b', 'i', 'em', 'strong', 'u', 'br', 'p']
const ALLOWED_ATTR = ['href']

export function sanitizeDescriptionHtml(description: string | undefined | null): string {
  if (!description) return ''
  return DOMPurify.sanitize(description, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}
