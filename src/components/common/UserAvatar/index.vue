<script setup lang='ts'>
import { computed, ref } from 'vue'

import { useUserStore } from '@/store'
import UserDetail from '@/components/common/UserDetail/index.vue'
import Buy from '@/components/common/Buy/index.vue'
import Invite from '@/components/common/Invite/index.vue'
import Avatar from '@/components/common/Avatar/index.vue'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const showModal = ref(false)
const showRecharge = ref(false)
const showInvite = ref(false)
</script>

<template>
  <!-- App.vue -->
  <UserDetail v-model:visible="showModal" />
  <Buy v-model:visible="showRecharge" />
  <Invite v-model:visible="showInvite" />
  <div class="flex items-center overflow-hidden" @click="showModal = true">
    <div class="w-10 h-10 overflow-hidden rounded-full shrink-0">
      <Avatar size="large" />
    </div>
    <div class="flex-1 min-w-0 ml-2">
      <h2 class="overflow-hidden font-bold text-md text-ellipsis whitespace-nowrap">
        {{ userInfo.nickname ?? 'AI Universe' }}
      </h2>
      <p class="overflow-hidden text-xs text-gray-500 text-ellipsis whitespace-nowrap" />
    </div>
  </div>
</template>
