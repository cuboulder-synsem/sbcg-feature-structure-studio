# valence

## Parent type

object.

## Description

Valence object containing specifier/subject and complement requirements.

## Licensed features

| Feature | Expected value |
| --- | --- |
| SPR | list(expression) |
| SUBJ | list(expression) |
| COMPS | list(expression) |

## Example JSON

```json
{
  "type": "valence",
  "features": [
    { "name": "SUBJ", "value": { "kind": "list", "items": [] } },
    { "name": "COMPS", "value": { "kind": "list", "items": [] } }
  ]
}
```

## Notes

This type supports the paper-style `VAL` bracket with valence-list features inside it.
