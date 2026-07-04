import { createId, type FeatureStructure } from "./model";

export interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
  avm?: FeatureStructure;
}

export function createTreeNode(
  label = "XP",
  children: TreeNode[] = [],
  avm?: FeatureStructure
): TreeNode {
  return {
    id: createId("tree"),
    label,
    children,
    avm
  };
}

export function createInitialTree(): TreeNode {
  return createTreeNode("S", [createTreeNode("NP"), createTreeNode("VP")]);
}
