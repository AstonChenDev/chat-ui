import type { Router } from 'vue-router'
import { useAuthStoreWithout } from '@/store/modules/auth'
import { useUserStore } from '@/store'

export function setupPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    if (['login', 'register', 'reset'].includes(<string>to.name)) {
      next()
      return
    }
    const authStore = useAuthStoreWithout()
    if (!authStore.token && to.name !== 'login') {
      next({ name: 'login' })
      return
    }
    if (!authStore.session) {
      try {
        const data = await authStore.getSession()
        if (String(data.auth) === 'false' && authStore.token)
          authStore.removeToken()
        if (String(data.auth) === 'true' && authStore.token)
          await useUserStore().refreshUser()
        next()
      }
      catch (error) {
        if (to.path !== '/500')
          next({ name: '500' })
        else
          next()
      }
    }
    else {
      next()
    }
  })
}
