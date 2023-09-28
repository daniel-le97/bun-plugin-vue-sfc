<template>
    <div :class="moduleClassName.foo">{{ msg }} thanks for stopping by!</div>
</template>

<script setup lang="ts">
const msg = 'hello world!'

</script>

<style module="moduleClassName">
.foo {
    color: red;
}
</style>
