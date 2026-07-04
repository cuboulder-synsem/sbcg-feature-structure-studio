# lex-sign

## Parent type

sign.

## Description

Lexical sign type that adds argument structure to the general sign geometry.

## Licensed features

| Feature | Expected value |
| --- | --- |
| ARG-ST | list(expression) |

## Example JSON

```json
{
  "type": "lex-sign",
  "features": [
    { "name": "ARG-ST", "value": { "kind": "list", "items": [] } }
  ]
}
```

## Notes

Inherited sign features are available through the registry even though only `ARG-ST` is listed here as the local feature.
