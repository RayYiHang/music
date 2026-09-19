import { describe, expect, it } from 'vitest'
import { sanitizeDescriptionHtml } from '@/web/utils/sanitizeHtml'

describe('sanitizeDescriptionHtml', () => {
  it('keeps plain text and allowed formatting tags', () => {
    expect(sanitizeDescriptionHtml('普通简介')).toBe('普通简介')
    expect(sanitizeDescriptionHtml('<b>bold</b> <i>italic</i>')).toBe('<b>bold</b> <i>italic</i>')
    expect(sanitizeDescriptionHtml('<a href="https://music.163.com">link</a>')).toBe(
      '<a href="https://music.163.com">link</a>'
    )
  })

  it('strips script tags and their content', () => {
    const output = sanitizeDescriptionHtml('a<script>alert(1)</script>b')
    expect(output).not.toContain('<script')
    expect(output).not.toContain('alert(1)')
  })

  it('strips event handler attributes', () => {
    const output = sanitizeDescriptionHtml('<img src=x onerror=alert(1)>')
    expect(output).not.toContain('onerror')
    expect(output).not.toContain('<img')
  })

  it('neutralizes javascript: and data: URLs', () => {
    const output = sanitizeDescriptionHtml(
      '<a href="javascript:alert(1)">x</a><a href="data:text/html,<script>alert(1)</script>">y</a>'
    )
    expect(output).not.toContain('javascript:')
    expect(output).not.toContain('data:')
  })

  it('strips iframes, svg and other non-allowlisted tags', () => {
    const output = sanitizeDescriptionHtml(
      '<iframe src="https://evil.example"></iframe><svg onload=alert(1)></svg>'
    )
    expect(output).not.toContain('<iframe')
    expect(output).not.toContain('<svg')
    expect(output).not.toContain('onload')
  })

  it('drops data attributes and style attributes', () => {
    const output = sanitizeDescriptionHtml('<b data-x="1" style="position:fixed">t</b>')
    expect(output).not.toContain('data-x')
    expect(output).not.toContain('style')
  })

  it('handles empty and missing input', () => {
    expect(sanitizeDescriptionHtml('')).toBe('')
    expect(sanitizeDescriptionHtml(undefined)).toBe('')
    expect(sanitizeDescriptionHtml(null)).toBe('')
  })
})
