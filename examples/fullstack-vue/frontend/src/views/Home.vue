<template>
  <div class="home">
    <img src="../assets/logo.png">
    <Items msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import Items from '@/components/Items.vue'

export default {
  name: 'home',
  components: {
    Items
  }
}
</script>
