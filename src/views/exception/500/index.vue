<script lang="ts" setup>
import { NButton, NResult } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="flex h-full dark:bg-neutral-800">
    <div class="px-4 m-auto space-y-4 text-center max-[400px]">
      <NResult
        status="500"
        title="500 服务器错误"
        description="别急，方法总比困难多"
      >
        <template #footer>
          <NButton @click="goHome">
            点这里试试看
          </NButton>
        </template>
      </NResult>
    </div>
  </div>
</template>
