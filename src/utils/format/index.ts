/**
 * 转义 HTML 字符
 * @param source
 */
export function encodeHTML(source: string) {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 判断是否为代码块
 * @param text
 */
export function includeCode(text: string | null | undefined) {
  const regexp = /^(?:\s{4}|\t).+/gm
  return !!(text?.includes(' = ') || text?.match(regexp))
}

/**
 * 复制文本
 * @param options
 */
export function copyText(options: { text: string; origin?: boolean }): boolean {
  const props = { origin: true, ...options }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(props.text ?? '')
    return true
  }

  let input: HTMLInputElement | HTMLTextAreaElement

  if (props.origin)
    input = document.createElement('textarea')
  else
    input = document.createElement('input')

  input.setAttribute('readonly', 'readonly')
  input.value = props.text
  document.body.appendChild(input)
  input.select()
  let res = false
  if (document.execCommand('copy'))
    res = document.execCommand('copy')
  document.body.removeChild(input)
  return res
}
