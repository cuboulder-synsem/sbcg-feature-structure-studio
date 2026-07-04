import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeatureStructureEditor } from "../src/components/FeatureStructureEditor";
import { collectIndexIds, createFeatureStructure } from "../src/core/model";
import {
  createFeatureEntryFromSpec,
  getFeatureSpecForType,
  getMissingFeatureSuggestions,
  typeRegistry
} from "../src/core/sbcgProfile";
import { examples } from "../src/templates";

describe("FeatureStructureEditor type-driven controls", () => {
  it("uses the type registry to offer only licensed features for a typed object", () => {
    const markup = renderToStaticMarkup(
      <FeatureStructureEditor
        structure={createFeatureStructure("verb")}
        onChange={() => undefined}
        availableIndexes={[]}
        onSelectIndex={() => undefined}
      />
    );

    expect(markup).toContain("Add licensed feature");
    expect(markup).toContain("VF");
    expect(markup).toContain("AUX");
    expect(markup).not.toContain("Add feature");
    expect(markup).not.toContain("Infer SBCG");
  });

  it("does not render a manual Infer SBCG button", () => {
    const markup = renderToStaticMarkup(
      <FeatureStructureEditor
        structure={createFeatureStructure("sign")}
        onChange={() => undefined}
        availableIndexes={[]}
        onSelectIndex={() => undefined}
      />
    );

    expect(markup).not.toContain("Infer SBCG");
    expect(markup).not.toContain("Infer appropriate SBCG features");
  });

  it("offers every missing licensed feature for every registered typed object", () => {
    Object.keys(typeRegistry).forEach((typeName) => {
      const structure = createFeatureStructure(typeName);
      const expectedFeatures = getMissingFeatureSuggestions(structure).map(
        (suggestion) => suggestion.name
      );
      const markup = renderToStaticMarkup(
        <FeatureStructureEditor
          structure={structure}
          onChange={() => undefined}
          availableIndexes={[]}
          onSelectIndex={() => undefined}
        />
      );

      if (expectedFeatures.length === 0) {
        expect(markup, typeName).toContain("All features added");
        return;
      }

      expect(markup, typeName).toContain("Add licensed feature");
      expectedFeatures.forEach((featureName) => {
        expect(markup, `${typeName}.${featureName}`).toContain(featureName);
      });
    });
  });

  it("renders atomic enumerations from the registry as value dropdowns", () => {
    const vfSpec = getFeatureSpecForType("verb", "VF");
    if (!vfSpec) {
      throw new Error("Expected VF spec");
    }
    const structure = createFeatureStructure("verb", [createFeatureEntryFromSpec(vfSpec)]);

    const markup = renderToStaticMarkup(
      <FeatureStructureEditor
        structure={structure}
        onChange={() => undefined}
        availableIndexes={[]}
        onSelectIndex={() => undefined}
      />
    );

    expect(markup).toContain('aria-label="VF value"');
    expect(markup).toContain("fin");
    expect(markup).toContain("base");
    expect(markup).toContain("ger");
  });

  it("places frame-to-ARG-ST controls inline on SEM frame participants", () => {
    const example = examples.find((candidate) => candidate.id === "hit-hitting-frame");
    if (!example) {
      throw new Error("Expected HIT example");
    }

    const structure = structuredClone(example.structure);
    const markup = renderToStaticMarkup(
      <FeatureStructureEditor
        structure={structure}
        onChange={() => undefined}
        availableIndexes={collectIndexIds(structure)}
        onSelectIndex={() => undefined}
      />
    );

    expect(markup).not.toContain("Frame links");
    expect(markup).toContain('aria-label="Map HITTER to ARG-ST"');
    expect(markup).toContain('aria-label="Map HITTEE to ARG-ST"');
    expect(markup).toContain('aria-label="Index for HITTER"');
    expect(markup).toContain('aria-label="Index for HITTEE"');
  });

  it("allows frame structures inside FRAMES lists to add open frame elements from Add Feature", () => {
    const example = examples.find((candidate) => candidate.id === "hit-hitting-frame");
    if (!example) {
      throw new Error("Expected HIT example");
    }

    const structure = structuredClone(example.structure);
    const markup = renderToStaticMarkup(
      <FeatureStructureEditor
        structure={structure}
        onChange={() => undefined}
        availableIndexes={collectIndexIds(structure)}
        onSelectIndex={() => undefined}
      />
    );

    expect(markup).toContain('value="__frame_element__"');
    expect(markup).toContain("Add frame element");
    expect(markup).not.toContain('title="Add frame element"');
  });
});
