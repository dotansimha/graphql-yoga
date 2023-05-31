/* eslint-disable no-console */
import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

type Params = {
  user: string
  repo: string
  branch: string
  docsPath: string
  outputPath: string
}

async function fetchRemoteFilePaths({
  user,
  repo,
  branch,
  docsPath,
  outputPath,
}: Params): Promise<void> {
  async function fillNestedMeta(
    metaPaths: string[],
  ): Promise<Record<string, unknown>> {
    const result = Object.create(null)
    let index = 0
    let metaPath
    while ((metaPath = metaPaths[index++])) {
      const response = await fetch(
        `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${docsPath}${metaPath}`,
      )
      const metaData = await response.json()
      const dir = metaPath.split('/').slice(0, -1)

      if (dir.length === 0) {
        Object.assign(result, metaData)
      } else if (dir.length === 1) {
        result[dir[0]] = {
          type: 'folder',
          items: metaData,
        }
      } else {
        throw new Error('❌ Not implemented for nested directories')
      }
    }
    return result
  }

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
    .filter((item) => item.path.startsWith(docsPath))
    .map((item) => item.path.replace(docsPath, ''))

  const result = {
    user,
    repo,
    branch,
    docsPath,
    filePaths: filePaths.filter((filePath) => /\.mdx?$/.test(filePath)),
    nestedMeta: await fillNestedMeta(
      filePaths.filter((filePath) => filePath.endsWith('_meta.json')),
    ),
  }
  const json = JSON.stringify(result, null, 2)

  await fs.writeFile(
    outputPath,
    prettier.format(json, { parser: 'json' }),
    'utf8',
  )

  console.log(`✅ Remote files from "${url}" saved!`)
}

fetchRemoteFilePaths({
  user: 'dotansimha',
  repo: 'graphql-yoga',
  // last commit with v2 source docs
  branch: '8bb0fb0a010bfca17c3e1b771a704b631952ca4c',
  docsPath: 'website/src/pages/v2/',
  outputPath: path.join(process.cwd(), 'remote-files', 'v2.json'),
})
