/* eslint-disable no-console */
import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

type Params = {
  user: string
  repo: string
  branch: string
  docsPath: string
}

async function fetchRemoteFilePaths({
  user,
  repo,
  branch,
  docsPath,
}: Params): Promise<void> {
  const url = `https://api.github.com/repos/${user}/${repo}/git/trees/${branch}?recursive=1`
  const response = await fetch(url)

  const data = await response.json()
  if (data.message) {
    console.error(
      '❌ GitHub API rate limit exceeded, skipping…',
      JSON.stringify(data, null, 2),
    )
    process.exit(0)
  }
  const filePaths = (data.tree as { path: string }[])
    .filter(
      (item) => item.path.startsWith(docsPath) && /\.mdx?$/.test(item.path),
    )
    .map((item) => item.path.replace(docsPath, ''))

  const result = {
    user,
    repo,
    branch,
    docsPath,
    filePaths,
  }
  const json = JSON.stringify(result, null, 2)

  await fs.writeFile(
    path.join(process.cwd(), 'remote-files', 'v2.json'),
    prettier.format(json, { parser: 'json' }),
    'utf8',
  )

  console.log(`✅ Remote files from "${url}" saved!`)
}

fetchRemoteFilePaths({
  user: 'dotansimha',
  repo: 'graphql-yoga',
  // last commit with v2 source docs
  branch: '9775f4eaebb89d4107ae156e5c51b81dda67d775',
  docsPath: 'website/src/pages/v2/',
})
