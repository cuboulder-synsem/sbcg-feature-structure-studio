# context-obj

## Parent type

object.

## Description

Context object for discourse indices and background propositions.

## Licensed features

| Feature | Expected value |
| --- | --- |
| C-INDS | contextual-index |
| BCKGRND | list(proposition) |

## Example JSON

```json
{
  "type": "context-obj",
  "features": [
    { "name": "C-INDS", "value": { "kind": "feature-structure", "structure": { "type": "contextual-index", "features": [] } } }
  ]
}
```

## Notes

The canonical context feature on signs is spelled `CNTXT`.
