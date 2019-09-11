import { Validator, ValidatorError } from "./index.js"
import assert from "assert"


function test(schema, obj, options, expected)
{
	const resultOrNull = Validator.validateOrNull(schema, obj, options)
	
	try
	{
		const result = Validator.validateOrThrow(schema, obj, options)
		
		if (typeof result.x === "number" && isNaN(result.x) &&
			typeof expected.x === "number" && isNaN(expected.x))
			return
		
		assert.deepEqual(result, resultOrNull)
		assert.deepEqual(result, expected)
	}
	catch (e)
	{
		if (Validator.isValidatorErrorArray(e))
		{
			assert.deepEqual(resultOrNull, null)
			
			e.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
			assert.deepEqual(e, expected)
		}
		else
			throw e
	}
}


{
	const schema = { x: { $type: "<error>" } }
	assert.throws(() => Validator.validateOrThrow(schema, { x: 0 }))
	assert.throws(() => Validator.validateOrNull(schema, { x: 0 }))
}


{
	const schema = { x: { $either: [] } }
	assert.throws(() => Validator.validateOrThrow(schema, { x: 0 }))
	assert.throws(() => Validator.validateOrNull(schema, { x: 0 }))
}


{
	const schema = {}
	test(schema, {}, null, {})
	test(schema, { x: 0 }, { discardUnknownFields: true }, {})
	test(schema, { x: 0 }, null, [new ValidatorError("x", "unexpected field")])
	test(schema, { x: 0, y: 0 }, null, [new ValidatorError("x", "unexpected field"), new ValidatorError("y", "unexpected field")])
	test(schema, { y: 0, x: 0 }, null, [new ValidatorError("x", "unexpected field"), new ValidatorError("y", "unexpected field")])
}


{
	const schema = { name: { $type: "string" } }
	
	test(schema, {}, null, [new ValidatorError("name", "missing field")])
	test(schema, { name: undefined }, null, [new ValidatorError("name", "missing field")])
	
	test(schema, { name: "Bob" }, null, { name: "Bob" })
	
	test(schema, { name: null }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: 0 }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: true }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: [] }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: ["Bob"] }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: {} }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: new String("Bob") }, null, [new ValidatorError("name", "not a string")])
	
	test(schema, { name: "Bob", x: 0 }, { discardUnknownFields: true }, { name: "Bob" })
	test(schema, { name: "Bob", x: 0 }, null, [new ValidatorError("x", "unexpected field")])
}


{
	const schema = { name: { $type: "string", $optional: true } }
	
	test(schema, {}, null, {})
	test(schema, { name: undefined }, null, {})
	
	test(schema, { name: "Bob" }, null, { name: "Bob" })
	test(schema, { name: null }, null, {})
	
	test(schema, { name: 0 }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: true }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: [] }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: ["Bob"] }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: {} }, null, [new ValidatorError("name", "not a string")])
	test(schema, { name: new String("Bob") }, null, [new ValidatorError("name", "not a string")])
	
	test(schema, { name: "Bob", x: 0 }, { discardUnknownFields: true }, { name: "Bob" })
	test(schema, { name: null, x: 0 }, { discardUnknownFields: true }, {})
	test(schema, { name: "Bob", x: 0 }, null, [new ValidatorError("x", "unexpected field")])
}


{
	const schema = { name: { $type: "string", $minLen: 2, $maxLen: 5 } }
	
	test(schema, { name: "Bob" }, null, { name: "Bob" })
	
	test(schema, { name: "B" }, null, [new ValidatorError("name", "string too short")])
	test(schema, { name: "Robert" }, null, [new ValidatorError("name", "string too long")])
	
	test(schema, { name: "\u{30b1}" }, null, [new ValidatorError("name", "string too short")])
	test(schema, { name: "\u{1f603}" }, null, { name: "\u{1f603}" })
	test(schema, { name: "Bob\u{1f603}" }, null, { name: "Bob\u{1f603}" })
	test(schema, { name: "Bob-\u{1f603}" }, null, [new ValidatorError("name", "string too long")])
	test(schema, { name: "Bob-\u{30b1}" }, null, { name: "Bob-\u{30b1}" })
	
	test(schema, { name: null }, null, [new ValidatorError("name", "not a string")])
}


{
	const schema = { name: { $type: "string", $in: ["Bob", "Robert", "\u{e1}"] } }
	
	test(schema, { name: "Bob" }, null, { name: "Bob" })
	test(schema, { name: "Robert" }, null, { name: "Robert" })
	
	test(schema, { name: "B" }, null, [new ValidatorError("name", "string not in valid set")])
	test(schema, { name: "Roberto" }, null, [new ValidatorError("name", "string not in valid set")])
	
	test(schema, { name: "\u{e1}" }, null, { name: "\u{e1}" })
	test(schema, { name: "\u{61}\u{301}" }, null, [new ValidatorError("name", "string not in valid set")])
	
	test(schema, { name: null }, null, [new ValidatorError("name", "not a string")])
}


{
	const schema = { x: { $type: "int" } }
	
	test(schema, {}, null, [new ValidatorError("x", "missing field")])
	test(schema, { x: undefined }, null, [new ValidatorError("x", "missing field")])
	
	test(schema, { x: 0 }, null, { x: 0 })
	test(schema, { x: -0 }, null, { x: -0 })
	test(schema, { x: 1 }, null, { x: 1 })
	test(schema, { x: -1 }, null, { x: -1 })
	
	test(schema, { x: null }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: 1.5 }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: -1.5 }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: Infinity }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: -Infinity }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: NaN }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: false }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: true }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: "0" }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: [] }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: [0] }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: {} }, null, [new ValidatorError("x", "not an integer")])
	test(schema, { x: new Number(0) }, null, [new ValidatorError("x", "not an integer")])
	
	test(schema, { x: 0, y: 0 }, { discardUnknownFields: true }, { x: 0 })
	test(schema, { x: 0, y: 0 }, null, [new ValidatorError("y", "unexpected field")])
	test(schema, { x: NaN, y: 0 }, null, [new ValidatorError("x", "not an integer"), new ValidatorError("y", "unexpected field")])
}


{
	const schema = { x: { $type: "int", $optional: true } }
	
	test(schema, { x: 0 }, null, { x: 0 })
	
	test(schema, {}, null, {})
	test(schema, { x: null }, null, {})
	test(schema, { x: undefined }, null, {})
}


{
	const schema = { x: { $type: "int", $min: 5, $max: 10 } }
	
	test(schema, { x: 5 }, null, { x: 5 })
	test(schema, { x: 7 }, null, { x: 7 })
	test(schema, { x: 10 }, null, { x: 10 })
	
	test(schema, { x: 4 }, null, [new ValidatorError("x", "integer too small")])
	test(schema, { x: 11 }, null, [new ValidatorError("x", "integer too big")])
}


{
	const schema = { x: { $type: "int", $minExclusive: 5, $maxExclusive: 10 } }
	
	test(schema, { x: 6 }, null, { x: 6 })
	test(schema, { x: 7 }, null, { x: 7 })
	test(schema, { x: 9 }, null, { x: 9 })
	
	test(schema, { x: 4 }, null, [new ValidatorError("x", "integer too small")])
	test(schema, { x: 5 }, null, [new ValidatorError("x", "integer too small")])
	test(schema, { x: 10 }, null, [new ValidatorError("x", "integer too big")])
	test(schema, { x: 11 }, null, [new ValidatorError("x", "integer too big")])
}


{
	const schema = { x: { $type: "float" } }
	
	test(schema, {}, null, [new ValidatorError("x", "missing field")])
	test(schema, { x: undefined }, null, [new ValidatorError("x", "missing field")])
	
	test(schema, { x: 0 }, null, { x: 0 })
	test(schema, { x: -0 }, null, { x: -0 })
	test(schema, { x: 1 }, null, { x: 1 })
	test(schema, { x: -1 }, null, { x: -1 })
	test(schema, { x: 1.5 }, null, { x: 1.5 })
	test(schema, { x: -1.5 }, null, { x: -1.5 })
	
	test(schema, { x: null }, null, [new ValidatorError("x", "not a float")])
	test(schema, { x: Infinity }, null, [new ValidatorError("x", "not a finite float")])
	test(schema, { x: -Infinity }, null, [new ValidatorError("x", "not a finite float")])
	test(schema, { x: NaN }, null, [new ValidatorError("x", "not a numeric float")])
	test(schema, { x: false }, null, [new ValidatorError("x", "not a float")])
	test(schema, { x: true }, null, [new ValidatorError("x", "not a float")])
	test(schema, { x: "0" }, null, [new ValidatorError("x", "not a float")])
	test(schema, { x: [] }, null, [new ValidatorError("x", "not a float")])
	test(schema, { x: [0] }, null, [new ValidatorError("x", "not a float")])
	test(schema, { x: {} }, null, [new ValidatorError("x", "not a float")])
	test(schema, { x: new Number(0) }, null, [new ValidatorError("x", "not a float")])
	
	test(schema, { x: 0, y: 0 }, { discardUnknownFields: true }, { x: 0 })
	test(schema, { x: 0, y: 0 }, null, [new ValidatorError("y", "unexpected field")])
	test(schema, { x: NaN, y: 0 }, null, [new ValidatorError("x", "not a numeric float"), new ValidatorError("y", "unexpected field")])
}


{
	const schema = { x: { $type: "float", $optional: true } }
	
	test(schema, { x: 0 }, null, { x: 0 })
	
	test(schema, {}, null, {})
	test(schema, { x: null }, null, {})
	test(schema, { x: undefined }, null, {})
}


{
	const schema = { x: { $type: "float", $min: 5, $max: 10 } }
	
	test(schema, { x: 5 }, null, { x: 5 })
	test(schema, { x: 7 }, null, { x: 7 })
	test(schema, { x: 10 }, null, { x: 10 })
	
	test(schema, { x: 4 }, null, [new ValidatorError("x", "float too small")])
	test(schema, { x: 11 }, null, [new ValidatorError("x", "float too big")])
}


{
	const schema = { x: { $type: "float", $minExclusive: 5, $maxExclusive: 10 } }
	
	test(schema, { x: 5.000001 }, null, { x: 5.000001 })
	test(schema, { x: 6 }, null, { x: 6 })
	test(schema, { x: 7 }, null, { x: 7 })
	test(schema, { x: 9 }, null, { x: 9 })
	test(schema, { x: 9.999999 }, null, { x: 9.999999 })
	
	test(schema, { x: 4 }, null, [new ValidatorError("x", "float too small")])
	test(schema, { x: 5 }, null, [new ValidatorError("x", "float too small")])
	test(schema, { x: 10 }, null, [new ValidatorError("x", "float too big")])
	test(schema, { x: 11 }, null, [new ValidatorError("x", "float too big")])
}


{
	const schema = { x: { $type: "float", $acceptNaN: true, $min: 5, $max: 10 } }
	
	test(schema, { x: 5 }, null, { x: 5 })
	test(schema, { x: NaN }, null, { x: NaN })
	
	test(schema, { x: 4 }, null, [new ValidatorError("x", "float too small")])
	test(schema, { x: 11 }, null, [new ValidatorError("x", "float too big")])
	test(schema, { x: Infinity }, null, [new ValidatorError("x", "not a finite float")])
}


{
	const schema = { x: { $type: "float", $acceptInfinity: true } }
	
	test(schema, { x: 5 }, null, { x: 5 })
	test(schema, { x: Infinity }, null, { x: Infinity })
	test(schema, { x: -Infinity }, null, { x: -Infinity })
	
	test(schema, { x: NaN }, null, [new ValidatorError("x", "not a numeric float")])
}


{
	const schema = { x: { $type: "float", $acceptInfinity: true, $min: 5 } }
	
	test(schema, { x: 5 }, null, { x: 5 })
	test(schema, { x: Infinity }, null, { x: Infinity })
	
	test(schema, { x: -Infinity }, null, [new ValidatorError("x", "float too small")])
	test(schema, { x: NaN }, null, [new ValidatorError("x", "not a numeric float")])
}


{
	const schema = { x: { $type: "bool" } }
	
	test(schema, {}, null, [new ValidatorError("x", "missing field")])
	test(schema, { x: undefined }, null, [new ValidatorError("x", "missing field")])
	
	test(schema, { x: false }, null, { x: false })
	test(schema, { x: true }, null, { x: true })
	
	test(schema, { x: null }, null, [new ValidatorError("x", "not a boolean")])
	test(schema, { x: 0 }, null, [new ValidatorError("x", "not a boolean")])
	test(schema, { x: 1 }, null, [new ValidatorError("x", "not a boolean")])
	test(schema, { x: "0" }, null, [new ValidatorError("x", "not a boolean")])
	test(schema, { x: [] }, null, [new ValidatorError("x", "not a boolean")])
	test(schema, { x: [false] }, null, [new ValidatorError("x", "not a boolean")])
	test(schema, { x: {} }, null, [new ValidatorError("x", "not a boolean")])
	test(schema, { x: new Boolean(false) }, null, [new ValidatorError("x", "not a boolean")])
	
	test(schema, { x: true, y: 0 }, { discardUnknownFields: true }, { x: true })
	test(schema, { x: true, y: 0 }, null, [new ValidatorError("y", "unexpected field")])
}


{
	const schema = { arr: { $type: "array", $of: { $type: "int" } } }
	
	test(schema, {}, null, [new ValidatorError("arr", "missing field")])
	test(schema, { arr: undefined }, null, [new ValidatorError("arr", "missing field")])
	
	test(schema, { arr: [] }, null, { arr: [] })
	test(schema, { arr: [0] }, null, { arr: [0] })
	test(schema, { arr: [0, 1, 2] }, null, { arr: [0, 1, 2] })
	test(schema, { arr: new Array(0) }, null, { arr: [] })
	test(schema, { arr: new Array(3).fill(0) }, null, { arr: [0, 0, 0] })
	
	test(schema, { arr: [null] }, null, [new ValidatorError("arr[0]", "not an integer")])
	test(schema, { arr: [true] }, null, [new ValidatorError("arr[0]", "not an integer")])
	test(schema, { arr: [0.5] }, null, [new ValidatorError("arr[0]", "not an integer")])
	test(schema, { arr: ["0"] }, null, [new ValidatorError("arr[0]", "not an integer")])
	test(schema, { arr: [[]] }, null, [new ValidatorError("arr[0]", "not an integer")])
	test(schema, { arr: [[0]] }, null, [new ValidatorError("arr[0]", "not an integer")])
	test(schema, { arr: [{}] }, null, [new ValidatorError("arr[0]", "not an integer")])
	test(schema, { arr: [0, 1.5, 2] }, null, [new ValidatorError("arr[1]", "not an integer")])
	
	test(schema, { arr: new Array(2) }, null, [new ValidatorError("arr[0]", "missing field"), new ValidatorError("arr[1]", "missing field")])
	
	test(schema, { arr: null }, null, [new ValidatorError("arr", "not an array")])
	test(schema, { arr: 0 }, null, [new ValidatorError("arr", "not an array")])
	test(schema, { arr: 1 }, null, [new ValidatorError("arr", "not an array")])
	test(schema, { arr: "[]" }, null, [new ValidatorError("arr", "not an array")])
	test(schema, { arr: {} }, null, [new ValidatorError("arr", "not an array")])
	
	test(schema, { arr: [], y: 0 }, { discardUnknownFields: true }, { arr: [] })
	test(schema, { arr: [], y: 0 }, null, [new ValidatorError("y", "unexpected field")])
}


{
	const schema = { arr: { $type: "array", $of: { $type: "int" }, $minLen: 2, $maxLen: 3 } }
	
	test(schema, { arr: [0, 1] }, null, { arr: [0, 1] })
	test(schema, { arr: [0, 1, 2] }, null, { arr: [0, 1, 2] })
	
	test(schema, { arr: [] }, null, [new ValidatorError("arr", "array too short")])
	test(schema, { arr: [0] }, null, [new ValidatorError("arr", "array too short")])
	test(schema, { arr: [0, 1, 2, 3] }, null, [new ValidatorError("arr", "array too long")])
}


{
	const schema = { arr: { $optional: true, $type: "array", $of: { $type: "int", $min: 0, $max: 10 }, $minLen: 2, $maxLen: 3 } }
	const options = { discardUnknownFields: true }
	
	test(schema, { arr: [0, 1] }, options, { arr: [0, 1] })
	test(schema, { arr: [0, 1, 2] }, options, { arr: [0, 1, 2] })
	
	test(schema, { arr: [null, 1, 2] }, options, [new ValidatorError("arr[0]", "not an integer")])
	test(schema, { arr: [0, "1", 2] }, options, [new ValidatorError("arr[1]", "not an integer")])
	test(schema, { arr: [0, 1, 15] }, options, [new ValidatorError("arr[2]", "integer too big")])
	test(schema, { arr: [0, 1, -5] }, options, [new ValidatorError("arr[2]", "integer too small")])
	
	test(schema, { arr: [] }, options, [new ValidatorError("arr", "array too short")])
	test(schema, { arr: [0] }, options, [new ValidatorError("arr", "array too short")])
	test(schema, { arr: [0, 1, 2, 3] }, options, [new ValidatorError("arr", "array too long")])
	test(schema, { arr: [0, 1, 2, "3"] }, options, [new ValidatorError("arr", "array too long")])
}


{
	const schema = { address: { street: { $type: "string", $minLen: 5 }, number: { $type: "int" }, info: { $type: "string", $optional: true } } }
	
	test(schema, { address: { street: "One Street", number: 142 } }, null, { address: { street: "One Street", number: 142 } })
	test(schema, { address: { street: "One Street", number: 142, info: null } }, null, { address: { street: "One Street", number: 142 } })
	test(schema, { address: { street: "One Street", number: 142, info: "Near Two Street" } }, null, { address: { street: "One Street", number: 142, info: "Near Two Street" } })
	test(schema, { address: { street: "One Street", number: 142, city: "Townsville" } }, { discardUnknownFields: true }, { address: { street: "One Street", number: 142 } })
	
	test(schema, { address: { street: "One Street", info: "Near Two Street" } }, null, [new ValidatorError("address.number", "missing field")])
	test(schema, { address: { street: "One Street", number: null } }, null, [new ValidatorError("address.number", "not an integer")])
	test(schema, { address: { street: "One", number: 142 } }, null, [new ValidatorError("address.street", "string too short")])
	
	test(schema, { location: { street: "One Street", number: 142 } }, null, [new ValidatorError("address", "missing field"), new ValidatorError("location", "unexpected field")])
	test(schema, { address: { street: "One Street", number: 142, neighborhood: "Niceville" } }, null, [new ValidatorError("address.neighborhood", "unexpected field")])
}


{
	const schema = { extraInfo: { $optional: true, message: { $type: "string", $minLen: 5 } } }
	
	test(schema, {}, null, {})
	test(schema, { extraInfo: null }, null, {})
	test(schema, { extraInfo: undefined }, null, {})
	test(schema, { extraInfo: { message: "Without onion." } }, null, { extraInfo: { message: "Without onion." } })
	
	test(schema, { extraInfo: 0 }, null, [new ValidatorError("extraInfo", "not an object")])
	test(schema, { extraInfo: [] }, null, [new ValidatorError("extraInfo", "not an object")])
	test(schema, { extraInfo: "" }, null, [new ValidatorError("extraInfo", "not an object")])
	test(schema, { extraInfo: true }, null, [new ValidatorError("extraInfo", "not an object")])
	
	test(schema, { extraInfo: {} }, null, [new ValidatorError("extraInfo.message", "missing field")])
	test(schema, { extraInfo: new Date() }, null, [new ValidatorError("extraInfo.message", "missing field")])
	test(schema, { extraInfo: new Object() }, null, [new ValidatorError("extraInfo.message", "missing field")])
	test(schema, { extraInfo: { message: undefined } }, null, [new ValidatorError("extraInfo.message", "missing field")])
	
	test(schema, { extraInfo: { message: null } }, null, [new ValidatorError("extraInfo.message", "not a string")])
	test(schema, { extraInfo: { message: "No." } }, null, [new ValidatorError("extraInfo.message", "string too short")])
	test(schema, { extraInfo: { $optional: true, message: "Without onion." } }, null, [new ValidatorError("extraInfo.$optional", "unexpected field")])
}


{
	const schema = { or: { $either: [{ $type: "string", $minLen: 2 }, { $type: "int", $min: 2 }, { $type: "float", $min: 5 }] } }
	
	test(schema, { or: "Test" }, null, { or: "Test" })
	test(schema, { or: 5 }, null, { or: 5 })
	test(schema, { or: 5.5 }, null, { or: 5.5 })
	test(schema, { or: 2 }, null, { or: 2 })
	
	test(schema, { or: null }, null, [new ValidatorError("or", "value not in valid set")])
	test(schema, { or: true }, null, [new ValidatorError("or", "value not in valid set")])
	test(schema, { or: "5" }, null, [new ValidatorError("or", "value not in valid set")])
	test(schema, { or: 0 }, null, [new ValidatorError("or", "value not in valid set")])
	test(schema, { or: 2.5 }, null, [new ValidatorError("or", "value not in valid set")])
}


console.log("tests passed")