import type { FeatureStructure } from "./model";
import type { TreeNode } from "./treeModel";

export type SerializableStudioData = FeatureStructure | TreeNode;

export function exportJson(data: SerializableStudioData): string {
  return JSON.stringify(data, null, 2);
}

export function importJson<T extends SerializableStudioData = SerializableStudioData>(json: string): T {
  const parsed = JSON.parse(json) as T;
  return parsed;
}
