<template>
  <div class="gis-container">
    <MapContainer :show-risk-query="true" />
  </div>
</template>

<script setup lang="ts">
import MapContainer from '@/components/Map/MapContainer.vue'
</script>

<style lang="scss" scoped>
.gis-container {
  width: 100%;
  height: 100%;
}
</style>
