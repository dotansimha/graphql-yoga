import { buildApp } from './app'

async function main() {
  const app = buildApp()
  await app.start(4000)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
