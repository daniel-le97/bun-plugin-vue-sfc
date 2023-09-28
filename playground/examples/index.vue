<template>
    <div>{{ state }}</div>
    <button @click="changeState" class="">changeState</button>
    <div v-for="route in routes" class="blue">
        <a :href="route">{{ route }}</a>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
let state = ref(true)
let routes = ['/css-modules', '/normal-sfc', '/only-script', '/only-template', '/script-setup']
const changeState = () => (state.value = !state.value)
</script>

<style>
.blue{
    color: blue;
    outline: auto;
}
</style>
