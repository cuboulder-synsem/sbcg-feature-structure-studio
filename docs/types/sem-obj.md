# sem-obj

## Parent type

object.

## Description

Semantic object for indices, labels, and frame contributions.

## Licensed features

| Feature | Expected value |
| --- | --- |
| INDEX | index |
| LTOP | label |
| FRAMES | list(frame) |

## Example JSON

```json
{
  "type": "sem-obj",
  "features": [
    { "name": "FRAMES", "value": { "kind": "list", "items": [] } }
  ]
}
```

## Notes

Frame participant indexing can later be linked to `ARG-ST`.
