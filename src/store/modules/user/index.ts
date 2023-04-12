import { defineStore } from 'pinia'
import type { UserInfo, UserState } from './helper'
import { defaultSetting, getLocalState, setLocalState } from './helper'
import { fetchLogin, fetchRegister, fetchUserInfo, resetPwd } from '@/api'
import { useAuthStoreWithout } from '@/store'

export const useUserStore = defineStore('user-store', {
  state: (): UserState => getLocalState(),
  actions: {
    updateUserInfo(userInfo: Partial<UserInfo>) {
      this.userInfo = { ...this.userInfo, ...userInfo }
      this.recordState()
      useAuthStoreWithout().setToken(this.userInfo.token)
      if (!this.userInfo.token)
        useAuthStoreWithout().removeToken()
    },

    async refreshUser() {
      const response = await fetchUserInfo<UserResponse>({})
      this.updateUserInfo(response.data)
    },

    async login(params: {
      mobile: string
      password: string
    }) {
      const response = await fetchLogin<UserResponse>({ mobile: params.mobile, password: params.password })
      this.updateUserInfo(response.data)
    },

    async resetPwd(params: {
      country_code: number
      captcha: string
      mobile: string
      password: string
      confirm_password: string
    }) {
      const response = await resetPwd<UserResponse>({
        country_code: params.country_code,
        captcha: params.captcha,
        mobile: params.mobile,
        password: params.password,
        confirm_password: params.confirm_password,
      })
      this.updateUserInfo(response.data)
    },

    async register(params: {
      country_code: number
      captcha: string
      mobile: string
      password: string
      confirm_password: string
      inviter: string
    }) {
      const response = await fetchRegister<UserResponse>(
        {
          country_code: params.country_code,
          captcha: params.captcha,
          mobile: params.mobile,
          password: params.password,
          confirm_password: params.confirm_password,
          inviter: params.inviter,
        },
      )
      this.updateUserInfo(response.data)
    },

    resetUserInfo() {
      this.updateUserInfo({ ...defaultSetting().userInfo })
    },

    recordState() {
      setLocalState(this.$state)
    },
  },
})
