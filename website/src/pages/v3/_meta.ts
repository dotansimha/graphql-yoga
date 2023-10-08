import { createCatchAllMeta } from 'nextra/catch-all';
import json from '../../../remote-files/v3.json';

export default async () => {
  return createCatchAllMeta(json.filePaths, json.nestedMeta);
};
