# hitting-frame

## Parent type

frame.

## Description

Local example semantic frame for the verb `hit`.

## Licensed features

| Feature | Expected value |
| --- | --- |
| LABEL | label |
| HITTER | index |
| HITTEE | index |

## Example JSON

```json
{
  "type": "hitting-frame",
  "features": [
    { "name": "LABEL", "value": { "kind": "atomic", "value": "hitting-rel" } },
    { "name": "HITTER", "value": { "kind": "index-ref", "indexId": "i" } },
    { "name": "HITTEE", "value": { "kind": "index-ref", "indexId": "j" } }
  ]
}
```

## Notes

The frame roles carry the semantic participant labels. ARG-ST arguments can remain bare syntactic values such as `NP` and share the same indices.
