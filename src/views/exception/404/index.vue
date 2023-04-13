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
      <NResult status="404" title="404 资源不存在" description="找啥呢？别乱翻">
        <template #footer>
          <NButton @click="goHome">
            找点乐子吧
          </NButton>
        </template>
      </NResult>
    </div>
  </div>
</template>
