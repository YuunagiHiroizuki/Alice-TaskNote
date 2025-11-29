<template>
  <div class="h-16 flex items-center px-4 bg-(--alice-section)">
    <h3 class="p-18 text-xl font-bold text-(--alice-text-muted)">{{ title }}</h3>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const title = ref('Alice');
</script>
