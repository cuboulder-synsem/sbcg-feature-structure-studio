import { describe, expect, it } from "vitest";
import { examples, templates } from "../src/templates";
import type { FeatureStructure, FSValue } from "../src/core/model";
import { exportLangSciAvm } from "../src/core/exportLangSciAvm";
import { getArgStItems, getFrameParticipantLinks } from "../src/core/semanticLinks";

describe("starter templates", () => {
  it("orders the verb-lexeme template as FORM, SYN, ARG-ST, then SEM", () => {
    const template = templates.find((candidate) => candidate.id === "verb-lexeme");

    expect(template?.structure.features.map((feature) => feature.name)).toEqual([
      "FORM",
      "SYN",
      "ARG-ST",
      "SEM"
    ]);
  });

  it("stores an explicit type on every nested feature structure in templates", () => {
    [...templates, ...examples].forEach((template) => {
      expect(template.structure.type, template.name).toBeTruthy();
      expectTemplateStructureIsTyped(template.structure);
    });
  });

  it("keeps reusable templates separate from filled examples", () => {
    expect(templates.some((candidate) => candidate.id === "hit-hitting-frame")).toBe(false);
    expect(examples.some((candidate) => candidate.id === "hit-hitting-frame")).toBe(true);
  });

  it("includes a HIT example with frame-role indices linked to bare ARG-ST NPs", () => {
    const template = examples.find((candidate) => candidate.id === "hit-hitting-frame");

    expect(template).toBeDefined();
    if (!template) {
      throw new Error("Expected HIT hitting-frame example");
    }

    const argStItems = getArgStItems(template.structure);
    const participants = getFrameParticipantLinks(template.structure);
    const latex = exportLangSciAvm(template.structure);

    expect(latex).toContain("FORM & < hit >");
    expect(argStItems.map((item) => item.label)).toEqual(["NP", "NP"]);
    expect(argStItems.map((item) => item.indexId)).toEqual(["i", "j"]);
    expect(participants.map((participant) => [participant.role, participant.indexId])).toEqual([
      ["HITTER", "i"],
      ["HITTEE", "j"]
    ]);
    expect(latex).toContain("ARG-ST & < NP\\ind{i}, NP\\ind{j} >");
    expect(latex).toContain("HITTER & \\ind{i}");
    expect(latex).toContain("HITTEE & \\ind{j}");
  });
});

function expectTemplateStructureIsTyped(structure: FeatureStructure): void {
  structure.features.forEach((feature) => expectTemplateValueIsTyped(feature.value));
}

function expectTemplateValueIsTyped(value: FSValue): void {
  if (value.kind === "feature-structure") {
    expect(value.structure.type).toBeTruthy();
    expectTemplateStructureIsTyped(value.structure);
  }

  if (value.kind === "list") {
    value.items.forEach((item) => expectTemplateValueIsTyped(item));
  }
}
