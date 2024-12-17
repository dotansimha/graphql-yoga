import { createCatchAllMeta } from 'nextra/catch-all'
import json from '../../../remote-files/v2.json' assert { type: 'json' }

export default async () => {
  return createCatchAllMeta(json.filePaths, json.nestedMeta)
}
