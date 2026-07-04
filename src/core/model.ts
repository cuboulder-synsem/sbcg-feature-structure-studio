export type ValueKind =
  | "atomic"
  | "type"
  | "list"
  | "feature-structure"
  | "index-ref"
  | "underspecified";

interface BaseValue {
  kind: ValueKind;
  indexId?: string;
}

export interface AtomicValue extends BaseValue {
  kind: "atomic";
  value: string;
}

export interface TypeValue extends BaseValue {
  kind: "type";
  label: string;
}

export interface ListValue extends BaseValue {
  kind: "list";
  items: FSValue[];
}

export interface FeatureStructureValue extends BaseValue {
  kind: "feature-structure";
  structure: FeatureStructure;
}

export interface IndexRefValue extends BaseValue {
  kind: "index-ref";
  indexId: string;
}

export interface UnderspecifiedValue extends BaseValue {
  kind: "underspecified";
}

export type FSValue =
  | AtomicValue
  | TypeValue
  | ListValue
  | FeatureStructureValue
  | IndexRefValue
  | UnderspecifiedValue;

export interface FeatureStructure {
  id: string;
  type?: string;
  features: FeatureEntry[];
}

export interface FeatureEntry {
  id: string;
  name: string;
  value: FSValue;
}

export interface IndexRegistry {
  [indexId: string]: FSValue;
}

export const canonicalMajorFeatureOrder = ["PHON", "FORM", "SYN", "ARG-ST", "SEM", "CNTXT"] as const;

const canonicalMajorFeatureRanks = new Map<string, number>(
  canonicalMajorFeatureOrder.map((featureName, index) => [featureName, index])
);

export const createId = (prefix = "id"): string =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

export function createAtomicValue(value = ""): AtomicValue {
  return { kind: "atomic", value };
}

export function createTypeValue(label = "type"): TypeValue {
  return { kind: "type", label };
}

export function createListValue(items: FSValue[] = []): ListValue {
  return { kind: "list", items };
}

export function createNestedFeatureStructureValue(
  structure = createFeatureStructure()
): FeatureStructureValue {
  return { kind: "feature-structure", structure };
}

export function createIndexRefValue(indexId: string): IndexRefValue {
  return { kind: "index-ref", indexId };
}

export function createUnderspecifiedValue(): UnderspecifiedValue {
  return { kind: "underspecified" };
}

export function createFeatureEntry(name = "FEATURE", value: FSValue = createUnderspecifiedValue()): FeatureEntry {
  return {
    id: createId("feature"),
    name,
    value
  };
}

export function createFeatureStructure(
  type = "object",
  features: FeatureEntry[] = []
): FeatureStructure {
  return {
    id: createId("fs"),
    type,
    features: orderFeaturesCanonically(features)
  };
}

export function createInitialSign(): FeatureStructure {
  return createFeatureStructure("sign", [
    createFeatureEntry("PHON", createListValue([createAtomicValue("")])),
    createFeatureEntry("SYN", createNestedFeatureStructureValue(createFeatureStructure("syn-obj"))),
    createFeatureEntry("ARG-ST", createListValue([])),
    createFeatureEntry("SEM", createNestedFeatureStructureValue(createFeatureStructure("sem-obj")))
  ]);
}

export function assignIndexToValue<T extends FSValue>(
  registry: IndexRegistry,
  indexId: string,
  value: T
): T {
  const indexed = { ...value, indexId } as T;
  registry[indexId] = indexed;
  return indexed;
}

export function cloneValue(value: FSValue): FSValue {
  return structuredClone(value) as FSValue;
}

export function defaultValueForKind(kind: ValueKind): FSValue {
  switch (kind) {
    case "atomic":
      return createAtomicValue("");
    case "type":
      return createTypeValue("type");
    case "list":
      return createListValue([]);
    case "feature-structure":
      return createNestedFeatureStructureValue(createFeatureStructure());
    case "index-ref":
      return createIndexRefValue("1");
    case "underspecified":
      return createUnderspecifiedValue();
  }
}

export function collectIndexIdsFromValue(value: FSValue, ids = new Set<string>()): Set<string> {
  if (value.indexId) {
    ids.add(value.indexId);
  }

  if (value.kind === "list") {
    value.items.forEach((item) => collectIndexIdsFromValue(item, ids));
  }

  if (value.kind === "feature-structure") {
    value.structure.features.forEach((feature) => collectIndexIdsFromValue(feature.value, ids));
  }

  return ids;
}

export function collectIndexIds(structure: FeatureStructure): string[] {
  const ids = new Set<string>();
  structure.features.forEach((feature) => collectIndexIdsFromValue(feature.value, ids));
  return [...ids].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function orderFeaturesCanonically(features: FeatureEntry[]): FeatureEntry[] {
  return features
    .map((feature, originalIndex) => ({ feature, originalIndex }))
    .sort((left, right) => {
      const leftRank = getCanonicalFeatureRank(left.feature.name);
      const rightRank = getCanonicalFeatureRank(right.feature.name);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.originalIndex - right.originalIndex;
    })
    .map(({ feature }) => feature);
}

export function orderStructureFeaturesCanonically(structure: FeatureStructure): FeatureStructure {
  return {
    ...structure,
    features: orderFeaturesCanonically(structure.features)
  };
}

export function getCanonicalFeatureRank(featureName: string): number {
  return canonicalMajorFeatureRanks.get(normalizeCanonicalFeatureName(featureName)) ?? Number.MAX_SAFE_INTEGER;
}

export function compareFeatureNamesCanonically(left: string, right: string): number {
  const leftRank = getCanonicalFeatureRank(left);
  const rightRank = getCanonicalFeatureRank(right);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  return left.localeCompare(right);
}

function normalizeCanonicalFeatureName(featureName: string): string {
  const normalized = featureName.trim().toUpperCase();
  if (["SYNTAX"].includes(normalized)) {
    return "SYN";
  }
  if (["SEMANTICS"].includes(normalized)) {
    return "SEM";
  }
  if (["CONTEXT"].includes(normalized)) {
    return "CNTXT";
  }
  if (["ARGUMENT-STRUCTURE", "ARGUMENTSTRUCTURE", "ARGUMENT STRUCTURE"].includes(normalized)) {
    return "ARG-ST";
  }
  return normalized;
}

export function moveFeatureById(
  structure: FeatureStructure,
  featureId: string,
  delta: -1 | 1
): FeatureStructure {
  const currentIndex = structure.features.findIndex((feature) => feature.id === featureId);
  if (currentIndex < 0) {
    return structure;
  }
  return moveFeatureToIndex(structure, currentIndex, currentIndex + delta);
}

export function moveFeatureToPosition(
  structure: FeatureStructure,
  featureId: string,
  position: number
): FeatureStructure {
  const currentIndex = structure.features.findIndex((feature) => feature.id === featureId);
  if (currentIndex < 0) {
    return structure;
  }
  return moveFeatureToIndex(structure, currentIndex, position - 1);
}

function moveFeatureToIndex(
  structure: FeatureStructure,
  currentIndex: number,
  targetIndex: number
): FeatureStructure {
  const clampedTarget = Math.min(Math.max(targetIndex, 0), structure.features.length - 1);
  if (currentIndex === clampedTarget) {
    return structure;
  }

  const features = [...structure.features];
  const [movedFeature] = features.splice(currentIndex, 1);
  features.splice(clampedTarget, 0, movedFeature);
  return { ...structure, features };
}
