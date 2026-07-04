# naming-frame

## Parent type

frame.

## Description

Background naming frame used for proper-name information.

## Licensed features

| Feature | Expected value |
| --- | --- |
| ENTITY | index |
| NAME | morph-obj |

## Example JSON

```json
{
  "type": "naming-frame",
  "features": [
    { "name": "ENTITY", "value": { "kind": "atomic", "value": "" } },
    { "name": "NAME", "value": { "kind": "list", "items": [] } }
  ]
}
```

## Notes

This type inherits `LABEL` from `frame`.
