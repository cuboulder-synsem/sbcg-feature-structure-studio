import basicSign from "../../templates/basic-sign.json";
import hitHittingFrame from "../../templates/hit-hitting-frame.json";
import lexeme from "../../templates/lexeme.json";
import passiveWord from "../../templates/passive-word.json";
import transitiveVerbWord from "../../templates/transitive-verb-word.json";
import verbLexeme from "../../templates/verb-lexeme.json";
import word from "../../templates/word.json";
import type { FeatureStructure } from "../core/model";

export interface TemplateDefinition {
  id: string;
  name: string;
  structure: FeatureStructure;
}

export const templates: TemplateDefinition[] = [
  { id: "basic-sign", name: "basic-sign", structure: basicSign as FeatureStructure },
  { id: "word", name: "word", structure: word as FeatureStructure },
  { id: "lexeme", name: "lexeme", structure: lexeme as FeatureStructure },
  { id: "verb-lexeme", name: "verb-lexeme", structure: verbLexeme as FeatureStructure },
  {
    id: "transitive-verb-word",
    name: "transitive-verb-word",
    structure: transitiveVerbWord as FeatureStructure
  },
  { id: "passive-word", name: "passive-word", structure: passiveWord as FeatureStructure }
];

export const examples: TemplateDefinition[] = [
  {
    id: "hit-hitting-frame",
    name: "hit-hitting-frame",
    structure: hitHittingFrame as FeatureStructure
  }
];
