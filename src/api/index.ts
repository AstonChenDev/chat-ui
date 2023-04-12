import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'
import { get, post } from '@/utils/request'

export function fetchChatAPI<T = any>(
  prompt: string,
  options?: { conversationId?: string; parentMessageId?: string },
  signal?: GenericAbortSignal,
) {
  return post<T>({
    url: '/chat',
    data: { prompt, options },
    signal,
  })
}

export function fetchChatConfig<T = any>() {
  return post<T>({
    url: '/config',
  })
}

export function fetchChatAPIProcess<T = any>(
  params: {
    prompt: string
    options?: { conversationId?: string; parentMessageId?: string }
    signal?: GenericAbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void
  },
) {
  return post<T>({
    url: '/chat-stream',
    data: { prompt: params.prompt, options: params.options },
    signal: params.signal,
    onDownloadProgress: params.onDownloadProgress,
  })
}

export function fetchSession<T>() {
  return post<T>({
    url: '/session',
  })
}

export function fetchCaptcha<T>(
  params: {
    country_code: number
    mobile: string
  },
) {
  return post<T>({
    url: '/sms/send',
    data: { country_code: params.country_code, mobile: params.mobile },
  })
}

export function fetchRegister<T>(
  params: {
    country_code: number
    captcha: string
    mobile: string
    password: string
    confirm_password: string
  },
) {
  return post<T>({
    url: '/user/register',
    data: params,
  })
}

export function resetPwd<T>(
  params: {
    country_code: number
    captcha: string
    mobile: string
    password: string
    confirm_password: string
  },
) {
  return post<T>({
    url: '/user/reset',
    data: params,
  })
}

export function fetchLogin<T>(
  params: {
    mobile: string
    password: string
  },
) {
  return post<T>({
    url: '/user/login',
    data: params,
  })
}

export function fetchUserInfo<T>(
  params: {},
) {
  return post<T>({
    url: '/user/info',
    data: params,
  })
}

export function fetchVerify<T>(token: string) {
  return post<T>({
    url: '/verify',
    data: { token },
  })
}

export function fetchProducts<T>() {
  return get<T>({
    url: '/v1/product/list',
    data: {},
  })
}

export function fetchWechatNaive<T>(product_id: number) {
  return fetchPurchase<T>({
    product_id,
    type: 1,
    method: 1,
  })
}

export function fetchPurchase<T>(
  param: {
    product_id: number
    type: number
    method: number
  },
) {
  return post<T>({
    url: '/v1/transaction/start',
    data: { ...param },
  })
}

export function fetchOrderStatus<T>(
  param: {
    out_trade_no: string
  },
) {
  return post<T>({
    url: '/v1/transaction/check',
    data: { ...param },
  })
}

export function fetchNotification<T>() {
  return get<T>({
    url: '/v1/notice/list',
    data: {},
  })
}
