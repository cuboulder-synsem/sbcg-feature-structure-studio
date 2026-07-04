# construct

## Parent type

object.

## Description

Local tree licensed by a combinatoric construction.

## Licensed features

| Feature | Expected value |
| --- | --- |
| MTR | sign |
| DTRS | nelist(sign) |
| CXT-CONTENT | list(frame) |

## Example JSON

```json
{
  "type": "construct",
  "features": [
    { "name": "MTR", "value": { "kind": "feature-structure", "structure": { "type": "sign", "features": [] } } }
  ]
}
```

## Notes

Constructional content is kept separate from the mother sign.
