<template>
  <div id="items">
    <h2>
      List of Items: 
    </h2>
    <br />
    <div v-for="(item, idx) in items" :key="item.name">
      <h3>
        {{ idx }}. {{ item.name }}
      </h3>
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag';

export default {
  name: 'Items',
  data() {
    return {
      items: [],
    };
  },
  apollo: {
    items: {
      query: gql`query items {
        items {
          name
        }
      }
      `,
    },
  },
}
</script>

