<script setup lang="ts">
import { computed, reactive } from 'vue'
import QRCodeVue3 from 'qrcode-vue3'
import { NGradientText, NModal, NSpace, useDialog } from 'naive-ui'
import image from '@/assets/favicon.svg'
import InputCopyable from '@/components/common/InputCopyable/index.vue'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

interface Props {
  visible: boolean
  codeUrl: string
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const url = computed(() => {
  return props.codeUrl
})
const dialog = useDialog()
const qr_data = reactive({
  /**
   * 基础配置
   */
  width: 360, // 二维码宽度
  height: 360, // 二维码高度
  value: url, // 二维码内容
  margin: 6, // 二维码图像的外边距
  /**
   * 背景配置
   */
  backgroundOptions: {
    // 二维码背景色
    color: 'white',
  },
  /**
   * 二维码配置
   */
  qrOptions: {
    typeNumber: '0', // 类型编号 0 - 40
    mode: 'Byte', // 模式 Numeric | Alphanumeric | Byte | Kanji
    errorCorrectionLevel: 'Q', // 错误级别 L | M | Q | H
  },
  /**
   * 图像配置（中心图片）
   */
  image, // 二维码中心的图片
  imageOptions: {
    hideBackgroundDots: false, // 隐藏图片背后有点
    imageSize: 0,
    margin: 5,
    crossOrigin: 'anonymous', // anonymous | use-credentials
  },
  /**
   * 二维码点配置
   */
  dotsOptions: {
    type: 'square', // 二维码样式 square | dots | rounded | extra-rounded | classy | classy-rounded
    color: '#000000',
  },
  /**
   * 角落广场配置
   */
  cornersSquareOptions: {
    type: 'square', // none | square | dot | extra-rounded
    color: '#000000',
    gradient: {
      type: 'linear',
      rotation: 0,
      colorStops: [
        {
          offset: 0,
          color: '#000000',
        },
        {
          offset: 1,
          color: '#000000',
        },
      ],
    },
  },
  /**
   * 角落点配置
   */
  cornersDotOptions: {
    type: 'square', // none | square | dot
    color: '#000000',
    gradient: {
      type: 'radial',
      rotation: 0,
      colorStops: [
        {
          offset: 0,
          color: '#000000',
        },
        {
          offset: 1,
          color: '#000000',
        },
      ],
    },
  },
})

const show = computed({
  get() {
    return props.visible
  },
  set(visible: boolean) {
    emit('update:visible', visible)
  },
})

function jump() {
  dialog.success({
    title: '即将跳转微信',
    content: '复制成功，跳转到微信后将链接发送至聊天框，点击链接即可支付',
    positiveText: 'OK',
    onPositiveClick: () => {
      window.open(qr_data.value)
    },
  })
}
</script>

<template>
  <NModal
    v-model:show="show" preset="card" title="请使用微信扫码支付" header-style="text-align:center"
    :style="`width:${qr_data.width}px;`"
  >
    <NSpace vertical>
      <NSpace justify="center">
        <QRCodeVue3
          :margin="qr_data.margin"
          :width="qr_data.width"
          :height="qr_data.height"
          :value="qr_data.value"
          :qr-options="qr_data.qrOptions"
          :image="qr_data.image"
          :image-options="qr_data.imageOptions"
          :dots-options="qr_data.dotsOptions"
          :background-options="qr_data.backgroundOptions"
          :corners-square-options="qr_data.cornersSquareOptions"
          :corners-dot-options="qr_data.cornersDotOptions"
        />
      </NSpace>
    </NSpace>
    <template #footer>
      <NSpace vertical>
        <NGradientText type="error" size="15">
          <b>手机端目前不支持直接唤起微信支付：</b>
        </NGradientText>
        <NSpace vertical>
          1.建议在电脑浏览器打开，直接微信扫码支付
        </NSpace>
      </NSpace>
      <NSpace justify="center">
        2.手机端打开需要复制此支付链接转发到微信任意联系人，点击链接可以支付。
        <InputCopyable :input="qr_data.value" @on-finish="jump" />
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>

</style>
