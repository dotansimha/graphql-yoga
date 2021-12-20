const fs = require('fs')
const path = require('path')
let [, , ...rawPointers] = process.argv

function createReport(pointer) {
  const [name, file] = pointer.split(':')

  const lines = fs
    .readFileSync(path.join(process.cwd(), file), 'utf-8')
    .split('\n')

  let sum = 0
  let count = 0

  for (let line of lines) {
    if (line.trim().length) {
      const metric = JSON.parse(line)

      if (
        metric.type === 'Point' &&
        metric.metric === 'http_req_duration' &&
        metric.data.tags.status === '200'
      ) {
        count++
        sum += metric.data.value
      }
    }
  }

  return {
    name,
    file,
    avg: sum / count,
  }
}

const pointers = rawPointers.map(createReport)

const stats = pointers
  .map((pointer) => `${pointer.name}: ${pointer.avg.toFixed(2)} ms`)
  .join('\n')

console.log(stats)
