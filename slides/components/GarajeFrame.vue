<script setup lang="ts">
defineProps<{
  chapter?: string
  subtitle?: string
  page?: number | string
  total?: number | string
  dark?: boolean
}>()
</script>

<template>
  <div class="garaje-frame" :class="{ dark }">
    <div class="header">
      <div class="brand">Garaje.</div>
      <div class="center" />
      <div class="right">{{ chapter ?? 'No es el prompt, es el entorno' }}</div>
    </div>
    <div class="body">
      <slot />
    </div>
    <div class="footer">
      <div class="tagline">DIGITAL FOR NONCONFORMISTS®</div>
      <div class="center">{{ subtitle ?? '' }}</div>
      <div class="right">{{ page ?? '' }}</div>
    </div>
  </div>
</template>
