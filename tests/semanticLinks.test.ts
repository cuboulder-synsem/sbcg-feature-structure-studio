import { describe, expect, it } from "vitest";
import {
  createFeatureEntry,
  createFeatureStructure,
  createListValue,
  createNestedFeatureStructureValue,
  createTypeValue
} from "../src/core/model";
import {
  getArgStItems,
  getFrameParticipantLinks,
  getNextIndexId,
  linkFrameParticipantToArgSt
} from "../src/core/semanticLinks";
import { exportLangSciAvm } from "../src/core/exportLangSciAvm";

describe("semantic frame participant links", () => {
  it("maps a frame participant index onto an ARG-ST item", () => {
    const actor = createFeatureEntry("ACTOR", { kind: "underspecified" });
    const structure = createFeatureStructure("word", [
      createFeatureEntry("ARG-ST", createListValue([createTypeValue("NP"), createTypeValue("NP")])),
      createFeatureEntry(
        "SEM",
        createNestedFeatureStructureValue(
          createFeatureStructure("sem-obj", [
            createFeatureEntry(
              "FRAMES",
              createListValue([
                createNestedFeatureStructureValue(
                  createFeatureStructure("loving-fr", [
                    createFeatureEntry("LABEL", createTypeValue("l1")),
                    actor,
                    createFeatureEntry("SIT", createTypeValue("s1"))
                  ])
                )
              ])
            )
          ])
        )
      )
    ]);

    expect(getFrameParticipantLinks(structure)).toEqual([
      {
        frameIndex: 0,
        frameType: "loving-fr",
        featureId: actor.id,
        role: "ACTOR",
        indexId: undefined
      }
    ]);

    expect(getNextIndexId(structure)).toBe("i");

    const linked = linkFrameParticipantToArgSt(structure, actor.id, 0, "i");
    const linkedParticipants = getFrameParticipantLinks(linked);
    const argStItems = getArgStItems(linked);

    expect(linkedParticipants[0].indexId).toBe("i");
    expect(argStItems[0].indexId).toBe("i");
    expect(argStItems[1].indexId).toBeUndefined();
    expect(exportLangSciAvm(linked)).toContain("ACTOR & \\ind{i}");
    expect(exportLangSciAvm(linked)).toContain("ARG-ST & < NP\\ind{i}, NP >");
  });
});
