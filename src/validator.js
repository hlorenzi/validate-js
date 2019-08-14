export class Validator
{
	static validateOrThrow(schema, obj, options = null)
	{
		const state = Validator._newState(options || {})
		const result = Validator._validateRecursive(schema, obj, state, "")
		
		if (state.errors.length != 0)
			throw state.errors
		
		return result
	}
	
	
	static validateOrNull(schema, obj, options = null)
	{
		try
		{
			return Validator.validateOrThrow(schema, obj, options)
		}
		catch (e)
		{
			if (Array.isArray(e) && e[0] instanceof ValidatorError)
				return null
			
			throw e
		}
	}
	
	
	static validateOrReturnErrors(schema, obj, options = null)
	{
		try
		{
			return Validator.validateOrThrow(schema, obj, options)
		}
		catch (e)
		{
			if (Array.isArray(e) && e[0] instanceof ValidatorError)
				return e
			
			throw e
		}
	}
	
	
	static _newState(options)
	{
		return {
			discardUnknownFields: !!options.discardUnknownFields,
			errors: []
		}
	}
	
	
	static _validateRecursive(schema, obj, state, path)
	{
		let newObj = { }
		
		if (obj === null)
		{
			if (schema.$optional)
				return undefined
		}
		
		if (obj === undefined)
		{
			if (schema.$optional)
				return undefined
			
			return Validator._onError(schema, obj, state, path, "missing field")
		}
		
		if (schema.$type || schema.$either)
		{
			const subSchemas = (schema.$either || [schema])
			const numErrorsBefore = state.errors.length
			
			let value = undefined
			for (const subSchema of subSchemas)
			{
				if (value !== undefined)
					break
				
				switch (subSchema.$type)
				{
					case "string":
						value = Validator._validateString(subSchema, obj, state, path)
						break
						
					case "int":
						value = Validator._validateInt(subSchema, obj, state, path)
						break
						
					case "float":
						value = Validator._validateFloat(subSchema, obj, state, path)
						break
						
					case "bool":
						value = Validator._validateBool(subSchema, obj, state, path)
						break
						
					case "array":
						value = Validator._validateArray(subSchema, obj, state, path)
						break
						
					default:
						throw "invalid schema"
				}
			}
			
			if (value === undefined)
			{
				if (subSchemas.length === 1)
					return undefined
				
				state.errors = state.errors.slice(0, numErrorsBefore)
				return Validator._onError(schema, obj, state, path, "value not in valid set")
			}
			
			state.errors = state.errors.slice(0, numErrorsBefore)
			return value
		}
		else
		{
			if (typeof obj !== "object" || Array.isArray(obj))
				return Validator._onError(schema, obj, state, path, "not an object")
			
			for (const key of Object.keys(schema))
			{
				if (key.charAt(0) === "$")
					continue
				
				const value = obj[key]
				const newPath = (path === "" ? "" : path + ".") + key
				
				const newValue = Validator._validateRecursive(schema[key], obj[key], state, newPath, value)
				if (newValue !== undefined)
					newObj[key] = newValue
			}
			
			if (!state.discardUnknownFields)
			{
				for (const key of Object.keys(obj))
				{
					if (schema[key] === undefined || key.charAt(0) === "$")
					{
						const newPath = (path === "" ? "" : path + ".") + key
						Validator._onError(schema, obj[key], state, newPath, "unexpected field")
					}
				}
			}
		}
		
		return newObj
	}
	
	
	static _onError(schema, obj, state, path, message)
	{
		state.errors.push(new ValidatorError(path, message))
		return undefined
	}
	
	
	static _validateString(schema, str, state, path)
	{
		if (typeof str !== "string")
			return Validator._onError(schema, str, state, path, "not a string")
		
		if (Array.isArray(schema.$in))
			if (!schema.$in.some(s => s === str))
				return Validator._onError(schema, str, state, path, "string not in valid set")
		
		if (typeof schema.$maxLen === "number")
			if (str.length > schema.$maxLen)
				return Validator._onError(schema, str, state, path, "string too long")
			
		if (typeof schema.$minLen === "number")
			if (str.length < schema.$minLen)
				return Validator._onError(schema, str, state, path, "string too short")
			
		return str
	}
	
	
	static _validateInt(schema, value, state, path)
	{
		if (typeof value !== "number" || !isFinite(value))
			return Validator._onError(schema, value, state, path, "not an integer")
		
		if (Math.floor(value) !== value)
			return Validator._onError(schema, value, state, path, "not an integer")
			
		if (typeof schema.$max === "number")
			if (value > schema.$max)
				return Validator._onError(schema, value, state, path, "integer too big")
			
		if (typeof schema.$maxExclusive === "number")
			if (value >= schema.$maxExclusive)
				return Validator._onError(schema, value, state, path, "integer too big")
			
		if (typeof schema.$min === "number")
			if (value < schema.$min)
				return Validator._onError(schema, value, state, path, "integer too small")
			
		if (typeof schema.$minExclusive === "number")
			if (value <= schema.$minExclusive)
				return Validator._onError(schema, value, state, path, "integer too small")
			
		return value
	}
	
	
	static _validateFloat(schema, value, state, path)
	{
		if (typeof value !== "number")
			return Validator._onError(schema, value, state, path, "not a float")
		
		if (!isFinite(value))
		{
			if (isNaN(value))
			{
				if (!schema.$acceptNaN)
					return Validator._onError(schema, value, state, path, "not a numeric float")
			}
			
			else if (!schema.$acceptInfinity)
				return Validator._onError(schema, value, state, path, "not a finite float")
		}
		
		if (!isNaN(value))
		{
			if (typeof schema.$max === "number")
				if (value > schema.$max)
					return Validator._onError(schema, value, state, path, "float too big")
				
			if (typeof schema.$maxExclusive === "number")
				if (value >= schema.$maxExclusive)
					return Validator._onError(schema, value, state, path, "float too big")
				
			if (typeof schema.$min === "number")
				if (value < schema.$min)
					return Validator._onError(schema, value, state, path, "float too small")
				
			if (typeof schema.$minExclusive === "number")
				if (value <= schema.$minExclusive)
					return Validator._onError(schema, value, state, path, "float too small")
		}
		
		return value
	}
	
	
	static _validateBool(schema, value, state, path)
	{
		if (typeof value !== "boolean")
			return Validator._onError(schema, value, state, path, "not a boolean")
		
		return value
	}
	
	
	static _validateArray(schema, array, state, path)
	{
		if (!Array.isArray(array))
			return Validator._onError(schema, array, state, path, "not an array")
		
		if (typeof schema.$maxLen === "number")
			if (array.length > schema.$maxLen)
				return Validator._onError(schema, array, state, path, "array too long")
			
		if (typeof schema.$minLen === "number")
			if (array.length < schema.$minLen)
				return Validator._onError(schema, array, state, path, "array too short")
			
		let newArray = new Array(array.length)
		for (let i = 0; i < array.length; i++)
			newArray[i] = Validator._validateRecursive(schema.$of, array[i], state, path + "[" + i + "]")
			
		return newArray
	}
}


export class ValidatorError
{
	constructor(path, message)
	{
		this.path = path
		this.message = message
	}
	
	
	toString()
	{
		return "validation against schema failed at {" + this.path + " }: " + this.message
	}
}