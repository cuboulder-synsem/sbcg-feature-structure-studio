# contextual-index

## Parent type

object.

## Description

Bundle of contextual discourse indices.

## Licensed features

| Feature | Expected value |
| --- | --- |
| SPKR | index |
| ADDR | index |
| UTT-LOC | index |

## Example JSON

```json
{
  "type": "contextual-index",
  "features": [
    { "name": "SPKR", "value": { "kind": "atomic", "value": "" } }
  ]
}
```

## Notes

These are atomic index values rather than nested feature structures.
