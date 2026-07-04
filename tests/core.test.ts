import { describe, expect, it } from "vitest";
import {
  assignIndexToValue,
  createAtomicValue,
  createFeatureEntry,
  createFeatureStructure,
  createIndexRefValue,
  createListValue,
  createNestedFeatureStructureValue,
  createTypeValue,
  moveFeatureById,
  moveFeatureToPosition,
  orderFeaturesCanonically,
  type IndexRegistry
} from "../src/core/model";
import { exportLangSciAvm } from "../src/core/exportLangSciAvm";
import { exportJson, importJson } from "../src/core/importExportJson";
import { createTreeNode } from "../src/core/treeModel";

describe("Feature Structure Studio core model", () => {
  it("creates a feature structure with editable feature entries", () => {
    const fs = createFeatureStructure("sign", [
      createFeatureEntry("PHON", createListValue([createAtomicValue("walks")]))
    ]);

    expect(fs.type).toBe("sign");
    expect(fs.features).toHaveLength(1);
    expect(fs.features[0].name).toBe("PHON");
  });

  it("represents nested feature structures", () => {
    const fs = createFeatureStructure("sign", [
      createFeatureEntry(
        "SYN",
        createNestedFeatureStructureValue(
          createFeatureStructure(undefined, [
            createFeatureEntry("CAT", createTypeValue("verb"))
          ])
        )
      )
    ]);

    expect(fs.features[0].value.kind).toBe("feature-structure");
  });

  it("represents list values and empty lists", () => {
    const argSt = createListValue([createTypeValue("NP"), createTypeValue("NP")]);
    const empty = createListValue([]);

    expect(argSt.items).toHaveLength(2);
    expect(empty.items).toHaveLength(0);
  });

  it("assigns and reuses an index through the registry", () => {
    const registry: IndexRegistry = {};
    const np = createTypeValue("NP");
    const indexed = assignIndexToValue(registry, "1", np);
    const ref = createIndexRefValue("1");

    expect(indexed.indexId).toBe("1");
    expect(ref.indexId).toBe("1");
    expect(registry["1"]).toEqual(indexed);
  });

  it("exports systematic langsci-avm LaTeX", () => {
    const indexedNp = assignIndexToValue({}, "1", createTypeValue("NP"));
    const fs = createFeatureStructure("sign", [
      createFeatureEntry("PHON", createListValue([createAtomicValue("walks")])),
      createFeatureEntry(
        "SYN",
        createNestedFeatureStructureValue(
          createFeatureStructure(undefined, [
            createFeatureEntry(
              "VAL",
              createNestedFeatureStructureValue(
                createFeatureStructure(undefined, [
                  createFeatureEntry("SUBJ", createListValue([indexedNp])),
                  createFeatureEntry("COMPS", createListValue([]))
                ])
              )
            )
          ])
        )
      ),
      createFeatureEntry("ARG-ST", createListValue([createIndexRefValue("1")]))
    ]);

    expect(exportLangSciAvm(fs)).toContain("\\avm{");
    expect(exportLangSciAvm(fs)).toContain("NP\\ind{1}");
    expect(exportLangSciAvm(fs)).toContain("COMPS & < >");
  });

  it("round-trips feature structures through JSON", () => {
    const fs = createFeatureStructure("lexeme", [
      createFeatureEntry("SEM", { kind: "underspecified" })
    ]);

    expect(importJson(exportJson(fs))).toEqual(fs);
  });

  it("creates a tree node with an attached AVM", () => {
    const avm = createFeatureStructure("word", [
      createFeatureEntry("SYN", createTypeValue("verb"))
    ]);
    const node = createTreeNode("VP", [createTreeNode("V", [], avm)]);

    expect(node.children[0].avm?.type).toBe("word");
  });

  it("reorders feature entries by adjacent movement and target position", () => {
    const phon = createFeatureEntry("PHON");
    const syn = createFeatureEntry("SYN");
    const sem = createFeatureEntry("SEM");
    const fs = createFeatureStructure("sign", [phon, syn, sem]);

    const movedUp = moveFeatureById(fs, sem.id, -1);
    expect(movedUp.features.map((feature) => feature.name)).toEqual(["PHON", "SEM", "SYN"]);

    const movedToFirst = moveFeatureToPosition(fs, sem.id, 1);
    expect(movedToFirst.features.map((feature) => feature.name)).toEqual([
      "SEM",
      "PHON",
      "SYN"
    ]);

    const movedPastEnd = moveFeatureToPosition(fs, phon.id, 99);
    expect(movedPastEnd.features.map((feature) => feature.name)).toEqual([
      "SYN",
      "SEM",
      "PHON"
    ]);
  });

  it("can apply the canonical major-feature order while preserving other features", () => {
    const sem = createFeatureEntry("SEM");
    const custom = createFeatureEntry("FRAME");
    const phon = createFeatureEntry("PHON");
    const argSt = createFeatureEntry("ARG-ST");
    const syn = createFeatureEntry("SYN");
    const cntxt = createFeatureEntry("CNTXT");
    const fs = createFeatureStructure("sign", [sem, custom, phon, argSt, syn, cntxt]);

    expect(orderFeaturesCanonically(fs.features).map((feature) => feature.name)).toEqual([
      "PHON",
      "SYN",
      "ARG-ST",
      "SEM",
      "CNTXT",
      "FRAME"
    ]);
  });
});
