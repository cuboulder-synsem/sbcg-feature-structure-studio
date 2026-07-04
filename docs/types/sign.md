# sign

## Parent type

object.

## Description

Sag-style sign with phonological, morphological, syntactic, semantic, and contextual information.

## Licensed features

| Feature | Expected value |
| --- | --- |
| PHON | phon-obj |
| FORM | morph-obj |
| SYN | syn-obj |
| SEM | sem-obj |
| CNTXT | context-obj |

## Example JSON

```json
{
  "type": "sign",
  "features": [
    { "name": "SYN", "value": { "kind": "feature-structure", "structure": { "type": "syn-obj", "features": [] } } }
  ]
}
```

## Notes

`sign` is the central object type for complete feature structures.
