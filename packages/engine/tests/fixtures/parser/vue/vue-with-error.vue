<script setup lang="ts">
import { map } from "lodash";

const arr = [1, 2, 3];
const doubled: number[] = map(arr, (n) => n * 2);

<template>
  <main>
    {{ doubled.length }}
  </main>
</template>
