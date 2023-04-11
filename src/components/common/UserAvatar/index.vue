<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NAvatar, NButton, NGradientText, NSpace, useMessage } from 'naive-ui'
import TokenDisplay from '@/components/common/TokenDisplay/index.vue'

import { useUserStore } from '@/store'
import defaultAvatar from '@/assets/avatar.jpg'
import { isString } from '@/utils/is'
import UserDetail from '@/components/common/UserDetail/index.vue'
import Buy from '@/components/common/Buy/index.vue'
import Invite from '@/components/common/Invite/index.vue'

const userStore = useUserStore()
const message = useMessage()
const userInfo = computed(() => userStore.userInfo)

const showModal = ref(false)
const loadingToken = ref(false)
const showRecharge = ref(false)
const showInvite = ref(false)

async function refreshUser() {
  loadingToken.value = true
  try {
    await userStore.refreshUser()
  }
  catch (e: any) {
    message.error(e.message)
  }
  finally {
    loadingToken.value = false
  }
}
</script>

<template>
  <!-- App.vue -->
  <UserDetail v-model:visible="showModal" />
  <Buy v-model:visible="showRecharge" />
  <Invite v-model:visible="showInvite" />
  <div class="flex items-center overflow-hidden" @click="showModal = true">
    <div class="w-10 h-10 overflow-hidden rounded-full shrink-0">
      <template v-if="isString(userInfo.avatar) && userInfo.avatar.length > 0">
        <NAvatar
          size="large"
          round
          :src="userInfo.avatar"
          :fallback-src="defaultAvatar"
        />
      </template>
      <template v-else>
        <NAvatar size="large" round :src="defaultAvatar" />
      </template>
    </div>
    <div class="flex-1 min-w-0 ml-2">
      <h2 class="overflow-hidden font-bold text-md text-ellipsis whitespace-nowrap">
        {{ userInfo.nickname ?? 'ChatGPT' }}
      </h2>
      <p class="overflow-hidden text-xs text-gray-500 text-ellipsis whitespace-nowrap">
        <NSpace vertical>
          <NButton text :loading="loadingToken" @click.stop="refreshUser">
            <TokenDisplay v-if="!loadingToken" size="10" />
            <NGradientText v-else type="error" size="10">
              加载中
            </NGradientText>
          </NButton>
          <NSpace justify="center">
            <NButton strong secondary type="info" size="medium" @click.stop="showRecharge = true">
              充值Token
            </NButton>
            <!--            <NBadge :max="15" :show="true" dot> -->
            <!--              <NButton strong secondary type="info" size="tiny" @click.stop="showInvite = true"> -->
            <!--                免费Token -->
            <!--              </NButton> -->
            <!--            </NBadge> -->
          </NSpace>
        </NSpace>
      </p>
    </div>
  </div>
</template>
