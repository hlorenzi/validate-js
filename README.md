# validate

Performs validation and normalization on JavaScript objects,
through schemata also defined as JavaScript objects,
using a MongoDB-query-like structure.

Install with: `npm install @hlorenzi/validate`

There's a battery of tests at `npm test`,
and test coverage checks at `npm run test-coverage`.

## Example

```js
import { Validator } from "@hlorenzi/validate"

const schema =
{
    name:   { $type: "string", $maxLen: 30 },
    age:    { $type: "int", $min: 0 },
    height: { $type: "float" },
    
    address:
    {
        number: { $type: "int" },
        street: { $type: "string" }
    },
    
    info: { $optional: true, $type: "string" }
}

const object =
{
    name: "Bob",
    age: 25,
    height: 1.79,
    address:
    {
        number: 10,
        street: "One Street"
    }
}

const normalizedObject = Validator.validateOrThrow(schema, object)
```

## Validator API

```js
Validator.validateOrThrow(schema, object, options = {})
Validator.validateOrNull(schema, object, options = {})
```

These are the main entry points for validation. They all return
a normalized object containing only the relevant fields:

- `undefined` or `null` values, where accepted, are removed from the object.
- By using `{ discardUnknownFields: true }` for `options`,
extraneous fields not defined in the schema will also be simply removed,
instead of being considered an error.

## Schema Structure

```js
{
    field1: { $type: "..." },
    field2: { $type: "..." },
    field3:
    {
        nestedField1: { $type: "..." },
        nestedField2: { $type: "..." },
    }
}
```

Fields not starting with a `$` are treated as being expected
to exist in the object under validation.

The fields on the object have their values validated
by using the directives contained in the schema's corresponding
fields, such as the `{ $type: "..." }` declarations above.

A basic directive can only specify the type, as in
`{ $type: "string" }`, but depending on the type, they can also
have extra constraints. These are independent from one another,
so you can specify only the ones that are relevant:

```js
{ $type: "string",
    $minLen: 0,
    $maxLen: 30,
    $in: [ "apple", "orange", "banana" ] }
    
{ $type: "int",
    $min: 0,
    $max: 10,
    $minExclusive: 0,
    $maxExclusive: 10 }
    
{ $type: "float",
    $min: 0,
    $max: 10,
    $minExclusive: 0,
    $maxExclusive: 10,
    $acceptInfinity: true,
    $acceptNaN: true }
    
{ $type: "bool" }

{ $type: "array", $of: { /* nested directive */ },
    $minLen: 1,
    $maxLen: 5 }
```

Fields can also be declared with the `$optional` directive,
in which case the validator will accept missing, `undefined`, and `null` values.
For example:

```js
{
    field1: { $type: "string", $optional: true }
}
```

For multiple possible types, you can use the `$either` directive:

```js
{
    field1:
    {
        $either:
        [
            { $type: "string", $maxLen: 30 },
            { $type: "float", $max: 10 },
            { $type: "float", $min: 20 }
        ]
    }
}
```

Multiple errors can be detected in a single validation pass, and the
validation functions will provide an array of errors upon unsuccessful
validation.

- `validateOrThrow(schema, object, options = {})` will return the normalized
object or throw the array of errors.
- `validateOrNull(schema, object, options = {})` will return the normalized
object or return `null` on error, never throwing.

When the validation throws, you can check whether the error is coming from
an actual validation error against the schema, as opposed to some other unexpected
exception, by using:

- `isValidatorErrorArray(err)` will return `true` if the given exception is an array of
validation errors.

Each object in the array of validation errors contains two fields:

- `path` is a string describing the name of the field that is invalid,
possibly using dot syntax for nested fields, such as `"address.street"`.
- `failure` is a string describing the internal reason for the field's value
being rejected.