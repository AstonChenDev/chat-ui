<script setup lang='ts'>
import { defineAsyncComponent, ref } from 'vue'
import { NBadge, NButton, NGradientText, NSpace, useMessage } from 'naive-ui'
import { HoverButton, SvgIcon, UserAvatar } from '@/components/common'
import TokenDisplay from '@/components/common/TokenDisplay/index.vue'
import Buy from '@/components/common/Buy/index.vue'
import Invite from '@/components/common/Invite/index.vue'
import { useUserStore } from '@/store'

const Setting = defineAsyncComponent(() => import('@/components/common/Setting/index.vue'))
const loadingToken = ref(false)
const show = ref(false)
const showRecharge = ref(false)
const showInvite = ref(false)
const userStore = useUserStore()
const message = useMessage()

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
  <footer class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">
    <NSpace vertical>
      <NSpace justify="center">
        <NButton text :loading="loadingToken" @click.stop="refreshUser">
          <TokenDisplay v-if="!loadingToken" size="17" />
          <NGradientText v-else type="error" size="17">
            加载中
          </NGradientText>
        </NButton>
        <NSpace justify="center">
          <NButton strong secondary type="info" size="medium" round @click.stop="showRecharge = true">
            充值Token
          </NButton>
          <NBadge :max="15" :show="true" dot>
            <NButton strong secondary type="info" size="medium" round @click.stop="showInvite = true">
              免费Token
            </NButton>
          </NBadge>
        </NSpace>
      </NSpace>
      <NSpace justify="center">
        <div class="flex-1 flex-shrink-0 overflow-hidden">
          <UserAvatar />
        </div>
        <HoverButton @click="show = true">
          <span class="text-xl text-[#4f555e] dark:text-white">
            <SvgIcon icon="ri:settings-4-line" />
          </span>
        </HoverButton>
      </NSpace>
    </NSpace>
    <Buy v-model:visible="showRecharge" />
    <Invite v-model:visible="showInvite" />
    <Setting v-model:visible="show" />
  </footer>
</template>
