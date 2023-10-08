import { createCatchAllMeta } from '@theguild/components';
import json from '../../../remote-files/v3.json';

export default async () => {
  return createCatchAllMeta(json.filePaths, json.nestedMeta);
};
