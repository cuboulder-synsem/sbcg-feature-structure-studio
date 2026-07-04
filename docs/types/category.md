# category

## Parent type

object.

## Description

Complex category with selection, external argument, and lexical identifier information.

## Licensed features

| Feature | Expected value |
| --- | --- |
| SELECT | sign-or-none |
| XARG | sign-or-none |
| LID | list(frame) |

## Example JSON

```json
{
  "type": "category",
  "features": [
    { "name": "LID", "value": { "kind": "list", "items": [] } }
  ]
}
```

## Notes

Subtypes such as `verb` and `noun` inherit these category features.
