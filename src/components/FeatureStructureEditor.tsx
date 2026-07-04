import {
  ArrowDown,
  ArrowUp,
  Circle,
  CornerDownRight,
  Link2,
  ListPlus,
  Plus,
  Trash2
} from "lucide-react";
import {
  createFeatureEntry,
  createIndexRefValue,
  createListValue,
  defaultValueForKind,
  moveFeatureById,
  moveFeatureToPosition,
  orderFeaturesCanonically,
  type FeatureEntry,
  type FeatureStructure,
  type FSValue,
  type ValueKind
} from "../core/model";
import {
  createDefaultListItemForFeature,
  createFeatureEntryFromSpec,
  createValueForFeature,
  getFeatureSpecForType,
  getFeatureValueSpec,
  getMissingFeatureSuggestions,
  getSbcgTypeSpec,
  retargetFeatureStructureType,
  typeRegistry,
  type SbcgFeatureSpec,
  type FeatureSuggestion
} from "../core/sbcgProfile";
import {
  getArgStItems,
  getFrameParticipantLinks,
  getNextIndexId,
  linkFrameParticipantToArgSt,
  setFrameParticipantIndex,
  type ArgStItem,
  type FrameParticipantLink
} from "../core/semanticLinks";

const valueKinds: ValueKind[] = [
  "atomic",
  "type",
  "list",
  "feature-structure",
  "index-ref",
  "underspecified"
];
const frameElementOptionValue = "__frame_element__";

interface FeatureStructureEditorProps {
  structure: FeatureStructure;
  onChange: (structure: FeatureStructure) => void;
  availableIndexes: string[];
  activeIndex?: string;
  onSelectIndex: (indexId: string) => void;
  compact?: boolean;
  rootStructure?: FeatureStructure;
  onRootChange?: (structure: FeatureStructure) => void;
}

export function FeatureStructureEditor({
  structure,
  onChange,
  availableIndexes,
  activeIndex,
  onSelectIndex,
  compact = false,
  rootStructure: rootStructureProp,
  onRootChange: onRootChangeProp
}: FeatureStructureEditorProps) {
  const rootStructure = rootStructureProp ?? structure;
  const onRootChange = onRootChangeProp ?? onChange;
  const typeSpec = getSbcgTypeSpec(structure.type);
  const missingFeatureSuggestions = getMissingFeatureSuggestions(structure);
  const typeOptionsId = `${structure.id}-type-options`;
  const argStItems = getArgStItems(rootStructure);
  const frameParticipantLinks = getFrameParticipantLinks(rootStructure);
  const participantByFeatureId = new Map(
    frameParticipantLinks.map((participant) => [participant.featureId, participant])
  );
  const nextIndexId = getNextIndexId(rootStructure);
  const canAddFrameElement = isFrameLikeType(structure.type);
  const addFeatureFromSpec = (suggestion: FeatureSuggestion) =>
    onChange({
      ...structure,
      features: orderFeaturesCanonically([
        ...structure.features,
        createFeatureEntryFromSpec(suggestion)
      ])
    });
  const addFrameElement = () =>
    onChange({
      ...structure,
      features: orderFeaturesCanonically([
        ...structure.features,
        createFeatureEntry(
          getNextFrameElementName(structure.features),
          createIndexRefValue(nextIndexId)
        )
      ])
    });
  const updateFeature = (featureId: string, next: FeatureEntry, canonicalizeOrder = false) => {
    const features = structure.features.map((feature) => (feature.id === featureId ? next : feature));
    onChange({
      ...structure,
      features: canonicalizeOrder ? orderFeaturesCanonically(features) : features
    });
  };

  return (
    <section className={compact ? "fs-editor compact" : "fs-editor"}>
      <div className="fs-type-row">
        <label>
          Type
          <input
            value={structure.type ?? ""}
            placeholder="untyped"
            list={typeOptionsId}
            onChange={(event) =>
              onChange(retargetFeatureStructureType(structure, event.target.value))
            }
          />
          <datalist id={typeOptionsId}>
            {Object.keys(typeRegistry).map((typeName) => (
              <option key={typeName} value={typeName} />
            ))}
          </datalist>
        </label>
        {typeSpec ? (
          <LicensedFeaturePicker
            suggestions={missingFeatureSuggestions}
            onAdd={addFeatureFromSpec}
            onAddFrameElement={canAddFrameElement ? addFrameElement : undefined}
          />
        ) : (
          <button
            className="icon-text-button"
            type="button"
            title="Add feature"
            onClick={() =>
              onChange({
                ...structure,
                features: orderFeaturesCanonically([
                  ...structure.features,
                  createFeatureEntry("FEATURE")
                ])
              })
            }
          >
            <Plus size={16} />
            Add feature
          </button>
        )}
      </div>

      <div className="feature-list">
        {structure.features.map((feature, index) => {
          const featureSpec = getFeatureSpecForType(structure.type, feature.name);
          const frameParticipant = participantByFeatureId.get(feature.id);
          return (
            <div className="feature-row" key={feature.id}>
            <div className="order-controls" aria-label={`Order controls for ${feature.name}`}>
              <button
                className="icon-button"
                type="button"
                title={`Move ${feature.name} up`}
                disabled={index === 0}
                onClick={() => onChange(moveFeatureById(structure, feature.id, -1))}
              >
                <ArrowUp size={15} />
              </button>
              <label>
                Order
                <input
                  min={1}
                  max={structure.features.length}
                  type="number"
                  value={index + 1}
                  aria-label={`Order of ${feature.name}`}
                  onChange={(event) =>
                    onChange(
                      moveFeatureToPosition(structure, feature.id, Number(event.target.value))
                    )
                  }
                />
              </label>
              <button
                className="icon-button"
                type="button"
                title={`Move ${feature.name} down`}
                disabled={index === structure.features.length - 1}
                onClick={() => onChange(moveFeatureById(structure, feature.id, 1))}
              >
                <ArrowDown size={15} />
              </button>
            </div>
            <input
              className="feature-name-input"
              aria-label="Feature name"
              value={feature.name}
              onChange={(event) => {
                const name = event.target.value.toUpperCase();
                const renamedFeatureSpec = getFeatureSpecForType(structure.type, name);
                updateFeature(feature.id, {
                  ...feature,
                  name,
                  value: shouldInferValueForRenamedFeature(feature.value)
                    ? renamedFeatureSpec
                      ? createFeatureEntryFromSpec(renamedFeatureSpec).value
                      : createValueForFeature(name)
                    : feature.value
                }, true);
              }}
            />
            <div className="feature-value-cell">
              <ValueEditor
                featureName={feature.name}
                featureSpec={featureSpec}
                value={feature.value}
                onChange={(value) => updateFeature(feature.id, { ...feature, value })}
                availableIndexes={availableIndexes}
                activeIndex={activeIndex}
                onSelectIndex={onSelectIndex}
                rootStructure={rootStructure}
                onRootChange={onRootChange}
              />
              {frameParticipant && argStItems.length > 0 && (
                <InlineFrameLinkControls
                  participant={frameParticipant}
                  argStItems={argStItems}
                  nextIndexId={nextIndexId}
                  onSetParticipantIndex={(participant, indexId) => {
                    onRootChange(
                      setFrameParticipantIndex(rootStructure, participant.featureId, indexId)
                    );
                    if (indexId.trim()) {
                      onSelectIndex(indexId.trim());
                    }
                  }}
                  onLink={(participant, argStItem, indexId) => {
                    onRootChange(
                      linkFrameParticipantToArgSt(
                        rootStructure,
                        participant.featureId,
                        argStItem.itemIndex,
                        indexId
                      )
                    );
                    onSelectIndex(indexId);
                  }}
                />
              )}
            </div>
            <button
              className="icon-button danger"
              type="button"
              title={`Delete ${feature.name}`}
              onClick={() =>
                onChange({
                  ...structure,
                  features: structure.features.filter((candidate) => candidate.id !== feature.id)
                })
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
          );
        })}
      </div>
    </section>
  );
}

function LicensedFeaturePicker({
  suggestions,
  onAdd,
  onAddFrameElement
}: {
  suggestions: FeatureSuggestion[];
  onAdd: (suggestion: FeatureSuggestion) => void;
  onAddFrameElement?: () => void;
}) {
  const hasFrameElementAction = Boolean(onAddFrameElement);
  const isDisabled = suggestions.length === 0 && !hasFrameElementAction;

  return (
    <label className="licensed-feature-picker">
      Add Feature
      <select
        aria-label="Add licensed feature"
        value=""
        disabled={isDisabled}
        onChange={(event) => {
          if (event.target.value === frameElementOptionValue) {
            onAddFrameElement?.();
            return;
          }

          const suggestion = suggestions.find(
            (candidate) => candidate.name === event.target.value
          );
          if (suggestion) {
            onAdd(suggestion);
          }
        }}
      >
        <option value="">
          {suggestions.length > 0
            ? "Add licensed feature"
            : hasFrameElementAction
              ? "Add feature"
              : "All features added"}
        </option>
        {suggestions.map((suggestion) => (
          <option key={suggestion.name} value={suggestion.name}>
            {suggestion.name} : {suggestion.valueType}
          </option>
        ))}
        {hasFrameElementAction && (
          <option value={frameElementOptionValue}>Add frame element</option>
        )}
      </select>
    </label>
  );
}

function isFrameLikeType(type?: string, seenTypes = new Set<string>()): boolean {
  const typeSpec = getSbcgTypeSpec(type);
  if (!typeSpec || seenTypes.has(typeSpec.type)) {
    return false;
  }
  if (typeSpec.type === "frame") {
    return true;
  }

  seenTypes.add(typeSpec.type);
  return (typeSpec.parents ?? []).some((parentType) => isFrameLikeType(parentType, seenTypes));
}

function getNextFrameElementName(features: FeatureEntry[]): string {
  const existingNames = new Set(features.map((feature) => feature.name.toUpperCase()));
  if (!existingNames.has("ROLE")) {
    return "ROLE";
  }

  let counter = 2;
  while (existingNames.has(`ROLE-${counter}`)) {
    counter += 1;
  }
  return `ROLE-${counter}`;
}

function InlineFrameLinkControls({
  participant,
  argStItems,
  nextIndexId,
  onSetParticipantIndex,
  onLink
}: {
  participant: FrameParticipantLink;
  argStItems: ArgStItem[];
  nextIndexId: string;
  onSetParticipantIndex: (participant: FrameParticipantLink, indexId: string) => void;
  onLink: (participant: FrameParticipantLink, argStItem: ArgStItem, indexId: string) => void;
}) {
  const currentIndex = participant.indexId ?? "";
  const effectiveIndex = currentIndex || nextIndexId;

  return (
    <div className="inline-frame-link-controls" aria-label={`${participant.role} argument link`}>
      <span className="inline-frame-link-title">
        <Link2 size={14} />
        <span>{participant.frameType ?? `frame ${participant.frameIndex + 1}`}</span>
      </span>
      <label>
        Index
        <input
          aria-label={`Index for ${participant.role}`}
          value={currentIndex}
          placeholder={nextIndexId}
          onChange={(event) => onSetParticipantIndex(participant, event.target.value)}
        />
      </label>
      <label>
        ARG-ST
        <select
          aria-label={`Map ${participant.role} to ARG-ST`}
          value=""
          onChange={(event) => {
            const selectedItem = argStItems.find(
              (item) => item.itemIndex === Number(event.target.value)
            );
            if (selectedItem) {
              onLink(participant, selectedItem, effectiveIndex);
            }
          }}
        >
          <option value="">Map to argument</option>
          {argStItems.map((item) => (
            <option key={item.itemIndex} value={item.itemIndex}>
              {item.itemIndex + 1}. {item.label}
              {item.indexId ? ` #${item.indexId}` : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function FeatureSuggestions({
  suggestions,
  onAdd
}: {
  suggestions: FeatureSuggestion[];
  onAdd: (suggestion: FeatureSuggestion) => void;
}) {
  return (
    <div className="feature-suggestions" aria-label="SBCG feature suggestions">
      {suggestions.map((suggestion) => (
        <button
          className="suggestion-chip"
          key={suggestion.name}
          type="button"
          title={suggestion.description}
          onClick={() => onAdd(suggestion)}
        >
          <Plus size={14} />
          <span>{suggestion.name}</span>
          <small>{suggestion.valueType}</small>
        </button>
      ))}
    </div>
  );
}

interface ValueEditorProps {
  value: FSValue;
  onChange: (value: FSValue) => void;
  availableIndexes: string[];
  activeIndex?: string;
  onSelectIndex: (indexId: string) => void;
  featureName?: string;
  featureSpec?: SbcgFeatureSpec;
  rootStructure: FeatureStructure;
  onRootChange: (structure: FeatureStructure) => void;
}

function ValueEditor({
  value,
  onChange,
  availableIndexes,
  activeIndex,
  onSelectIndex,
  featureName,
  featureSpec,
  rootStructure,
  onRootChange
}: ValueEditorProps) {
  const indexedClass = value.indexId && value.indexId === activeIndex ? " index-active" : "";

  return (
    <div className={`value-editor${indexedClass}`}>
      <div className="value-toolbar">
        <select
          aria-label="Value type"
          value={value.kind}
          onChange={(event) => onChange(defaultValueForKind(event.target.value as ValueKind))}
        >
          {valueKinds.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
        {value.kind !== "index-ref" && (
          <label className="index-input">
            <Circle size={14} />
            <input
              value={value.indexId ?? ""}
              placeholder="#"
              onFocus={() => value.indexId && onSelectIndex(value.indexId)}
              onChange={(event) =>
                onChange({
                  ...value,
                  indexId: event.target.value || undefined
                })
              }
            />
          </label>
        )}
        {availableIndexes.length > 0 && (
          <select
            aria-label="Reuse index"
            value={value.kind === "index-ref" ? value.indexId : ""}
            onChange={(event) => {
              if (event.target.value) {
                onChange({ kind: "index-ref", indexId: event.target.value });
                onSelectIndex(event.target.value);
              }
            }}
          >
            <option value="">Reuse index</option>
            {availableIndexes.map((indexId) => (
              <option key={indexId} value={indexId}>
                #{indexId}
              </option>
            ))}
          </select>
        )}
      </div>
      <ValueBodyEditor
        featureName={featureName}
        featureSpec={featureSpec}
        value={value}
        onChange={onChange}
        availableIndexes={availableIndexes}
        activeIndex={activeIndex}
        onSelectIndex={onSelectIndex}
        rootStructure={rootStructure}
        onRootChange={onRootChange}
      />
    </div>
  );
}

function ValueBodyEditor(props: ValueEditorProps) {
  const { value, onChange, availableIndexes, activeIndex, onSelectIndex } = props;

  if (value.kind === "atomic") {
    const valueSpec = props.featureSpec ? getFeatureValueSpec(props.featureSpec) : undefined;
    if (valueSpec?.kind === "atomic" && valueSpec.values?.length) {
      return (
        <select
          aria-label={`${props.featureName ?? "Atomic"} value`}
          className="value-input"
          value={value.value}
          onChange={(event) => onChange({ ...value, value: event.target.value })}
        >
          <option value="">Choose value</option>
          {valueSpec.values.map((atomicValue) => (
            <option key={atomicValue} value={atomicValue}>
              {atomicValue}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        className="value-input"
        value={value.value}
        placeholder="walks"
        onChange={(event) => onChange({ ...value, value: event.target.value })}
      />
    );
  }

  if (value.kind === "type") {
    return (
      <input
        className="value-input italic"
        value={value.label}
        placeholder="NP"
        onChange={(event) => onChange({ ...value, label: event.target.value })}
      />
    );
  }

  if (value.kind === "index-ref") {
    return (
      <button
        className={value.indexId === activeIndex ? "index-pill active" : "index-pill"}
        type="button"
        onClick={() => onSelectIndex(value.indexId)}
      >
        #{value.indexId}
      </button>
    );
  }

  if (value.kind === "underspecified") {
    return <span className="underspecified">_</span>;
  }

  if (value.kind === "list") {
    return (
      <div className="list-editor">
        <div className="list-items">
          {value.items.length === 0 && <span className="empty-list">&lt; &gt;</span>}
          {value.items.map((item, index) => (
            <div className="list-item" key={`${index}-${item.kind}`}>
              <CornerDownRight size={14} />
              <ValueEditor
                value={item}
                onChange={(nextItem) =>
                  onChange({
                    ...value,
                    items: value.items.map((candidate, itemIndex) =>
                      itemIndex === index ? nextItem : candidate
                    )
                  })
                }
                availableIndexes={availableIndexes}
                activeIndex={activeIndex}
                onSelectIndex={onSelectIndex}
                rootStructure={props.rootStructure}
                onRootChange={props.onRootChange}
              />
              <button
                className="icon-button danger"
                type="button"
                title="Remove list item"
                onClick={() =>
                  onChange({
                    ...value,
                    items: value.items.filter((_, itemIndex) => itemIndex !== index)
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="icon-text-button subtle"
          type="button"
          title="Add list item"
          onClick={() =>
            onChange({
              ...value,
              items: [...value.items, createDefaultListItemForFeature(props.featureSpec)]
            })
          }
        >
          <ListPlus size={16} />
          Add item
        </button>
      </div>
    );
  }

  return (
    <FeatureStructureEditor
      structure={value.structure}
      onChange={(structure) => onChange({ ...value, structure })}
      availableIndexes={availableIndexes}
      activeIndex={activeIndex}
      onSelectIndex={onSelectIndex}
      rootStructure={props.rootStructure}
      onRootChange={props.onRootChange}
      compact
    />
  );
}

export function makeListValueFrom(value: FSValue): FSValue {
  return createListValue([value]);
}

function shouldInferValueForRenamedFeature(value: FSValue): boolean {
  if (value.kind === "underspecified") {
    return true;
  }
  if (value.kind === "atomic") {
    return value.value.length === 0;
  }
  if (value.kind === "type") {
    return value.label.length === 0 || value.label === "type";
  }
  if (value.kind === "list") {
    return value.items.length === 0;
  }
  if (value.kind === "feature-structure") {
    return !value.structure.type && value.structure.features.length === 0;
  }
  return false;
}
