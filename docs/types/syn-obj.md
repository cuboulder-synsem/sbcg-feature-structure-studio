# syn-obj

## Parent type

object.

## Description

Syntax object containing category, valence, and marking information.

## Licensed features

| Feature | Expected value |
| --- | --- |
| CAT | category |
| VAL | list(expression) |
| MRKG | mark |

## Example JSON

```json
{
  "type": "syn-obj",
  "features": [
    { "name": "CAT", "value": { "kind": "feature-structure", "structure": { "type": "category", "features": [] } } }
  ]
}
```

## Notes

Selecting `CAT` automatically creates a typed `category` value.
