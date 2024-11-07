export const batchRequestIndexMap = new WeakMap<object, number>();

export function getBatchRequestIndexFromContext(context: object): number | null {
  return batchRequestIndexMap.get(context) ?? null;
}
