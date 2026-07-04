import type { FeatureStructure, FSValue } from "../core/model";

interface AvmPreviewProps {
  structure: FeatureStructure;
  activeIndex?: string;
  onSelectIndex: (indexId: string) => void;
  depth?: number;
}

export function AvmPreview({ structure, activeIndex, onSelectIndex }: AvmPreviewProps) {
  return (
    <div className="avm-preview" aria-label="AVM preview">
      <PreviewStructure
        structure={structure}
        activeIndex={activeIndex}
        onSelectIndex={onSelectIndex}
      />
    </div>
  );
}

function PreviewStructure({
  structure,
  activeIndex,
  onSelectIndex,
  depth = 0
}: AvmPreviewProps) {
  const bracketDepth = Math.min(depth, 4);

  return (
    <div className={`preview-structure preview-depth-${bracketDepth}`} data-depth={depth}>
      <span className={`bracket left bracket-depth-${bracketDepth}`} aria-hidden="true" />
      <div className="preview-content">
        {structure.type && <div className="preview-type">{structure.type}</div>}
        {structure.features.map((feature) => (
          <div className="preview-row" key={feature.id}>
            <span className="preview-feature">{feature.name}</span>
            <PreviewValue
              value={feature.value}
              activeIndex={activeIndex}
              onSelectIndex={onSelectIndex}
              depth={depth}
            />
          </div>
        ))}
      </div>
      <span className={`bracket right bracket-depth-${bracketDepth}`} aria-hidden="true" />
    </div>
  );
}

interface PreviewValueProps {
  value: FSValue;
  activeIndex?: string;
  onSelectIndex: (indexId: string) => void;
  depth: number;
}

function PreviewValue({ value, activeIndex, onSelectIndex, depth }: PreviewValueProps) {
  const marker = value.indexId ? (
    <SubscriptIndex
      indexId={value.indexId}
      activeIndex={activeIndex}
      onSelectIndex={onSelectIndex}
    />
  ) : null;

  if (value.kind === "atomic") {
    return (
      <span className="preview-value">
        {value.value}
        {marker}
      </span>
    );
  }

  if (value.kind === "type") {
    return (
      <span className="preview-value preview-type-value">
        {value.label || "type"}
        {marker}
      </span>
    );
  }

  if (value.kind === "underspecified") {
    return (
      <span className="preview-value">
        _
        {marker}
      </span>
    );
  }

  if (value.kind === "index-ref") {
    return (
      <span className="preview-value">
        <IndexValue
          indexId={value.indexId}
          activeIndex={activeIndex}
          onSelectIndex={onSelectIndex}
        />
      </span>
    );
  }

  if (value.kind === "list") {
    const listIsTall = containsTallListItem(value.items);

    if (!listIsTall) {
      return (
        <span className="preview-list preview-list-compact">
          <span>〈</span>
          {value.items.length > 0 && <span> </span>}
          {value.items.map((item, index) => (
            <span className="preview-list-item" key={`${index}-${item.kind}`}>
              <PreviewValue
                value={item}
                activeIndex={activeIndex}
                onSelectIndex={onSelectIndex}
                depth={depth}
              />
              {index < value.items.length - 1 && <span>, </span>}
            </span>
          ))}
          {value.items.length > 0 && <span> </span>}
          <span>〉</span>
          {marker}
        </span>
      );
    }

    return (
      <span className="preview-list preview-list-bracketed">
        <PreviewListFence side="left" />
        <span className="preview-list-content">
          {value.items.length === 0 && <span className="preview-list-empty" aria-hidden="true" />}
          {value.items.map((item, index) => (
            <span className="preview-list-item" key={`${index}-${item.kind}`}>
              <PreviewValue
                value={item}
                activeIndex={activeIndex}
                onSelectIndex={onSelectIndex}
                depth={depth}
              />
              {index < value.items.length - 1 && <span>, </span>}
            </span>
          ))}
        </span>
        <PreviewListFence side="right" />
        {marker}
      </span>
    );
  }

  return (
    <span className="preview-nested">
      <PreviewStructure
        structure={value.structure}
        activeIndex={activeIndex}
        onSelectIndex={onSelectIndex}
        depth={depth + 1}
      />
      {marker}
    </span>
  );
}

function containsTallListItem(items: FSValue[]): boolean {
  return items.some((item) => {
    if (item.kind === "feature-structure") {
      return true;
    }
    if (item.kind === "list") {
      return containsTallListItem(item.items);
    }
    return false;
  });
}

function PreviewListFence({ side }: { side: "left" | "right" }) {
  return (
    <span
      className={`preview-list-fence preview-list-fence-${side}`}
      aria-hidden="true"
    />
  );
}

function IndexValue({
  indexId,
  activeIndex,
  onSelectIndex
}: {
  indexId: string;
  activeIndex?: string;
  onSelectIndex: (indexId: string) => void;
}) {
  return (
    <button
      className={indexId === activeIndex ? "preview-index-value active" : "preview-index-value"}
      type="button"
      onClick={() => onSelectIndex(indexId)}
      title={`Highlight index ${indexId}`}
    >
      {indexId}
    </button>
  );
}

function SubscriptIndex({
  indexId,
  activeIndex,
  onSelectIndex
}: {
  indexId: string;
  activeIndex?: string;
  onSelectIndex: (indexId: string) => void;
}) {
  return (
    <button
      className={
        indexId === activeIndex ? "preview-index-subscript active" : "preview-index-subscript"
      }
      type="button"
      onClick={() => onSelectIndex(indexId)}
      title={`Highlight index ${indexId}`}
    >
      <sub>{indexId}</sub>
    </button>
  );
}
