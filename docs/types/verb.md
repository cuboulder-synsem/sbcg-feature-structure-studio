# verb

## Parent type

verbal.

## Description

Verb category subtype.

## Licensed features

| Feature | Expected value |
| --- | --- |
| AUX | boolean |
| INV | boolean |

## Example JSON

```json
{
  "type": "verb",
  "features": [
    { "name": "VF", "value": { "kind": "atomic", "value": "fin" } },
    { "name": "AUX", "value": { "kind": "atomic", "value": "-" } }
  ]
}
```

## Notes

The editor obtains inherited category and verbal features from the type registry.
