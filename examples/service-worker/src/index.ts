import { createYoga } from 'graphql-yoga'

const yoga = createYoga()

self.addEventListener('fetch', yoga)
