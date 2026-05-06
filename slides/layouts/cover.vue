<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import GarajeFrame from '../components/GarajeFrame.vue'

const { $slidev } = useSlideContext() as any
const fm = computed<any>(() => ($slidev?.nav?.currentSlideRoute?.meta?.slide?.frontmatter) ?? {})
const dark = computed(() => !!fm.value.dark)
const chapter = computed<string | undefined>(() => fm.value.chapter)
const subtitle = computed<string | undefined>(() => fm.value.subtitleFooter)
const page = computed<string | number | undefined>(() => fm.value.page)
</script>

<template>
  <div class="slidev-layout" :class="{ dark }">
    <GarajeFrame :chapter="chapter" :subtitle="subtitle" :page="page" :dark="dark">
      <div class="garaje-cover">
        <slot />
      </div>
    </GarajeFrame>
  </div>
</template>
