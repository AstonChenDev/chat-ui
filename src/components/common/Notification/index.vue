<script setup lang='ts'>
import { useNotification } from 'naive-ui'
import { fetchNotification } from '@/api'

const FORCE_ALERT = 1
const notification = useNotification()

async function load() {
  try {
    const { data } = await fetchNotification<Notice[]>()
    for (const datum of data) {
      if (datum.type === FORCE_ALERT) {
        notification.info({
          title: datum.title,
          content: datum.content,
        })
      }
    }
  }
  catch (e) {

  }
}

load()
</script>

<template />
