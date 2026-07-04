import {
  createIndexRefValue,
  type FeatureEntry,
  type FeatureStructure,
  type FSValue,
  type ListValue
} from "./model";

const nonParticipantFrameFeatures = new Set([
  "LABEL",
  "LBL",
  "LTOP",
  "INDEX",
  "IND",
  "SIT",
  "BV",
  "RESTR",
  "SCOPE"
]);

export interface ArgStItem {
  itemIndex: number;
  label: string;
  indexId?: string;
}

export interface FrameParticipantLink {
  frameIndex: number;
  frameType?: string;
  featureId: string;
  role: string;
  indexId?: string;
}

export function getArgStItems(structure: FeatureStructure): ArgStItem[] {
  const argSt = getTopLevelListFeature(structure, "ARG-ST");
  if (!argSt) {
    return [];
  }

  return argSt.items.map((item, itemIndex) => ({
    itemIndex,
    label: labelForValue(item, `ARG ${itemIndex + 1}`),
    indexId: getValueIndex(item)
  }));
}

export function getFrameParticipantLinks(structure: FeatureStructure): FrameParticipantLink[] {
  const frames = getSemFrames(structure);
  if (!frames) {
    return [];
  }

  return frames.items.flatMap((frameValue, frameIndex) => {
    if (frameValue.kind !== "feature-structure") {
      return [];
    }

    return frameValue.structure.features
      .filter((feature) => isFrameParticipant(feature))
      .map((feature) => ({
        frameIndex,
        frameType: frameValue.structure.type,
        featureId: feature.id,
        role: feature.name,
        indexId: getValueIndex(feature.value)
      }));
  });
}

export function linkFrameParticipantToArgSt(
  structure: FeatureStructure,
  participantFeatureId: string,
  argStItemIndex: number,
  indexId: string
): FeatureStructure {
  const normalizedIndex = indexId.trim();
  if (!normalizedIndex) {
    return structure;
  }

  return updateArgStItemIndex(
    updateFeatureValueById(structure, participantFeatureId, createIndexRefValue(normalizedIndex)),
    argStItemIndex,
    normalizedIndex
  );
}

export function setFrameParticipantIndex(
  structure: FeatureStructure,
  participantFeatureId: string,
  indexId: string
): FeatureStructure {
  const normalizedIndex = indexId.trim();
  if (!normalizedIndex) {
    return structure;
  }
  return updateFeatureValueById(structure, participantFeatureId, createIndexRefValue(normalizedIndex));
}

export function getNextIndexId(structure: FeatureStructure): string {
  const preferredIndexes = ["i", "j", "k", "l", "m", "n", "x", "y", "z"];
  const indexes = [
    ...getArgStItems(structure).map((item) => item.indexId),
    ...getFrameParticipantLinks(structure).map((participant) => participant.indexId)
  ].filter((indexId): indexId is string => Boolean(indexId));

  const nextPreferred = preferredIndexes.find((indexId) => !indexes.includes(indexId));
  if (nextPreferred) {
    return nextPreferred;
  }

  const numericIndexes = indexes
    .map((indexId) => Number(indexId))
    .filter((index) => Number.isInteger(index) && index > 0);

  if (numericIndexes.length === 0) {
    return "1";
  }
  return String(Math.max(...numericIndexes) + 1);
}

function getTopLevelListFeature(structure: FeatureStructure, featureName: string): ListValue | undefined {
  const feature = structure.features.find(
    (candidate) => candidate.name.toUpperCase() === featureName
  );
  return feature?.value.kind === "list" ? feature.value : undefined;
}

function getSemFrames(structure: FeatureStructure): ListValue | undefined {
  const semFeature = structure.features.find(
    (feature) => ["SEM", "SEMANTICS"].includes(feature.name.toUpperCase())
  );
  if (semFeature?.value.kind !== "feature-structure") {
    return undefined;
  }

  const framesFeature = semFeature.value.structure.features.find(
    (feature) => feature.name.toUpperCase() === "FRAMES"
  );
  return framesFeature?.value.kind === "list" ? framesFeature.value : undefined;
}

function isFrameParticipant(feature: FeatureEntry): boolean {
  const name = feature.name.toUpperCase();
  if (nonParticipantFrameFeatures.has(name)) {
    return false;
  }
  return !isNullishValue(feature.value);
}

function isNullishValue(value: FSValue): boolean {
  if (value.kind === "atomic") {
    return ["", "none", "null"].includes(value.value.trim().toLowerCase());
  }
  if (value.kind === "type") {
    return ["none", "null"].includes(value.label.trim().toLowerCase());
  }
  return false;
}

function getValueIndex(value: FSValue): string | undefined {
  if (value.kind === "index-ref") {
    return value.indexId;
  }
  return value.indexId;
}

function updateArgStItemIndex(
  structure: FeatureStructure,
  itemIndex: number,
  indexId: string
): FeatureStructure {
  return {
    ...structure,
    features: structure.features.map((feature) => {
      if (feature.name.toUpperCase() !== "ARG-ST" || feature.value.kind !== "list") {
        return feature;
      }

      return {
        ...feature,
        value: {
          ...feature.value,
          items: feature.value.items.map((item, index) =>
            index === itemIndex ? { ...item, indexId } : item
          )
        }
      };
    })
  };
}

function updateFeatureValueById(
  structure: FeatureStructure,
  featureId: string,
  value: FSValue
): FeatureStructure {
  return {
    ...structure,
    features: structure.features.map((feature) => updateEntryValueById(feature, featureId, value))
  };
}

function updateEntryValueById(entry: FeatureEntry, featureId: string, value: FSValue): FeatureEntry {
  if (entry.id === featureId) {
    return { ...entry, value };
  }

  if (entry.value.kind === "feature-structure") {
    return {
      ...entry,
      value: {
        ...entry.value,
        structure: updateFeatureValueById(entry.value.structure, featureId, value)
      }
    };
  }

  if (entry.value.kind === "list") {
    return {
      ...entry,
      value: {
        ...entry.value,
        items: entry.value.items.map((item) => updateValueByFeatureId(item, featureId, value))
      }
    };
  }

  return entry;
}

function updateValueByFeatureId(value: FSValue, featureId: string, nextValue: FSValue): FSValue {
  if (value.kind === "feature-structure") {
    return {
      ...value,
      structure: updateFeatureValueById(value.structure, featureId, nextValue)
    };
  }

  if (value.kind === "list") {
    return {
      ...value,
      items: value.items.map((item) => updateValueByFeatureId(item, featureId, nextValue))
    };
  }

  return value;
}

function labelForValue(value: FSValue, fallback: string): string {
  if (value.kind === "type") {
    return value.label || fallback;
  }
  if (value.kind === "feature-structure") {
    return value.structure.type || fallback;
  }
  if (value.kind === "atomic") {
    return value.value || fallback;
  }
  if (value.kind === "index-ref") {
    return `#${value.indexId}`;
  }
  return fallback;
}
