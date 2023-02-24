<script setup>
import { map } from "lodash";

const arr = [1, 2, 3];
const doubled = map(arr, (n) => n * 2);
</script>

<template>
  <main>
    {{ doubled.length }}
  </main>
</template>
