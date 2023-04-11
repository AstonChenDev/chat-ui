<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'

const Setting = defineAsyncComponent(() => import('@/components/common/Setting/index.vue'))

const show = ref(false)

function showSettings() {
  show.value = true
}
</script>

<template>
  <div class="flex justify-center tip">
    <p class="tip-p" @click="showSettings">
      {{ $t('setting.click_tip') }}
    </p>
    <Setting v-model:visible="show" />
  </div>
</template>

<style scoped>
.tip {
  width: 100%;
}

.tip-p {
  font-size: 1rem;
  text-decoration: underline;
  cursor: pointer;
}
</style>
