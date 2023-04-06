<script setup lang='ts'>
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {storeToRefs} from 'pinia'
import {NAutoComplete, NButton, NInput, useDialog, useMessage} from 'naive-ui'
import html2canvas from 'html2canvas'
import {Message} from './components'
import {useScroll} from './hooks/useScroll'
import {useChat} from './hooks/useChat'
import {useCopyCode} from './hooks/useCopyCode'
import {useUsingContext} from './hooks/useUsingContext'
import HeaderComponent from './components/Header/index.vue'
import Tip from './components/Tip/Tip.vue'
import {HoverButton, SvgIcon} from '@/components/common'
import {useBasicLayout} from '@/hooks/useBasicLayout'
import {useAuthStoreWithout, useChatStore, usePromptStore} from '@/store'
// import {fetchChatAPIProcess} from '@/api'
import {t} from '@/locales'
import {Client, Body} from '@/utils/websocket/Client'
import {MAIN_CMD, Routes, SUB_CMD, TYPE} from "@/utils/websocket/Const";

let controller = new AbortController()

// const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const ms = useMessage()

const chatStore = useChatStore()

useCopyCode()

const {isMobile} = useBasicLayout()
const {addChat, updateChat, updateChatSome, getChatByUuidAndIndex} = useChat()
const {scrollRef, scrollToBottom} = useScroll()
const {usingContext, toggleUsingContext} = useUsingContext()

const {uuid} = route.params as { uuid: string }

const dataSources = computed(() => chatStore.getChatByUuid(+uuid))
const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !item.error)))

const prompt = ref<string>('')
const loading = ref<boolean>(false)
let stop_ids: string[] = []
let pending_id: string = ''

// 添加PromptStore
const promptStore = usePromptStore()

// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const {promptList: promptTemplate} = storeToRefs<any>(promptStore)

// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
  if (item.loading)
    updateChatSome(+uuid, index, {loading: false})
})

function onHeartBeat(data: {}) {
  // console.log('onHeartBeat', data)
}

let options: Chat.ConversationRequest = {}

function onReceiveChat(data: Chat.ConversationResponse) {
  if (stop_ids.includes(data.id)) {
    return
  }
  let lastText = ''
  try {
    pending_id = data.id;
    updateChat(
        +uuid,
        dataSources.value.length - 1,
        {
          dateTime: new Date().toLocaleString(),
          text: lastText + data.text ?? '',
          inversion: false,
          error: false,
          loading: false,
          conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
          requestOptions: {prompt: message, options: {...options}},
        },
    )
    scrollToBottom()
  } catch (error: any) {
    const errorMessage = error?.message ?? t('common.wrong')
    if (error.message === 'canceled') {
      updateChatSome(
          +uuid,
          dataSources.value.length - 1,
          {
            loading: false,
          },
      )
      scrollToBottom()
      return
    }

    const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

    if (currentChat?.text && currentChat.text !== '') {
      updateChatSome(
          +uuid,
          dataSources.value.length - 1,
          {
            text: `${currentChat.text}\n[${errorMessage}]`,
            error: false,
            loading: false,
          },
      )
      return
    }

    updateChat(
        +uuid,
        dataSources.value.length - 1,
        {
          dateTime: new Date().toLocaleString(),
          text: errorMessage,
          inversion: false,
          error: true,
          loading: false,
          conversationOptions: null,
          requestOptions: {prompt: message, options: {...options}},
        },
    )
    scrollToBottom()
  } finally {
    if (data.detail.choices[0].finish_reason === 'stop') {
      loading.value = false
    }
  }
}


const map = {
  [MAIN_CMD.CMD_SYS]: {
    [SUB_CMD.SYS_HEART_ASK_REQ]: {
      [TYPE.TIP]: onHeartBeat
    },
    [SUB_CMD.SYS_COMMON_RESP]: {
      [TYPE.TIP]: (body: Body) => {
        // console.log(body)
        ms.error(body.code > 0 ? body.msg : body.data.msg)
        loading.value = false
      }
    },
    [SUB_CMD.SYS_CHAT_REQ]: {
      [TYPE.TIP]: onReceiveChat
    },
  }
};


const client = Client.getInstance(
    import.meta.env.VITE_GLOB_WS_URL,
    <string>useAuthStoreWithout().token,
    true,
    false
)
client.setRoute(new Routes(map)).setOnOpen(onOpen).setOnMessage().setOnClose(onClose).setOnError(onError)

function onOpen() {
  // console.log('链接上了')
}

function onError(e: Event) {
  Client.destroy()
  router.push('/login')
}

function onClose() {
  ms.error('网络链接断开')
}

function handleSubmit() {
  // onConversation()
  onSendChat()

}

let message = ''

async function onSendChat() {
  message = prompt.value
  if (loading.value)
    return

  if (!message || message.trim() === '')
    return

  controller = new AbortController()

  addChat(
      +uuid,
      {
        dateTime: new Date().toLocaleString(),
        text: message,
        inversion: true,
        error: false,
        conversationOptions: null,
        requestOptions: {prompt: message, options: null},
      },
  )
  scrollToBottom()

  loading.value = true
  prompt.value = ''

  const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions

  if (lastContext && usingContext.value)
    options = {...lastContext}

  addChat(
      +uuid,
      {
        dateTime: new Date().toLocaleString(),
        text: '',
        loading: true,
        inversion: false,
        error: false,
        conversationOptions: null,
        requestOptions: {prompt: message, options: {...options}},
      },
  )
  scrollToBottom()
  client.send({prompt: message, options}, MAIN_CMD.CMD_SYS, SUB_CMD.SYS_CHAT_REQ);
}


// async function onConversation() {
//   let message = prompt.value
//
//   if (loading.value)
//     return
//
//   if (!message || message.trim() === '')
//     return
//
//   controller = new AbortController()
//
//   addChat(
//       +uuid,
//       {
//         dateTime: new Date().toLocaleString(),
//         text: message,
//         inversion: true,
//         error: false,
//         conversationOptions: null,
//         requestOptions: {prompt: message, options: null},
//       },
//   )
//   scrollToBottom()
//
//   loading.value = true
//   prompt.value = ''
//
//   let options: Chat.ConversationRequest = {}
//   const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions
//
//   if (lastContext && usingContext.value)
//     options = {...lastContext}
//
//   addChat(
//       +uuid,
//       {
//         dateTime: new Date().toLocaleString(),
//         text: '',
//         loading: true,
//         inversion: false,
//         error: false,
//         conversationOptions: null,
//         requestOptions: {prompt: message, options: {...options}},
//       },
//   )
//   scrollToBottom()
//
//   try {
//     let lastText = ''
//     const fetchChatAPIOnce = async () => {
//       await fetchChatAPIProcess<Chat.ConversationResponse>({
//         prompt: message,
//         options,
//         signal: controller.signal,
//         onDownloadProgress: ({event}) => {
//           const xhr = event.target
//           const {responseText} = xhr
//           // Always process the final line
//           const lastIndex = responseText.lastIndexOf('\n')
//           let chunk = responseText
//           if (lastIndex !== -1)
//             chunk = responseText.substring(lastIndex)
//           try {
//             const data = JSON.parse(chunk)
//             updateChat(
//                 +uuid,
//                 dataSources.value.length - 1,
//                 {
//                   dateTime: new Date().toLocaleString(),
//                   text: lastText + data.text ?? '',
//                   inversion: false,
//                   error: false,
//                   loading: false,
//                   conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
//                   requestOptions: {prompt: message, options: {...options}},
//                 },
//             )
//
//             if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
//               options.parentMessageId = data.id
//               lastText = data.text
//               message = ''
//               return fetchChatAPIOnce()
//             }
//
//             scrollToBottom()
//           } catch (error) {
//             //
//           }
//         },
//       })
//     }
//
//     await fetchChatAPIOnce()
//   } catch (error: any) {
//     const errorMessage = error?.message ?? t('common.wrong')
//
//     if (error.message === 'canceled') {
//       updateChatSome(
//           +uuid,
//           dataSources.value.length - 1,
//           {
//             loading: false,
//           },
//       )
//       scrollToBottom()
//       return
//     }
//
//     const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)
//
//     if (currentChat?.text && currentChat.text !== '') {
//       updateChatSome(
//           +uuid,
//           dataSources.value.length - 1,
//           {
//             text: `${currentChat.text}\n[${errorMessage}]`,
//             error: false,
//             loading: false,
//           },
//       )
//       return
//     }
//
//     updateChat(
//         +uuid,
//         dataSources.value.length - 1,
//         {
//           dateTime: new Date().toLocaleString(),
//           text: errorMessage,
//           inversion: false,
//           error: true,
//           loading: false,
//           conversationOptions: null,
//           requestOptions: {prompt: message, options: {...options}},
//         },
//     )
//     scrollToBottom()
//   } finally {
//     loading.value = false
//   }
// }

// async function onRegenerateBackup(index: number) {
//   if (loading.value)
//     return
//
//   controller = new AbortController()
//
//   const {requestOptions} = dataSources.value[index]
//
//   let message = requestOptions?.prompt ?? ''
//
//   let options: Chat.ConversationRequest = {}
//
//   if (requestOptions.options)
//     options = {...requestOptions.options}
//
//   loading.value = true
//
//   updateChat(
//       +uuid,
//       index,
//       {
//         dateTime: new Date().toLocaleString(),
//         text: '',
//         inversion: false,
//         error: false,
//         loading: true,
//         conversationOptions: null,
//         requestOptions: {prompt: message, ...options},
//       },
//   )
//
//   try {
//     let lastText = ''
//     const fetchChatAPIOnce = async () => {
//       await fetchChatAPIProcess<Chat.ConversationResponse>({
//         prompt: message,
//         options,
//         signal: controller.signal,
//         onDownloadProgress: ({event}) => {
//           const xhr = event.target
//           const {responseText} = xhr
//           // Always process the final line
//           const lastIndex = responseText.lastIndexOf('\n')
//           let chunk = responseText
//           if (lastIndex !== -1)
//             chunk = responseText.substring(lastIndex)
//           try {
//             const data = JSON.parse(chunk)
//             updateChat(
//                 +uuid,
//                 index,
//                 {
//                   dateTime: new Date().toLocaleString(),
//                   text: lastText + data.text ?? '',
//                   inversion: false,
//                   error: false,
//                   loading: false,
//                   conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
//                   requestOptions: {prompt: message, ...options},
//                 },
//             )
//
//             if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
//               options.parentMessageId = data.id
//               lastText = data.text
//               message = ''
//               return fetchChatAPIOnce()
//             }
//           } catch (error) {
//             //
//           }
//         },
//       })
//     }
//     await fetchChatAPIOnce()
//   } catch (error: any) {
//     if (error.message === 'canceled') {
//       updateChatSome(
//           +uuid,
//           index,
//           {
//             loading: false,
//           },
//       )
//       return
//     }
//
//     const errorMessage = error?.message ?? t('common.wrong')
//
//     updateChat(
//         +uuid,
//         index,
//         {
//           dateTime: new Date().toLocaleString(),
//           text: errorMessage,
//           inversion: false,
//           error: true,
//           loading: false,
//           conversationOptions: null,
//           requestOptions: {prompt: message, ...options},
//         },
//     )
//   } finally {
//     loading.value = false
//   }
// }

async function onRegenerate(index: number) {
  if (loading.value)
    return

  controller = new AbortController()

  const {requestOptions} = dataSources.value[index]

  let message = requestOptions?.prompt ?? ''

  let options: Chat.ConversationRequest = {}

  if (requestOptions.options)
    options = {...requestOptions.options}

  loading.value = true

  updateChat(
      +uuid,
      index,
      {
        dateTime: new Date().toLocaleString(),
        text: '',
        inversion: false,
        error: false,
        loading: true,
        conversationOptions: null,
        requestOptions: {prompt: message, ...options},
      },
  )
  client.send({prompt: message, options}, MAIN_CMD.CMD_SYS, SUB_CMD.SYS_CHAT_REQ);
}

function handleExport() {
  if (loading.value)
    return

  const d = dialog.warning({
    title: t('chat.exportImage'),
    content: t('chat.exportImageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      try {
        d.loading = true
        const ele = document.getElementById('image-wrapper')
        const canvas = await html2canvas(ele as HTMLDivElement, {
          useCORS: true,
        })
        const imgUrl = canvas.toDataURL('image/png')
        const tempLink = document.createElement('a')
        tempLink.style.display = 'none'
        tempLink.href = imgUrl
        tempLink.setAttribute('download', 'chat-shot.png')
        if (typeof tempLink.download === 'undefined')
          tempLink.setAttribute('target', '_blank')

        document.body.appendChild(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
        window.URL.revokeObjectURL(imgUrl)
        d.loading = false
        ms.success(t('chat.exportSuccess'))
        Promise.resolve()
      } catch (error: any) {
        ms.error(t('chat.exportFailed'))
      } finally {
        d.loading = false
      }
    },
  })
}

function handleDelete(index: number) {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.deleteMessageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.deleteChatByUuid(+uuid, index)
    },
  })
}

function handleClear() {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.clearChat'),
    content: t('chat.clearChatConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.clearChatByUuid(+uuid)
    },
  })
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  } else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
}

function handleStop() {
  if (pending_id && loading.value) {
    controller.abort()
    loading.value = false
    stop_ids.push(pending_id);
  }
}

// 可优化部分
// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)
// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现
const searchOptions = computed(() => {
  if (prompt.value.startsWith('/')) {
    return promptTemplate.value.filter((item: { key: string }) => item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())).map((obj: { value: any }) => {
      return {
        label: obj.value,
        value: obj.value,
      }
    })
  } else {
    return []
  }
})

// value反渲染key
const renderOption = (option: { label: string }) => {
  for (const i of promptTemplate.value) {
    if (i.value === option.label)
      return [i.key]
  }
  return []
}

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  if (loading.value)
    controller.abort()
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <HeaderComponent
        v-if="isMobile"
        :using-context="usingContext"
        @export="handleExport"
        @toggle-using-context="toggleUsingContext"
    />
    <main class="flex-1 overflow-hidden">
      <div
          id="scrollRef"
          ref="scrollRef"
          class="h-full overflow-hidden overflow-y-auto"
      >
        <div
            id="image-wrapper"
            class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
            :class="[isMobile ? 'p-2' : 'p-4']"
        >
          <template v-if="!dataSources.length">
            <div class="flex items-center justify-center mt-4 text-center text-neutral-300">
              <SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl"/>
              <span>欢迎来到AI宇宙，你可以跟我聊天，比如，写首唐诗……</span>
            </div>
          </template>
          <template v-else>
            <div>
              <Message
                  v-for="(item, index) of dataSources"
                  :key="index"
                  :date-time="item.dateTime"
                  :text="item.text"
                  :inversion="item.inversion"
                  :error="item.error"
                  :loading="item.loading"
                  @regenerate="onRegenerate(index)"
                  @delete="handleDelete(index)"
              />
              <div class="sticky bottom-0 left-0 flex justify-center">
                <NButton v-if="loading" type="warning" @click="handleStop">
                  <template #icon>
                    <SvgIcon icon="ri:stop-circle-line"/>
                  </template>
                  Stop Responding
                </NButton>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
    <footer>
      <div class="w-full max-w-screen-xl m-auto">
        <div class="flex items-center justify-between space-x-2">
          <Tip/>
        </div>
      </div>
    </footer>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto">
        <div class="flex items-center justify-between space-x-2">
          <HoverButton @click="handleClear">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:delete-bin-line"/>
            </span>
          </HoverButton>
          <HoverButton v-if="!isMobile" @click="handleExport">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:download-2-line"/>
            </span>
          </HoverButton>
          <HoverButton v-if="!isMobile" @click="toggleUsingContext">
            <span class="text-xl" :class="{ 'text-[#4b9e5f]': usingContext, 'text-[#a8071a]': !usingContext }">
              <SvgIcon icon="ri:chat-history-line"/>
            </span>
          </HoverButton>
          <NAutoComplete v-model:value="prompt" :options="searchOptions" :render-label="renderOption">
            <template #default="{ handleInput, handleBlur, handleFocus }">
              <NInput
                  v-model:value="prompt"
                  type="textarea"
                  :placeholder="placeholder"
                  :autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
                  @input="handleInput"
                  @focus="handleFocus"
                  @blur="handleBlur"
                  @keypress="handleEnter"
              />
            </template>
          </NAutoComplete>
          <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
            <template #icon>
              <span class="dark:text-black">
                <SvgIcon icon="ri:send-plane-fill"/>
              </span>
            </template>
          </NButton>
        </div>
      </div>
    </footer>
  </div>
</template>
