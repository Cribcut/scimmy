'use strict';

/**
 * Base Attribute configuration, and proxied configuration validation trap handler
 * @type {{target: SCIMMY.Types.Attribute~AttributeConfig, handler: ProxiedConfigHandler}}
 * @private
 */
const BaseConfiguration = {
    /**
     * @typedef {Object} SCIMMY.Types.Attribute~AttributeConfig
     * @property {Boolean} [multiValued=false] - does the attribute expect a collection of values
     * @property {String} [description=""] - a human-readable description of the attribute
     * @property {Boolean} [required=false] - whether the attribute is required for the type instance to be valid
     * @property {Boolean|String[]} [canonicalValues=false] - values the attribute's contents must be set to
     * @property {Boolean} [caseExact=false] - whether the attribute's contents is case-sensitive
     * @property {Boolean|String} [mutable=true] - whether the attribute's contents is modifiable
     * @property {Boolean|String} [returned=true] - whether the attribute is returned in a response
     * @property {Boolean|String[]} [referenceTypes=false] - list of referenced types if attribute type is reference
     * @property {String|Boolean} [uniqueness="none"] - the attribute's uniqueness characteristic
     * @property {String} [direction="both"] - whether the attribute should be present for inbound, outbound, or bidirectional requests
     * @property {Boolean} [shadow=false] - whether the attribute should be hidden from schemas presented by the resource type endpoint
     */
    target: {
        shadow: false, required: false, mutable: true, multiValued: false, caseExact: false, returned: true,
        description: "", canonicalValues: false, referenceTypes: false, uniqueness: "none", direction: "both"
    },
    
    /**
     * Proxied configuration validation trap handler
     * @alias ProxiedConfigHandler
     * @param {String} errorSuffix - the suffix to use in thrown type errors
     * @returns {{set: (function(Object, String, *): boolean)}} the handler trap definition to use in the config proxy
     * @private
     */
    handler: (errorSuffix) => ({
        set: (target, key, value) => {
            // Make sure required, multiValued, and caseExact are booleans
            if (["required", "multiValued", "caseExact", "shadow"].includes(key) && (value !== undefined && typeof value !== "boolean"))
                throw new TypeError(`Attribute '${key}' value must be either 'true' or 'false' in ${errorSuffix}`);
            // Make sure canonicalValues and referenceTypes are valid if they are specified
            if (["canonicalValues", "referenceTypes"].includes(key) && (value !== undefined && value !== false && !Array.isArray(value)))
                throw new TypeError(`Attribute '${key}' value must be either a collection or 'false' in ${errorSuffix}`);
            // Make sure mutability, returned, and uniqueness config values are valid
            if (["mutable", "returned", "uniqueness"].includes(key)) {
                let label = (key === "mutable" ? "mutability" : key);
            
                if ((typeof value === "string" && !CharacteristicValidity[label].includes(value)))
                    throw new TypeError(`Attribute '${label}' value '${value}' not recognised in ${errorSuffix}`);
                else if (value !== undefined && !["string", "boolean"].includes(typeof value))
                    throw new TypeError(`Attribute '${label}' value must be either string or boolean in ${errorSuffix}`);
            }
            
            // Set the value!
            return (target[key] = value) || true;
        }
    })
};

/**
 * Valid values for various Attribute characteristics
 * @type {{types: ValidAttributeTypes, mutability: ValidMutabilityValues, returned: ValidReturnedValues, uniqueness: ValidUniquenessValues}}
 * @private
 */
const CharacteristicValidity = {
    /**
     * Collection of valid attribute type characteristic's values
     * @enum
     * @inner
     * @constant
     * @type {String[]}
     * @alias ValidAttributeTypes
     * @memberOf SCIMMY.Types.Attribute
     * @default
     */
    types: ["string", "complex", "boolean", "binary", "decimal", "integer", "dateTime", "reference"],
    
    /**
     * Collection of valid attribute mutability characteristic's values
     * @enum
     * @inner
     * @constant
     * @type {String[]}
     * @alias ValidMutabilityValues
     * @memberOf SCIMMY.Types.Attribute
     * @default
     */
    mutability: ["readOnly", "readWrite", "immutable", "writeOnly"],
    
    /**
     * Collection of valid attribute returned characteristic's values
     * @enum
     * @inner
     * @constant
     * @type {String[]}
     * @alias ValidReturnedValues
     * @memberOf SCIMMY.Types.Attribute
     * @default
     */
    returned: ["always", "never", "default", "request"],
    
    /**
     * Collection of valid attribute uniqueness characteristic's values
     * @enum
     * @inner
     * @constant
     * @type {String[]}
     * @alias ValidUniquenessValues
     * @memberOf SCIMMY.Types.Attribute
     * @default
     */
    uniqueness: ["none", "server", "global"]
};

/**
 * Attribute value validation method container
 * @type {{canonical: validate.canonical, string: validate.string, date: validate.date, number: validate.number, reference: validate.reference}}
 * @private
 */
const validate = {
    /**
     * If the attribute has canonical values, make sure value is one of them
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    canonical: (attrib, value) => {
        if (Array.isArray(attrib.config.canonicalValues) && !attrib.config.canonicalValues.includes(value))
            throw new TypeError(`Attribute '${attrib.name}' does not include canonical value '${value}'`);
    },
    
    /**
     * If the attribute type is string, make sure value can safely be cast to string
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    string: (attrib, value) => {
        if (typeof value !== "string" && value !== null) {
            const type = (value instanceof Date ? "dateTime" : typeof value === "object" ? "complex" : typeof value);
            
            // Catch array and object values as they will not cast to string as expected
            throw new TypeError(`Attribute '${attrib.name}' expected ` + (Array.isArray(value)
                ? "single value of type 'string'" : `value type 'string' but found type '${type}'`));
        }
    },
    
    /**
     * Check if value is a valid date
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    date: (attrib, value) => {
        const date = new Date(value);
        const type = (value instanceof Date ? "dateTime" : typeof value === "object" ? "complex" : typeof value);
        
        // Reject values that definitely aren't dates
        if (["number", "complex", "boolean"].includes(type) || (type === "string" && date.toString() === "Invalid Date"))
            throw new TypeError(`Attribute '${attrib.name}' expected ` + (Array.isArray(value)
                ? "single value of type 'dateTime'" : `value type 'dateTime' but found type '${type}'`));
        // Start with the simple date validity test
        else if (!(date.toString() !== "Invalid Date"
            // Move on to the complex test, as for some reason strings like "Testing, 1, 2" parse as valid dates...
            && date.toISOString().match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/)))
            throw new TypeError(`Attribute '${attrib.name}' expected value to be a valid date`);
    },
    
    /**
     * If the attribute type is decimal or integer, make sure value can safely be cast to number
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    number: (attrib, value) => {
        const {type, name} = attrib;
        const isNum = !!String(value).match(/^-?\d+?(\.\d+)?$/);
        const isInt = isNum && !String(value).includes(".");
        const actual = (value instanceof Date ? "dateTime" : typeof value === "object" ? "complex" : typeof value);
        
        if (typeof value === "object" && value !== null) {
            // Catch case where value is an object or array
            throw new TypeError(`Attribute '${name}' expected ` + (Array.isArray(value)
                ? `single value of type '${type}'` : `value type '${type}' but found type '${actual}'`));
        }
        
        // Not a number
        if (!isNum)
            throw new TypeError(`Attribute '${name}' expected value type '${type}' but found type '${actual}'`);
        // Expected decimal, got integer
        if (type === "decimal" && isInt)
            throw new TypeError(`Attribute '${name}' expected value type 'decimal' but found type 'integer'`);
        // Expected integer, got decimal
        if (type === "integer" && !isInt)
            throw new TypeError(`Attribute '${name}' expected value type 'integer' but found type 'decimal'`);
    },
    
    /**
     * If the attribute type is binary, make sure value can safely be cast to buffer
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    binary: (attrib, value) => {
        let message;
        
        if (typeof value === "object" && value !== null) {
            const type = (value instanceof Date ? "dateTime" : typeof value === "object" ? "complex" : typeof value);
            
            // Catch case where value is an object or array
            if (Array.isArray(value)) message = `Attribute '${attrib.name}' expected single value of type 'binary'`;
            else message = `Attribute '${attrib.name}' expected value type 'binary' but found type '${type}'`;
        } else {
            // Start by assuming value is not binary or base64
            message = `Attribute '${attrib.name}' expected value type 'binary' to be base64 encoded string or binary octet stream`;
            
            try {
                message = (!!Buffer.from(value) ? false : message);
            } catch {
                // Value is invalid, nothing to do here
            }
        }
        
        // If there is a message, throw it!
        if (!!message) throw new TypeError(message);
    },
    
    /**
     * If the attribute type is boolean, make sure value is a boolean
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    boolean: (attrib, value) => {
        if (
            typeof value !== "boolean" &&
            value !== null &&
            (typeof value !== "string" || !["true", "false"].includes(value.toLowerCase()))
        ) {
            const type = (value instanceof Date ? "dateTime" : typeof value === "object" ? "complex" : typeof value);
            
            // Catch array and object values as they will not cast to string as expected
            throw new TypeError(`Attribute '${attrib.name}' expected ` + (Array.isArray(value)
                ? "single value of type 'boolean'" : `value type 'boolean' but found type '${type}'`));
        }
    },
    
    /**
     * If the attribute type is reference, make sure value is a reference
     * @param {SCIMMY.Types.Attribute} attrib - the attribute performing the validation
     * @param {*} value - the value being validated
     */
    reference: (attrib, value) => {
        const listReferences = (attrib.config.referenceTypes || []).map(t => `'${t}'`).join(", ");
        const coreReferences = (attrib.config.referenceTypes || []).filter(t => ["uri", "external"].includes(t));
        const typeReferences = (attrib.config.referenceTypes || []).filter(t => !["uri", "external"].includes(t));
        let message;
        
        // If there's no value and the attribute isn't required, skip validation
        if (value === undefined && !attrib?.config?.required) return;
        else if (typeof value !== "string" && value !== null) {
            const type = (value instanceof Date ? "dateTime" : typeof value === "object" ? "complex" : typeof value);
            
            // Catch case where value is an object or array
            if (Array.isArray(value)) message = `Attribute '${attrib.name}' expected single value of type 'reference'`;
            else message = `Attribute '${attrib.name}' expected value type 'reference' but found type '${type}'`;
        } else if (listReferences.length === 0) {
            // If the referenceTypes list is empty, no value can match
            message = `Attribute '${attrib.name}' with type 'reference' does not specify any referenceTypes`;
        } else {
            // Start by assuming no reference types match
            message = `Attribute '${attrib.name}' expected value type 'reference' to refer to one of: ${listReferences}`;
            
            // Check for any valid resource type references, if any provided
            if (typeReferences.some(t => (String(value).startsWith(t) || (String(value).includes(`/${t}`))))) {
                message = false;
            }
            // If reference types includes external, make sure value is a valid URL with hostname
            if (coreReferences.includes("external")) {
                try {
                    message = (!!new URL(value).hostname ? false : message);
                } catch {
                    // Value is invalid, nothing to do here
                }
            }
            // If reference types includes URI, make sure value can be instantiated as a URL
            if (coreReferences.includes("uri")) {
                try {
                    // See if it can be parsed as a URL
                    message = (new URL(value) ? false : message);
                } catch {
                    // See if it's a relative URI
                    message = (String(value).startsWith("/") ? false : message);
                }
            }
        }
        
        // If there is a message, throw it!
        if (!!message) throw new TypeError(message);
    }
};

function defineSubAttributes(target, resource, name, subAttributes, direction) {
    // Go through each sub-attribute for coercion
    for (let subAttribute of subAttributes) {
        const {name} = subAttribute;

        // Predefine getters and setters for all possible sub-attributes
        Object.defineProperties(target, {
            // Because why bother with case-sensitivity in a JSON-based standard?
            // See: RFC7643§2.1 (https://datatracker.ietf.org/doc/html/rfc7643#section-2.1)
            [name.toLowerCase()]: {
                get: () => (target[name]),
                set: (value) => (target[name] = value)
            },
            // Now set the handles for the actual name
            // Overrides above if name is already all lower case
            [name]: {
                enumerable: true,
                // Get and set the value from the internally scoped object
                get: () => (resource[name]),
                // Validate the supplied value through attribute coercion
                set: (value) => {
                    try {
                        return (resource[name] = subAttribute.coerce(value, direction))
                    } catch (ex) {
                        // Add additional context
                        ex.message += ` from complex attribute '${name}'`;
                        throw ex;
                    }
                }
            }
        });
    }
}

/**
 * Deeply check whether a targeted object has any properties with actual values
 * @param {Object} target - object to deeply check for values
 * @returns {Boolean} whether the target object, or any of its object properties, have a value other than undefined
 * @private
 */
const hasActualValues$1 = (target) => (Object.values(target).some((v) => typeof v === "object" ? hasActualValues$1(v) : v !== undefined));

function defineToJSON(target, resource, subAttributes) {
    // Set "toJSON" method on target so subAttributes can be filtered
    Object.defineProperty(target, "toJSON", {
        value: () => {
            if (!resource || !hasActualValues$1(resource)) return undefined;
            return Object.entries(resource)
                .filter(([name]) => ![false, "never"].includes(subAttributes.find(a => a.name === name).config.returned))
                .reduce((res, [name, value]) => Object.assign(res, {[name]: value}), {})
        }
    });
}

function coerceBoolean(value) {
    if (typeof value === "string") {
        if (value.toLowerCase() === "true") return true;
        if (value.toLowerCase() === "false") return false;
    }

    return !!value;
}

/**
 * SCIM Attribute Type
 * @alias SCIMMY.Types.Attribute
 * @summary
 * *   Defines a SCIM schema attribute, and is used to ensure a given resource's value conforms to the attribute definition.
 */
class Attribute {
    /**
     * Constructs an instance of a full SCIM attribute definition
     * @param {String} type - the data type of the attribute
     * @param {String} name - the actual name of the attribute
     * @param {SCIMMY.Types.Attribute~AttributeConfig|Object} [config] - additional config defining the attribute's characteristics
     * @param {SCIMMY.Types.Attribute[]} [subAttributes] - if the attribute is complex, the sub-attributes of the attribute
     * @property {String} type - the data type of the attribute
     * @property {String} name - the actual name of the attribute
     * @property {SCIMMY.Types.Attribute~AttributeConfig} config - additional config defining the attribute's characteristics
     * @property {SCIMMY.Types.Attribute[]} [subAttributes] - if the attribute is complex, the sub-attributes of the attribute
     */
    constructor(type, name, config = {}, subAttributes = []) {
        const errorSuffix = `attribute definition '${name}'`;
        // Check for invalid characters in attribute name
        const [, invalidNameChar, invalidNameStart] = /([^-$\w])|(^[^-$\w])/g.exec(name) ?? [];
        
        // Make sure name and type are supplied as strings
        for (let [param, value] of [["type", type], ["name", name]]) if (typeof value !== "string")
            throw new TypeError(`Required parameter '${param}' missing from Attribute instantiation`);
        // Make sure type is valid
        if (!CharacteristicValidity.types.includes(type))
            throw new TypeError(`Type '${type}' not recognised in ${errorSuffix}`);
        // Make sure first character in name is valid
        if (!!invalidNameStart)
            throw new TypeError(`Invalid leading character '${invalidNameStart}' in name of ${errorSuffix}`);
        // Make sure rest of name is valid
        if (!!invalidNameChar)
            throw new TypeError(`Invalid character '${invalidNameChar}' in name of ${errorSuffix}`);
        // Make sure attribute type is 'complex' if subAttributes are defined
        if (subAttributes.length && type !== "complex")
            throw new TypeError(`Attribute type must be 'complex' when subAttributes are specified in ${errorSuffix}`);
        // Make sure subAttributes are all instances of Attribute
        if (type === "complex" && !subAttributes.every(a => a instanceof Attribute))
            throw new TypeError(`Expected 'subAttributes' to be an array of Attribute instances in ${errorSuffix}`);
        
        // Attribute config is valid, proceed
        this.type = type;
        this.name = name;
        
        // Prevent addition and removal of properties from config
        this.config = Object.seal(Object
            .assign(new Proxy({...BaseConfiguration.target}, BaseConfiguration.handler(errorSuffix)), config));
        
        // Store subAttributes, and make sure any additions are also attribute instances
        if (type === "complex") this.subAttributes = new Proxy([...subAttributes], {
            set: (target, key, value) => {
                if (key === "length" || value instanceof Attribute) target[key] = value;
                else throw new TypeError(`Complex attribute '${this.name}' expected new subAttributes to be Attribute instances`);
                
                return key === "length" || target.includes(value);
            }
        });
        
        // Prevent this attribute definition from changing!
        // Note: config and subAttributes can still be modified, just not replaced.
        Object.freeze(this);
    }
    
    /**
     * Remove a subAttribute from a complex attribute definition
     * @param {String|SCIMMY.Types.Attribute} subAttributes - the child attributes to remove from the complex attribute definition
     * @returns {SCIMMY.Types.Attribute} this attribute instance for chaining
     */
    truncate(subAttributes) {
        if (this.type === "complex") {
            for (let subAttrib of (Array.isArray(subAttributes) ? subAttributes : [subAttributes])) {
                if (this.subAttributes.includes(subAttrib)) {
                    // Remove found subAttribute from definition
                    const index = this.subAttributes.indexOf(subAttrib);
                    if (index >= 0) this.subAttributes.splice(index, 1);
                } else if (typeof subAttrib === "string") {
                    // Attempt to find the subAttribute by name and try truncate again
                    this.truncate(this.subAttributes.find(a => a.name === subAttrib));
                }
            }
        }
        
        return this;
    }
    
    /**
     * Parse this Attribute instance into a valid SCIM attribute definition object
     * @returns {SCIMMY.Types.Attribute~AttributeDefinition} an object representing a valid SCIM attribute definition
     */
    toJSON() {
        /**
         * @typedef {Object} SCIMMY.Types.Attribute~AttributeDefinition
         * @alias AttributeDefinition
         * @memberOf SCIMMY.Types.Attribute
         * @property {String} name - the attribute's name
         * @property {String} type - the attribute's data type
         * @property {String[]} [referenceTypes] - specifies a SCIM resourceType that a reference attribute may refer to
         * @property {Boolean} multiValued - boolean value indicating an attribute's plurality
         * @property {String} description - a human-readable description of the attribute
         * @property {Boolean} required - boolean value indicating whether the attribute is required
         * @property {SCIMMY.Types.Attribute~AttributeDefinition[]} [subAttributes] - defines the sub-attributes of a complex attribute
         * @property {Boolean} [caseExact] - boolean value indicating whether a string attribute is case-sensitive
         * @property {String[]} [canonicalValues] - collection of canonical values
         * @property {String} mutability - indicates whether an attribute is modifiable
         * @property {String} returned - indicates when an attribute is returned in a response
         * @property {String} [uniqueness] - indicates how unique a value must be
         */
        return {
            name: this.name,
            type: this.type,
            ...(this.type === "reference" ? {referenceTypes: this.config.referenceTypes} : {}),
            multiValued: this.config.multiValued,
            description: this.config.description,
            required: this.config.required,
            ...(this.type === "complex" ? {subAttributes: this.subAttributes.filter(a => (!a.config.shadow))} : {}),
            ...(this.config.caseExact === true || ["string", "reference", "binary"].includes(this.type) ? {caseExact: this.config.caseExact} : {}),
            ...(Array.isArray(this.config.canonicalValues) ? {canonicalValues: this.config.canonicalValues} : {}),
            mutability: (typeof this.config.mutable === "string" ? this.config.mutable
                : (this.config.mutable ? (this.config.direction === "in" ? "writeOnly" : "readWrite") : "readOnly")),
            returned: (typeof this.config.returned === "string" ? this.config.returned
                : (this.config.returned ? "default" : "never")),
            ...(this.type !== "boolean" && this.config.uniqueness !== false ? {uniqueness: this.config.uniqueness} : {})
        }
    }
    
    /**
     * Coerce a given value by making sure it conforms to attribute's characteristics
     * @param {any|any[]} source - value to coerce and confirm conformity with attribute's characteristics
     * @param {String} [direction] - whether to check for inbound, outbound, or bidirectional attributes
     * @param {Boolean} [isComplexMultiValue=false] - indicates whether a coercion is for a single complex value in a collection of complex values
     * @returns {String|String[]|Number|Boolean|Object|Object[]} the coerced value, conforming to attribute's characteristics
     */
    coerce(source, direction = "both", isComplexMultiValue = false) {
        // Make sure the direction matches the attribute direction
        if (["both", this.config.direction].includes(direction) || this.config.direction === "both") {
            const {required, multiValued, canonicalValues} = this.config;
            
            // If the attribute is required, make sure it has a value
            if ((source === undefined || source === null) && required && (direction !== "both" || this.config.direction === direction))
                throw new TypeError(`Required attribute '${this.name}' is missing`);
            // If the attribute is multi-valued, make sure its value is a collection
            if (source !== undefined && !isComplexMultiValue && multiValued && !Array.isArray(source))
                throw new TypeError(`Attribute '${this.name}' expected to be a collection`);
            // If the attribute is NOT multi-valued, make sure its value is NOT a collection
            if (!multiValued && Array.isArray(source))
                throw new TypeError(`Attribute '${this.name}' is not multi-valued and must not be a collection`);
            // If the attribute specifies canonical values, make sure all values are valid
            if (source !== undefined && Array.isArray(canonicalValues) && (!(multiValued ? (source ?? []).every(v => canonicalValues.includes(v)) : canonicalValues.includes(source))))
                throw new TypeError(`Attribute '${this.name}' contains non-canonical value`);
            
            // If the source has a value, parse it
            if (source !== undefined && source !== null) switch (this.type) {
                case "string":
                    // Throw error if all values can't be safely cast to strings
                    for (let value of (multiValued ? source : [source])) validate.string(this, value);
                    
                    // Cast supplied values into strings
                    return (!multiValued ? String(source) : new Proxy(source.map(v => String(v)), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.string(this, value) ?? String(value)))))
                    }));
                
                case "dateTime":
                    // Throw error if all values aren't valid dates
                    for (let value of (multiValued ? source : [source])) validate.date(this, value);
                    
                    // Convert date values to ISO strings
                    return (!multiValued ? new Date(source).toISOString() : new Proxy(source.map(v => new Date(v).toISOString()), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.date(this, value) ?? new Date(value).toISOString()))))
                    }));
                
                case "decimal":
                case "integer":
                    // Throw error if all values can't be safely cast to numbers
                    for (let value of (multiValued ? source : [source])) validate.number(this, value);
                    
                    // Cast supplied values into numbers
                    return (!multiValued ? Number(source) : new Proxy(source.map(v => Number(v)), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.number(this, value) ?? Number(value)))))
                    }));
                
                case "reference":
                    // Throw error if all values can't be safely cast to strings
                    for (let value of (multiValued ? source : [source])) validate.reference(this, value);
                    
                    // Cast supplied values into strings
                    return (!multiValued ? String(source) : new Proxy(source.map(v => String(v)), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) =>(!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.reference(this, value) ?? String(value)))))
                    }));
                
                case "binary":
                    // Throw error if all values can't be safely cast to buffers
                    for (let value of (multiValued ? source : [source])) validate.binary(this, value);
                    
                    // Cast supplied values into strings
                    return (!multiValued ? String(source) : new Proxy(source.map(v => String(v)), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value :
                                validate.canonical(this, value) ?? validate.binary(this, value) ?? String(value)))))
                    }));
                
                case "boolean":
                    // Throw error if all values can't be safely cast to booleans
                    for (let value of (multiValued ? source : [source])) validate.boolean(this, value);
                    
                    // Cast supplied values into booleans
                    return (!multiValued ? coerceBoolean(source) : new Proxy(source.map(v => !!v), {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value : validate.boolean(this, value) ?? coerceBoolean(value))) || true))
                    }));
                
                case "complex":
                    // Prepare for a complex attribute's values
                    let target = (!isComplexMultiValue ? [] : {});
                    
                    // Evaluate complex attribute's sub-attributes
                    if (isComplexMultiValue) {
                        // Make sure values are complex before proceeding
                        if (Object(source) !== source || source instanceof Date) {
                            throw new TypeError(`Complex attribute '${this.name}' expected complex value but found type `
                                + `'${source instanceof Date ? "dateTime" : source === null ? "null" : typeof source}'`);
                        }
                        
                        let resource = {};
                        
                        defineSubAttributes(target, resource, this.name, this.subAttributes, direction);

                        defineToJSON(target, resource, this.subAttributes);
                        
                        // Prevent changes to target
                        Object.freeze(target);
                        
                        // Then add specified values to the target, invoking sub-attribute coercion
                        for (let [key, value] of Object.entries(source)) try {
                            target[key.toLowerCase()] = value;
                        } catch (ex) {
                            // Attempted to add an undeclared attribute to the value
                            if (ex instanceof TypeError && ex.message.endsWith("not extensible")) {
                                ex.message = `Complex attribute '${this.name}' `
                                    + (typeof source !== "object" || Array.isArray(source)
                                    ? `expected complex value but found type '${typeof source}'`
                                    : `does not declare subAttribute '${key}'`);
                            }
                            
                            throw ex;
                        }
                        
                        // Reassign values to catch missing required sub-attributes
                        for (let [key, value] of Object.entries(target)) target[key] = value;
                    } else {
                        // Go through each value and coerce their sub-attributes
                        for (let value of (multiValued ? source : [source])) {
                            target.push(this.coerce(value, direction, true));
                        }
                    }
                    
                    // Return the collection, or the coerced complex value
                    return (isComplexMultiValue ? target : (!multiValued ? target.pop() : new Proxy(target, {
                        // Wrap the resulting collection with coercion
                        set: (target, key, value) => (!!(key in Object.getPrototypeOf([]) && key !== "length" ? false :
                            (target[key] = (key === "length" ? value : this.coerce(value, direction, true)))))
                    })));
                
                default:
                    return source;
            }

            if (!source && this.subAttributes?.length && !multiValued) {
                const target = {};
                const resource = {};
                defineSubAttributes(target, resource, this.name, this.subAttributes, direction);
                defineToJSON(target, resource, this.subAttributes);
                Object.freeze(target);
                return target;
            }
        }
    }
}

/**
 * SCIM Error Type
 * @alias SCIMMY.Types.Error
 * @see SCIMMY.Messages.Error
 * @summary
 * *   Extends the native Error class and provides a way to express errors caused by SCIM protocol, schema conformity, filter expression,
 *     or other exceptions with details required by the SCIM protocol in [RFC7644§3.12](https://datatracker.ietf.org/doc/html/rfc7644#section-3.12).
 */
class SCIMError extends Error {
    /**
     * Instantiate a new error with SCIM error details
     * @param {Number} status - HTTP status code to be sent with the error
     * @param {String} scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @param {String} message - a human-readable description of what caused the error to occur
     * @property {Number} status - HTTP status code to be sent with the error
     * @property {String} scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @property {String} message - a human-readable description of what caused the error to occur
     */
    constructor(status, scimType, message) {
        super(message);
        
        this.name = "SCIMError";
        this.status = status;
        this.scimType = scimType;
    }
}

/**
 * Collection of valid logical operator strings in a filter expression
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidLogicStrings
 * @memberOf SCIMMY.Types.Filter
 * @default
 */
const operators = ["and", "or", "not"];
/**
 * Collection of valid comparison operator strings in a filter expression
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidComparisonStrings
 * @memberOf SCIMMY.Types.Filter
 * @default
 */
const comparators = ["eq", "ne", "co", "sw", "ew", "gt", "lt", "ge", "le", "pr", "np"];

// Regular expressions that represent filter syntax
const lexicon = [
    // White Space, Number Values
    /(\s+)/, /([-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)(?![\w+-])/,
    // Boolean Values, Empty Values, String Values
    /(false|true)+/, /(null)+/, /("(?:[^"]|\\.|\n)*")/,
    // Logical Groups, Complex Attribute Value Filters
    /(\((?:.*?)\))/, /(\[(?:.*?)][.]?)/,
    // Logical Operators and Comparators
    new RegExp(`(${operators.join("|")})(?=[^a-zA-Z0-9]|$)`),
    new RegExp(`(${comparators.join("|")})(?=[^a-zA-Z0-9]|$)`),
    // All other "words"
    /([-$\w][-$\w._:\/%]*)/
];

// Parsing Pattern Matcher
const patterns = new RegExp(`^(?:${lexicon.map(({source}) => source).join("|")})`, "i");
// Split a path by fullstops when they aren't in a filter group or decimal
const pathSeparator = /(?<![^\w]\d)\.(?!\d[^\w]|[^[]*])/g;
// Extract attributes and filter strings from path parts
const multiValuedFilter = /^(.+?)(\[(?:.*?)])?$/;
// Match ISO 8601 formatted datetime stamps in strings
const isoDate = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/;

/**
 * SCIM Filter Type
 * @alias SCIMMY.Types.Filter
 * @summary
 * *   Parses SCIM [filter expressions](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2) into object representations of the filter expression.
 * @description
 * This class provides a lexer implementation to tokenise and parse SCIM [filter expression](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2) strings into meaningful object representations.  
 * It is used to automatically parse `attributes`, `excludedAttributes`, and `filter` expressions in the `{@link SCIMMY.Types.Resource}` class, and by extension, each Resource implementation.
 * The SchemaDefinition `{@link SCIMMY.Types.SchemaDefinition#coerce|#coerce()}` method uses instances of this class, typically sourced
 * from a Resource instance's `attributes` property, to determine which attributes to include or exclude on coerced resources.
 * It is also used for resolving complex multi-valued attribute operations in SCIMMY's {@link SCIMMY.Messages.PatchOp|PatchOp} implementation.
 * 
 * ### Object Representation
 * When instantiated with a valid filter expression string, the expression is parsed into an array of objects representing the given expression.
 * 
 * > **Note:**  
 * > It is also possible to substitute the expression string with an existing or well-formed expression object or set of objects.
 * > As such, valid filters can be instantiated using any of the object representations below.
 * > When instantiated this way, the `expression` property is dynamically generated from the supplied expression objects.
 * 
 * The properties of each object are directly sourced from attribute names parsed in the expression.
 * As the class intentionally has no knowledge of the underlying attribute names associated with a schema,
 * the properties of the object are case-sensitive, and will match the case of the attribute name provided in the filter.
 * ```js
 * // For the filter expressions...
 * 'userName eq "Test"', and 'uSerName eq "Test"'
 * // ...the object representations are
 * [ {userName: ["eq", "Test"]} ], and [ {uSerName: ["eq", "Test"]} ]
 * ```
 * 
 * As SCIM attribute names MUST begin with a lower-case letter, they are the exception to this rule,
 * and will automatically be cast to lower-case.
 * ```js
 * // For the filter expressions...
 * 'UserName eq "Test"', and 'Name.FamilyName eq "Test"'
 * // ...the object representations are
 * [ {userName: ["eq", "Test"]} ], and [ {name: {familyName: ["eq", "Test"]}} ]
 * ```
 * 
 * #### Logical Operations
 * ##### `and`
 * For each logical `and` operation in the expression, a new property is added to the object.
 * ```js
 * // For the filter expression...
 * 'userName co "a" and name.formatted sw "Bob" and name.honoraryPrefix eq "Mr"'
 * // ...the object representation is
 * [ {userName: ["co", "a"], name: {formatted: ["sw", "Bob"], honoraryPrefix: ["eq", "Mr"]}} ]
 * ```
 * 
 * When an attribute name is specified multiple times in a logical `and` operation, the expressions are combined into a new array containing each individual expression.
 * ```js
 * // For the filter expression...
 * 'userName sw "A" and userName ew "z"'
 * // ...the object representation is
 * [ {userName: [["sw", "A"], ["ew", "Z"]]} ]
 * ```
 * 
 * ##### `or`
 * For each logical `or` operation in the expression, a new object is added to the filter array.
 * ```js
 * // For the filter expression...
 * 'userName eq "Test" or displayName co "Bob"'
 * // ...the object representation is
 * [
 *     {userName: ["eq", "Test"]},
 *     {displayName: ["co", "Bob"]}
 * ]
 * ```
 * 
 * When the logical `or` operation is combined with the logical `and` operation, the `and` operation takes precedence.
 * ```js
 * // For the filter expression...
 * 'userName eq "Test" or displayName co "Bob" and quota gt 5'
 * // ...the object representation is
 * [
 *     {userName: ["eq", "Test"]},
 *     {displayName: ["co", "Bob"], quota: ["gt", 5]}
 * ]
 * ```
 * 
 * ##### `not`
 * Logical `not` operations in an expression are added to an object property's array of conditions.
 * ```js
 * // For the filter expression...
 * 'not userName eq "Test"'
 * // ...the object representation is
 * [ {userName: ["not", "eq", "Test"]} ]
 * ```
 * 
 * For simplicity, the logical `not` operation is assumed to only apply to the directly following comparison statement in an expression.
 * ```js
 * // For the filter expression...
 * 'userName sw "A" and not userName ew "Z" or displayName co "Bob"'
 * // ...the object representation is
 * [
 *     {userName: [["sw", "A"], ["not", "ew", "Z"]]},
 *     {displayName: ["co", "Bob"]}
 * ]
 * ```
 * 
 * If needed, logical `not` operations can be applied to multiple comparison statements using grouping operations.
 * ```js
 * // For the filter expression...
 * 'userName sw "A" and not (userName ew "Z" or displayName co "Bob")'
 * // ...the object representation is
 * [
 *     {userName: [["sw", "A"], ["not", "ew", "Z"]]},
 *     {userName: ["sw", "A"], displayName: ["not", "co", "Bob"]}
 * ]
 * ```
 * 
 * #### Grouping Operations
 * As per the order of operations in the SCIM protocol specification, grouping operations are evaluated ahead of any simpler expressions.
 * 
 * In more complex scenarios, expressions can be grouped using `(` and `)` parentheses to change the standard order of operations.  
 * This is referred to as *precedence grouping*.
 * ```js
 * // For the filter expression...
 * 'userType eq "Employee" and (emails co "example.com" or emails.value co "example.org")'
 * // ...the object representation is
 * [
 *     {userType: ["eq", "Employee"], emails: ["co", "example.com"]},
 *     {userType: ["eq", "Employee"], emails: {value: ["co", "example.org"]}}
 * ]
 * ```
 * 
 * Grouping operations can also be applied to complex attributes using the `[` and `]` brackets to create filters that target sub-attributes.  
 * This is referred to as *complex attribute filter grouping*.
 * ```js
 * // For the filter expression...
 * 'emails[type eq "work" and value co "@example.com"] or ims[type eq "xmpp" and value co "@foo.com"]'
 * // ...the object representation is
 * [
 *     {emails: {type: ["eq", "work"], value: ["co", "@example.com"]}},
 *     {ims: {type: ["eq", "xmpp"], value: ["co", "@foo.com"]}}
 * ]
 * ```
 * 
 * Complex attribute filter grouping can also be used to target sub-attribute values of multi-valued attributes with specific values.
 * ```js
 * // For the filter expression...
 * 'emails[type eq "work" or type eq "home"].values[domain ew "@example.org" or domain ew "@example.com"]'
 * // ...the object representation is
 * [
 *     {emails: {type: ["eq", "work"], values: {domain: ["ew", "@example.org"]}}},
 *     {emails: {type: ["eq", "work"], values: {domain: ["ew", "@example.com"]}}},
 *     {emails: {type: ["eq", "home"], values: {domain: ["ew", "@example.org"]}}},
 *     {emails: {type: ["eq", "home"], values: {domain: ["ew", "@example.com"]}}}
 * ]
 * ```
 * 
 * Precedence and complex attribute filter grouping can also be combined.
 * ```js
 * // For the filter expression...
 * '(userType eq "Employee" or userType eq "Manager") and emails[type eq "work" or (primary eq true and value co "@example.com")].display co "Work"'
 * // ...the object representation is
 * [
 *     {userType: ["eq", "Employee"], emails: {type: ["eq", "work"], display: ["co", "Work"]}},
 *     {userType: ["eq", "Employee"], emails: {primary: ["eq", true], value: ["co", "@example.com"], display: ["co", "Work"]}},
 *     {userType: ["eq", "Manager"], emails: {type: ["eq", "work"], display: ["co", "Work"]}},
 *     {userType: ["eq", "Manager"], emails: {primary: ["eq", true], value: ["co", "@example.com"], display: ["co", "Work"]}}
 * ]
 * ```
 * 
 * ### Other Implementations
 * It is not possible to replace internal use of the Filter class inside SCIMMY's {@link SCIMMY.Messages.PatchOp|PatchOp} and `{@link SCIMMY.Types.SchemaDefinition|SchemaDefinition}` implementations.
 * Replacing use in the `attributes` property of an instance of `{@link SCIMMY.Types.Resource}`, while technically possible, is not recommended,
 * as it may break attribute filtering in the `{@link SCIMMY.Types.SchemaDefinition#coerce|#coerce()}` method of SchemaDefinition instances.
 * 
 * If SCIMMY's filter expression resource matching does not meet your needs, it can be substituted for another implementation
 * (e.g. [scim2-parse-filter](https://github.com/thomaspoignant/scim2-parse-filter)) when filtering results within your implementation
 * of each resource type's {@link SCIMMY.Types.Resource.ingress|ingress}/{@link SCIMMY.Types.Resource.egress|egress}/{@link SCIMMY.Types.Resource.degress|degress} handler methods.
 * 
 * > **Note:**  
 * > For more information on implementing handler methods, see the `{@link SCIMMY.Types.Resource~IngressHandler|IngressHandler}/{@link SCIMMY.Types.Resource~EgressHandler|EgressHandler}/{@link SCIMMY.Types.Resource~DegressHandler|DegressHandler}` type definitions of the `SCIMMY.Types.Resource` class.
 * 
 * ```js
 * // Import the necessary methods from the other implementation, and for accessing your data source
 * import {parse, filter} from "scim2-parse-filter";
 * import {users} from "some-database-client";
 * 
 * // Register your ingress/egress/degress handler method
 * SCIMMY.Resources.User.egress(async (resource) => {
 *     // Get the original expression string from the resource's filter property...
 *     const {expression} = resource.filter;
 *     // ...and parse/handle it with the other implementation
 *     const f = filter(parse(expression));
 *     
 *     // Retrieve the data from your data source, and filter it as necessary
 *     return await users.find(/some query returning array/).filter(f);
 * });
 * ```
 */
class Filter extends Array {
    // Make sure derivatives return native arrays
    static get [Symbol.species]() {
        return Array;
    }
    
    /**
     * The original string that was parsed by the filter, or the stringified representation of filter expression objects
     * @member {String}
     */
    expression;

    #definition;
    
    /**
     * Instantiate and parse a new SCIM filter string or expression
     * @param {String|Object|Object[]} expression - the query string to parse, or an existing filter expression object or set of objects
     */
    constructor(expression, definition) {
        // See if we're dealing with an expression string
        const isString = typeof expression === "string";
        
        // Make sure expression is a string, an object, or an array of objects
        if (!isString && !(Array.isArray(expression) ? expression : [expression]).every(e => Object.getPrototypeOf(e).constructor === Object))
            throw new TypeError("Expected 'expression' parameter to be a string, object, or array of objects in Filter constructor");
        // Make sure the expression string isn't empty
        if (isString && !expression.trim().length)
            throw new TypeError("Expected 'expression' parameter string value to not be empty in Filter constructor");
        
        // Prepare underlying array and reset inheritance
        Object.setPrototypeOf(super(), Filter.prototype);
        
        // Parse the expression if it was a string
        if (isString) this.push(...Filter.#parse(expression));
        // Otherwise, clone and trap validated expression objects
        else this.push(...Filter.#objectify(Filter.#validate(expression)));
        
        // Save the original expression string, or stringify expression objects
        this.expression = (isString ? expression : Filter.#stringify(this));

        this.#definition = definition;
        
        Object.freeze(this);
    }
    
    /**
     * Compare and filter a given set of values against this filter instance
     * @param {Object[]} values - values to evaluate filters against
     * @returns {Object[]} subset of values that match any expressions of this filter instance
     */
    match(values) {
        // Match against any of the filters in the set
        return values.filter(value => 
            this.some(f => (f !== Object(f) ? false : Object.entries(f).every(([attr, expressions]) => {
                let [,actual] = Object.entries(value).find(([key]) => key.toLowerCase() === attr.toLowerCase()) ?? [];
                const isActualDate = (actual instanceof Date || (new Date(actual).toString() !== "Invalid Date" && String(actual).match(isoDate)));
                const attrDefinition = this.#definition?.attribute?.(attr);
                const isCaseExact = attrDefinition?.config?.caseExact ?? true;
                const isString = attrDefinition?.type === "string";
                
                if (Array.isArray(actual)) {
                    // Handle multivalued attributes by diving into them
                    return !!(new Filter(expressions, attrDefinition).match(actual).length);
                } else if (!Array.isArray(expressions)) {
                    // Handle complex attributes by diving into them
                    return !!(new Filter([expressions], attrDefinition).match([actual]).length);
                } else {
                    let result = null;
                    
                    // Go through the list of expressions for the attribute to see if the value matches
                    for (let expression of (expressions.every(Array.isArray) ? expressions : [expressions])) {
                        // Bail out if the value didn't match the last expression
                        if (result === false) break;
                        
                        // Check for negation and extract the comparator and expected values
                        const negate = (expression[0].toLowerCase() === "not");
                        let [comparator, expected] = expression.slice(((+negate) - expression.length));
                        
                        // For equality tests, cast true and false strings to boolean values, maintaining EntraID support
                        if (["eq", "ne"].includes(comparator.toLowerCase()) && typeof actual === "boolean" && typeof expected === "string")
                            expected = (expected.toLowerCase() === "false" ? false : (expected.toLowerCase() === "true" ? true : expected));

                        if (attrDefinition && isString && !isCaseExact) {
                            actual = String(actual).toLowerCase();
                            expected = String(expected).toLowerCase();
                        }
                        
                        switch (comparator.toLowerCase()) {
                            default:
                                result = false;
                                break;
                            
                            case "eq":
                                result = (actual === (expected ?? undefined));
                                break;
                            
                            case "ne":
                                result = (actual !== (expected ?? undefined));
                                break;
                            
                            case "co":
                                result = String(actual).includes(expected);
                                break;
                            
                            case "sw":
                                result = String(actual).startsWith(expected);
                                break;
                            
                            case "ew":
                                result = String(actual).endsWith(expected);
                                break;
                            
                            case "gt":
                                result = (isActualDate ? (new Date(actual) > new Date(expected)) : (typeof actual === typeof expected && actual > expected));
                                break;
                            
                            case "lt":
                                result = (isActualDate ? (new Date(actual) < new Date(expected)) : (typeof actual === typeof expected && actual < expected));
                                break;
                            
                            case "ge":
                                result = (isActualDate ? (new Date(actual) >= new Date(expected)) : (typeof actual === typeof expected && actual >= expected));
                                break;
                            
                            case "le":
                                result = (isActualDate ? (new Date(actual) <= new Date(expected)) : (typeof actual === typeof expected && actual <= expected));
                                break;
                            
                            case "pr":
                                result = actual !== undefined;
                                break;
                            
                            case "np":
                                result = actual === undefined;
                                break;
                        }
                        
                        result = (negate ? !result : result);
                    }
                    
                    return result;
                }
            })))
        );
    }
    
    /**
     * Check an expression object or set of objects to make sure they are valid
     * @param {Object|Object[]} expression - the expression object or set of objects to validate
     * @param {Number} [originIndex] - the index of the original filter expression object for errors thrown while recursively validating
     * @param {String} [prefix] - the path to prepend to attribute names in thrown errors
     * @returns {Object[]} the original expression object or objects, wrapped in an array
     * @private
     */
    static #validate(expression, originIndex, prefix = "") {
        // Wrap expression in array for validating
        const expressions = Array.isArray(expression) ? expression : [expression];
        
        // Go through each expression in the array and validate it
        for (let e of expressions) {
            // Preserve the top-level index of the expression for thrown errors
            const index = originIndex ?? expressions.indexOf(e)+1;
            const props = Object.entries(e);
            
            // Make sure the expression isn't empty... 
            if (!props.length) {
                if (!prefix) throw new TypeError(`Missing expression properties for Filter expression object #${index}`);
                else throw new TypeError(`Missing expressions for property '${prefix.slice(0, -1)}' of Filter expression object #${index}`);
            }
            
            // Actually go through the expressions
            for (let [attr, expr] of props) {
                // Include prefix in attribute name of thrown errors
                const name = `${prefix}${attr}`;
                
                // If expression is an array, validate it
                if (Array.isArray(expr)) {
                    // See if we're dealing with nesting
                    const nested = expr.some(e => Array.isArray(e));
                    
                    // Make sure expression is either singular or nested, not both
                    if (nested && expr.length && !expr.every(e => Array.isArray(e)))
                        throw new TypeError(`Unexpected nested array in property '${name}' of Filter expression object #${index}`);
                    
                    // Go through and make sure each expression is valid
                    for (let e of (nested ? expr : [expr])) {
                        // Extract comparator and expected value
                        const [comparator, expected] = e.slice(e[0]?.toLowerCase?.() === "not" ? 1 : 0);
                        
                        // Make sure there was a comparator
                        if (!comparator)
                            throw new TypeError(`Missing comparator in property '${name}' of Filter expression object #${index}`);
                        // Make sure presence comparators don't include expected values
                        if (["pr", "np"].includes(comparator.toLowerCase()) && expected !== undefined)
                            throw new TypeError(`Unexpected comparison value for '${comparator}' comparator in property '${name}' of Filter expression object #${index}`);
                        // Make sure expected value was defined for any other comparator
                        if (expected === undefined && !["pr", "np"].includes(comparator.toLowerCase()))
                            throw new TypeError(`Missing expected comparison value for '${comparator}' comparator in property '${name}' of Filter expression object #${index}`);
                    }
                }
                // If expression is an object, traverse it
                else if (Object.getPrototypeOf(expr).constructor === Object)
                    Filter.#validate(expr, index, `${name}.`);
                // Otherwise, the expression is not valid
                else throw new TypeError(`Expected plain object ${name ? `or expression array in property '${name}' of` : "for"} Filter expression object #${index}`)
            }
        }
        
        // All looks good, return the expression array
        return expressions;
    }
    
    /**
     * Turn a parsed filter expression object back into a string
     * @param {SCIMMY.Types.Filter} filter - the SCIMMY filter instance to stringify
     * @returns {String} the string representation of the given filter expression object
     * @private
     */
    static #stringify(filter) {
        return filter.map((e) => Object.entries(e)
            // Create a function that can traverse objects and add prefixes to attribute names
            .map((function getMapper(prefix = "") {
                return ([attr, expr]) => {
                    // If the expression is an array, turn it back into a string
                    if (Array.isArray(expr)) {
                        const expressions = [];
                        
                        // Handle logical "and" operations applied to a single attribute
                        for (let e of expr.every(e => Array.isArray(e)) ? expr : [expr]) {
                            // Copy expression so original isn't modified
                            const parts = [...e];
                            // Then check for negations and extract the actual values
                            const negate = (parts[0].toLowerCase() === "not" ? parts.shift() : undefined);
                            const [comparator, expected] = parts;
                            const maybeValue = expected instanceof Date ? expected.toISOString() : expected;
                            const value = (typeof maybeValue === "string" ? `"${maybeValue}"` : (maybeValue !== undefined ? `${maybeValue}` : maybeValue));
                            
                            // Add the stringified expression to the results
                            expressions.push([negate, `${prefix}${attr}`, comparator, value].filter(v => !!v).join(" "));
                        }
                        
                        return expressions;
                    }
                    // Otherwise, go deeper to get the actual expression
                    else return Object.entries(expr).map(getMapper(`${prefix}${attr}.`));
                }
            })())
            // Turn all joins into a single string...
            .flat(Infinity).join(" and ")
        // ...then turn all branches into a single string
        ).join(" or ");
    }
    
    /**
     * Extract a list of tokens representing the supplied expression
     * @param {String} query - the expression to generate the token list for
     * @returns {Object[]} a set of token objects representing the expression, with details on the token kinds
     * @private
     */
    static #tokenise(query = "") {
        const tokens = [];
        let token;
        
        // Cycle through the query and tokenise it until it can't be tokenised anymore
        while (token = patterns.exec(query)) {
            // Extract the different matches from the token
            const [literal, space, number, boolean, empty, string, grouping, complex, operator, comparator, maybeWord] = token;
            let word = maybeWord;
            
            // If the token isn't whitespace, handle it!
            if (!space) {
                // Handle number, string, boolean, and null values
                if (number !== undefined) tokens.push({type: "Number", value: Number(number)});
                if (string !== undefined) tokens.push({type: "Value", value: `"${String(string.substring(1, string.length-1))}"`});
                if (boolean !== undefined) tokens.push({type: "Boolean", value: boolean === "true"});
                if (empty !== undefined) tokens.push({type: "Empty", value: "null"});
                
                // Handle logical operators and comparators
                if (operator !== undefined) tokens.push({type: "Operator", value: operator});
                if (comparator !== undefined) tokens.push({type: "Comparator", value: comparator});
                
                // Handle grouped filters
                if (grouping !== undefined) tokens.push({type: "Group", value: grouping.substring(1, grouping.length - 1)});
                
                // Treat complex attribute filters as words
                if (complex !== undefined) word = tokens.pop().value + complex;
                
                // Handle attribute names (words), and unescaped string values
                if (word !== undefined) {
                    // Start by assuming the token actually is a word
                    let current = {type: "Word", value: word};
                    
                    // If there was a previous token, make sure it was accurate
                    if (tokens.length) {
                        const previous = tokens[tokens.length-1];
                        
                        // Compound words when last token was a word ending with "."
                        if (previous.type === "Word" && previous.value.endsWith("."))
                            current.value = tokens.pop().value + word;
                        // If the previous token was a comparator...
                        else if (previous.type === "Comparator")
                            // ...this one is almost certainly an unescaped string
                            current = {type: "Value", value: `"${String(word)}"`};
                        // If a word does not follow a logical operator...
                        else if (previous.type !== "Operator")
                            // It is invalid, so skip all further traversal
                            break;
                    }
                    
                    // If all looks good, store the token
                    tokens.push(current);
                }
            }
            
            // Move on to the next token in the query
            query = query.substring(token.index + literal.length);
        }
        
        // If there are still tokens left in the query, something went wrong
        if (query.length > 0) {
            // The syntax of the query must be invalid
            let reason = `Unexpected token '${query}' in filter`;
            
            // Or a group is opened but not closed
            if (query.startsWith("(")) reason = `Missing closing ')' token in filter '${query}'`;
            if (query.startsWith("[")) reason = `Missing closing ']' token in filter '${query}'`;
            
            // Throw the error to break the cycle
            throw new SCIMError(400, "invalidFilter", reason);
        }
        
        return tokens;
    }
    
    /**
     * Divide a list of tokens into sets split by a given logical operator for parsing
     * @param {Object[]} input - list of token objects in a query to divide by the given logical operation
     * @param {String} operator - the logical operator to divide the tokens by
     * @returns {Array<Object[]>} the supplied list of tokens split wherever the given operator occurred
     * @private
     */
    static #operations(input, operator) {
        const tokens = [...input];
        const operations = [];
        
        for (let token of [...tokens]) {
            // Found the target operator token, push preceding tokens as an operation
            if (token.type === "Operator" && token.value.toLowerCase() === operator)
                operations.push(tokens.splice(0, tokens.indexOf(token) + 1).slice(0, -1));
            // Reached the end, add the remaining tokens as an operation
            else if (tokens.indexOf(token) === tokens.length - 1)
                operations.push(tokens.splice(0));
        }
        
        return operations;
    }
    
    /**
     * Translate a given set of expressions into their object representation
     * @param {Object|Object[]|Array<String[]>} expressions - list of expressions to translate into their object representation
     * @returns {Object} translated representation of the given set of expressions
     * @private
     */
    static #objectify(expressions = []) {
        // If the supplied expression was an object, deeply clone it and trap everything along the way in proxies
        if (Object.getPrototypeOf(expressions).constructor === Object) {
            const catchAll = (target, prop) => {throw new TypeError(`Cannot modify property ${prop} of immutable Filter instance`)};
            const handleTraps = {set: catchAll, deleteProperty: catchAll, defineProperty: catchAll};
            
            return new Proxy(Object.entries(expressions).reduce((res, [key, val]) => Object.assign(res, {
                [key]: Array.isArray(val) ? new Proxy(val.map(v => Array.isArray(v) ? new Proxy([...v], handleTraps) : v), handleTraps) : Filter.#objectify(val)
            }), {}), handleTraps);
        }
        // If every supplied expression was an object, make sure they've all been cloned and proxied
        else if (expressions.every(e => Object.getPrototypeOf(e).constructor === Object)) {
            return expressions.map(Filter.#objectify);
        }
        // Go through every expression in the list, or handle a singular expression if that's what was given  
        else {
            const result = {};
            
            for (let expression of (expressions.every(e => Array.isArray(e)) ? expressions : [expressions])) {
                // Check if first token is negative for later evaluation
                const negative = (expression.length === 4 ? expression.shift() : undefined)?.toLowerCase?.();
                // Extract expression parts and derive object path
                const [path, comparator, expected] = expression;
                const parts = path.split(pathSeparator).filter(p => p);
                let value = expected, target = result;
                
                // Construct the object
                for (let key of parts) {
                    // Fix the attribute name
                    const name = `${key[0].toLowerCase()}${key.slice(1)}`;
                    
                    // If there's more path to follow, keep digging
                    if (parts.indexOf(key) < parts.length - 1) target = (target[name] = target[name] ?? {});
                    // Otherwise, we've reached our destination
                    else {
                        // Unwrap string and null values, and store the translated expression
                        value = (value === "null" ? null : (String(value).match(/^["].*["]$/) ? value.substring(1, value.length - 1) : value));
                        const expression = [negative, comparator.toLowerCase(), value].filter(v => v !== undefined);
                        
                        // Either store the single expression, or convert to array if attribute already has an expression defined
                        target[name] = (!Array.isArray(target[name]) ? expression : [...(target[name].every(Array.isArray) ? target[name] : [target[name]]), expression]);
                    }
                }
            }
            
            return Filter.#objectify(result);
        }
    }
    
    /**
     * Parse a SCIM filter string into an array of objects representing the query filter
     * @param {String|Object[]} [query=""] - the filter parameter of a request as per [RFC7644§3.4.2.2]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2}
     * @returns {Object[]} parsed object representation of the queried filter
     * @private
     */
    static #parse(query = "") {
        const results = [];
        const tokens = (Array.isArray(query) ? query : Filter.#tokenise(query));
        // Initial pass to check for complexities
        const simple = !tokens.some(t => ["Operator", "Group"].includes(t.type));
        // Closer inspection in case word tokens contain nested attribute filters
        const reallySimple = simple && (tokens[0]?.value ?? tokens[0] ?? "").split(pathSeparator)
            .every(t => t === multiValuedFilter.exec(t).slice(1).shift());
        
        // If there's no operators or groups, and no nested attribute filters, assume the expression is complete
        if (reallySimple) {
            results.push(Array.isArray(query) ? tokens.map(t => t.value ?? t) : Filter.#objectify(tokens.splice(0).map(t => t?.value ?? t)));
        }
        // Otherwise, logic and groups need to be evaluated
        else {
            const expressions = [];
            
            // Go through every "or" branch in the expression
            for (let branch of Filter.#operations(tokens, "or")) {
                // Find all "and" joins in the branch
                const joins = Filter.#operations(branch, "and");
                // Find all complete expressions, and groups that need evaluating
                const expression = joins.filter(e => !e.some(t => t.type === "Group"));
                const groups = joins.filter(e => !expression.includes(e));
                
                // Go through every expression and check for nested attribute filters
                for (let e of expression.splice(0)) {
                    // Check if first token is negative for later evaluation
                    const negative = e[0].type === "Operator" && e[0].value.toLowerCase() === "not" ? e.shift() : undefined;
                    // Extract expression parts and derive object path
                    const [path, comparator, value] = e;
                    
                    // If none of the path parts have multi-value filters, put the expression back on the stack
                    if (path.value.split(pathSeparator).filter(p => p).every(t => t === multiValuedFilter.exec(t).slice(1).shift())) {
                        expression.push([negative, path, comparator, value]);
                    }
                    // Otherwise, delve into the path parts for complexities
                    else {
                        const parts = path.value.split(pathSeparator).filter(p => p);
                        // Store results and spent path parts
                        const results = [];
                        const spent = [];
                        
                        for (let part of parts) {
                            // Check for filters in the path part
                            const [, key = part, filter] = multiValuedFilter.exec(part) ?? [];
                            
                            // Store the spent path part
                            spent.push(key);
                            
                            // If we have a nested filter, handle it
                            if (filter !== undefined) {
                                let branches = Filter
                                    // Get any branches in the nested filter, parse them for joins, and properly wrap them
                                    .#operations(Filter.#tokenise(filter.substring(1, filter.length - 1)), "or")
                                    .map(b => Filter.#parse(b))
                                    .map(b => b.every(b => b.every(b => Array.isArray(b))) ? b.flat(1) : b)
                                    // Prefix any attribute paths with spent parts
                                    .map((branch) => branch.map(join => {
                                        const negative = (join.length === 4 || (join.length === 3 && comparators.includes(join[join.length-1].toLowerCase())) ? join.shift() : undefined);
                                        const [path, comparator, value] = join;
                                        
                                        return [negative?.toLowerCase?.(), `${spent.join(".")}.${path}`, comparator, value];
                                    }));
                                
                                if (!results.length) {
                                    // Extract results from the filter
                                    results.push(...branches);
                                } else {
                                    branches = branches.flat(1);
                                    
                                    // If only one branch, add it to existing results
                                    if (branches.length === 1) for (let result of results) result.push(...branches);
                                    // Otherwise, cross existing results with new branches
                                    else for (let result of results.splice(0)) {
                                        for (let branch of branches) results.push([...result, branch]);
                                    }
                                }
                            }
                            // No filter, but if we're at the end of the chain, join the last expression with the results
                            else if (parts.indexOf(part) === parts.length - 1) {
                                for (let result of results) result.push([negative?.value, spent.join("."), comparator?.value, value?.value]);
                            }
                        }
                        
                        // If there's only one result, it wasn't a very complex expression
                        if (results.length === 1) expression.push(...results.pop());
                        // Otherwise, turn the result back into a string and let groups handle it
                        else groups.push([{value: results.map(r => r.map(e => e.join(" ")).join(" and ")).join(" or ")}]);
                    }
                }
                
                // Evaluate the groups
                for (let group of groups.splice(0)) {
                    // Check for negative and extract the group token
                    const [negate, token = negate] = group;
                    // Parse the group token, negating and stripping double negatives if necessary
                    const tokens = Filter.#tokenise(token === negate ? token.value : `not ${token.value
                        .replaceAll(" and ", " and not ").replaceAll(" or ", " or not ")
                        .replaceAll(" and not not ", " and ").replaceAll(" or not not ", " or ")}`);
                    // Find all "or" branches in this group
                    const branches = Filter.#operations(tokens, "or");
                    
                    if (branches.length === 1) {
                        // No real branches, so it's probably a simple expression
                        expression.push(...Filter.#parse([...branches.pop()]));
                    } else {
                        // Cross all existing groups with this branch
                        for (let group of (groups.length ? groups.splice(0) : [[]])) {
                            // Taking into consideration any complete expressions in the block
                            for (let token of (expression.length ? expression : [[]])) {
                                for (let branch of branches) {
                                    groups.push([
                                        ...(token.length ? [token.map(t => t?.value ?? t)] : []),
                                        ...(group.length ? group : []),
                                        ...Filter.#parse(branch)
                                    ]);
                                }
                            }
                        }
                    }
                }
                
                // Consider each group its own expression
                if (groups.length) expressions.push(...groups);
                // Otherwise, collapse the expression for potential objectification
                else expressions.push(expression.map(e => e.map(t => t?.value ?? t)));
            }
            
            // Push all expressions to results, objectifying if necessary
            for (let expression of expressions) {
                results.push(...(Array.isArray(query) ? (expression.every(t => Array.isArray(t)) ? expression : [expression]) : [Filter.#objectify(expression)]));
            }
        }
        
        return results;
    }
}

// Deeply inspect a filter object to see if it represents attributes to be excluded from a coerced value
const isExcludedAttributesFilter = (v) => Array.isArray(v) ? v[0] === "np" : Object.values(v).every(isExcludedAttributesFilter);

/**
 * SCIM Schema Definition Type
 * @alias SCIMMY.Types.SchemaDefinition
 * @summary
 * *   Defines an underlying SCIM schema definition, containing the schema's URN namespace, friendly name, description, and collection of attributes that make up the schema.
 * *   Provides a way to ensure all properties of a resource conform to their attribute definitions, as well as enabling JSON expression of schemas for consumption by other SCIM clients or service providers.
 */
class SchemaDefinition {
    /**
     * Constructs an instance of a full SCIM schema definition
     * @param {String} name - friendly name of the SCIM schema
     * @param {String} id - URN namespace of the SCIM schema
     * @param {String} [description=""] - a human-readable description of the schema
     * @param {SCIMMY.Types.Attribute[]} [attributes=[]] - attributes that make up the schema
     * @property {String} name - friendly name of the SCIM schema
     * @property {String} id - URN namespace of the SCIM schema
     * @property {String} description - human-readable description of the schema
     * @property {SCIMMY.Types.Attribute[]} attributes - attributes that make up the schema
     */
    constructor(name, id, description = "", attributes = []) {
        // Make sure name, ID, and description values are supplied
        for (let [param, value] of [["name", name], ["id", id], ["description", description]]) {
            // Bail out if parameter value is empty
            if (value === undefined)
                throw new TypeError(`Required parameter '${param}' missing from SchemaDefinition instantiation`);
            if (typeof value !== "string" || (param !== "description" && !value.length))
                throw new TypeError(`Expected '${param}' to be a ${param !== "description" ? "non-empty string" : "string"} in SchemaDefinition instantiation`);
        }
        
        // Make sure ID is a valid SCIM schema URN namespace
        if (!id.startsWith("urn:ietf:params:scim:schemas:"))
            throw new TypeError(`Invalid SCIM schema URN namespace '${id}' in SchemaDefinition instantiation`);
        
        // Store the schema name, ID, and description
        this.name = name;
        this.id = id;
        this.description = description;
        
        // Add common attributes used by all schemas, then add the schema-specific attributes
        this.attributes = [
            new Attribute("reference", "schemas", {shadow: true, multiValued: true, referenceTypes: ["uri"]}),
            new Attribute("string", "id", {shadow: true, direction: "out", returned: "always", required: true, mutable: false, caseExact: true, uniqueness: "global"}),
            new Attribute("string", "externalId", {shadow: true, direction: "in", caseExact: true}),
            new Attribute("complex", "meta", {shadow: true, required: true, mutable: false}, [
                new Attribute("string", "resourceType", {required: true, mutable: false, caseExact: true}),
                new Attribute("dateTime", "created", {direction: "out", mutable: false}),
                new Attribute("dateTime", "lastModified", {direction: "out", mutable: false}),
                new Attribute("string", "location", {direction: "out", mutable: false}),
                new Attribute("string", "version", {direction: "out", mutable: false})
            ]),
            // Only include valid Attribute instances
            ...attributes.filter(attr => attr instanceof Attribute)
        ];
    }
    
    /**
     * Get the SCIM schema definition for consumption by clients
     * @param {String} [basepath=""] - the base path for the schema's meta.location property
     * @returns {Object} the schema definition for consumption by clients
     */
    describe(basepath = "") {
        return {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:Schema"],
            id: this.id, name: this.name, description: this.description,
            attributes: this.attributes.filter(a => (a instanceof Attribute && !a.config.shadow)),
            meta: {resourceType: "Schema", location: `${basepath}/${this.id}`}
        };
    }
    
    /**
     * Find an attribute or extension instance belonging to the schema definition by its name
     * @param {String} name - the name of the attribute to look for (namespaced or direct)
     * @returns {SCIMMY.Types.Attribute|SCIMMY.Types.SchemaDefinition} the Attribute or SchemaDefinition instance with matching name
     */
    attribute(name) {
        if (name.toLowerCase().startsWith("urn:")) {
            // Handle namespaced attributes by looking for a matching extension
            const extension = (this.attributes.find(a => a instanceof SchemaDefinition && name.toLowerCase().startsWith(a.id.toLowerCase()))
                ?? (name.toLowerCase().startsWith(`${this.id.toLowerCase()}:`) || name.toLowerCase() === this.id.toLowerCase() ? this : false));
            // Get the actual attribute name minus extension ID
            const attribute = (extension ? name.substring(extension.id.length+1) : "");
            
            // Bail out if no schema extension found with matching ID 
            if (!extension)
                throw new TypeError(`Schema definition '${this.id}' does not declare schema extension for namespaced target '${name}'`);
            
            // If the actual name is empty, return the extension, otherwise search the extension
            return (!attribute.length ? extension : extension.attribute(attribute));
        } else {
            // Break name into path parts in case of search for sub-attributes
            const path = name.split(".");
            const spent = [path.shift()];
            // Find the first attribute in the path
            let [target] = spent,
                attribute = this.attributes.find(a => a instanceof Attribute && a.name.toLowerCase() === target.toLowerCase());
            
            // If nothing was found, the attribute isn't declared by the schema definition
            if (attribute === undefined)
                throw new TypeError(`Schema definition '${this.id}' does not declare attribute '${target}'`);
            
            // Evaluate the rest of the path
            while (path.length > 0) {
                // If the attribute isn't complex, it can't declare sub-attributes
                if (attribute.type !== "complex")
                    throw new TypeError(`Attribute '${spent.join(".")}' of schema '${this.id}' is not of type 'complex' and does not define any subAttributes`);
                
                // Find the next attribute in the path
                target = path.shift();
                attribute = attribute.subAttributes.find(a => a instanceof Attribute && a.name.toLowerCase() === target.toLowerCase());
                
                // If nothing found, the attribute doesn't declare the target as a sub-attribute
                if (attribute === undefined)
                    throw new TypeError(`Attribute '${spent.join(".")}' of schema '${this.id}' does not declare subAttribute '${target}'`);
                
                // Add the found attribute to the spent path
                spent.push(target);
            }
            
            return attribute;
        }
    }
    
    /**
     * Extend a schema definition instance by mixing in other schemas or attributes
     * @param {SCIMMY.Types.SchemaDefinition|Array<SCIMMY.Types.Attribute>} extension - the schema extension or collection of attributes to register
     * @param {Boolean} [required=false] - if the extension is a schema, whether the extension is required
     * @returns {SCIMMY.Types.SchemaDefinition} this schema definition instance for chaining
     */
    extend(extension = [], required) {
        const attribs = this.attributes.map(a => a instanceof SchemaDefinition ? Object.getPrototypeOf(a) : a);
        const extensions = (Array.isArray(extension) ? extension : [extension]);
        
        // If the extension is a schema definition, add it to the schema definition instance
        if (extension instanceof SchemaDefinition) {
            // Make sure the extension isn't already included
            if (!attribs.includes(extension)) {
                // Make sure extension name is unique
                if (attribs.filter(a => a instanceof SchemaDefinition).some(d => d.id === extension.id))
                    throw new TypeError(`Schema definition '${this.id}' already declares extension '${extension.id}'`);
                
                // Proxy the schema definition for use in this schema definition
                this.attributes.push(Object.create(extension, {
                    // Store whether the extension is required
                    required: {value: required ?? extension.required ?? false},
                    // When queried, only return attributes that directly belong to the schema definition
                    attributes: {get: () => extension.attributes.filter(a => a instanceof Attribute && !a?.config?.shadow)}
                }));
            }
            
            // Go through the schema extension definition and directly register any nested schema definitions
            const surplusSchemas = extension.attributes.filter(e => e instanceof SchemaDefinition);
            for (let definition of surplusSchemas) this.extend(definition);
        }
        // If every extension is an attribute instance, add them to the schema definition
        else if (extensions.every(e => e instanceof Attribute)) {
            // Go through all extension attributes to register
            for (let attribute of extensions) {
                // Make sure the attribute isn't already included
                if (!attribs.includes(attribute)) {
                    // Make sure attribute name is unique
                    if (this.attributes.some(a => a.name === attribute.name))
                        throw new TypeError(`Schema definition '${this.id}' already declares attribute '${attribute.name}'`);
                    
                    this.attributes.push(attribute);
                }
            }
        }
        // If something other than a schema definition or attribute is supplied, bail out!
        else throw new TypeError("Expected 'extension' to be a SchemaDefinition or collection of Attribute instances");
        
        return this;
    }
    
    /**
     * Remove an attribute, extension schema, or subAttribute from a schema or attribute definition
     * @param {...String} target - the name, or names, of attributes to remove from the schema definition
     * @param {...SCIMMY.Types.Attribute} target - the attribute instance, or instances, to remove from the schema definition
     * @param {...SCIMMY.Types.SchemaDefinition} target - the extension schema, or schemas, to remove from the schema definition
     * @returns {SCIMMY.Types.SchemaDefinition} this schema definition instance for chaining
     */
    truncate(...target) {
        const targets = target.flat();
        
        for (let t of targets) {
            if (this.attributes.includes(t)) {
                // Remove a found attribute from the schema definition
                const index = this.attributes.indexOf(t);
                if (index >= 0) this.attributes.splice(index, 1);
            } else if (typeof t === "string") {
                // Look for the target attribute to remove, which throws a TypeError if not found
                const target = this.attribute(t);
                
                // Either try truncate again with the target attribute
                if (!t.includes(".")) this.truncate(target);
                // Or find the containing attribute and truncate it from there
                else this.attribute(t.split(".").slice(0, -1).join(".")).truncate(target);
            } else if (t instanceof SchemaDefinition) {
                // Look for the target schema extension to remove, which throws a TypeError if not found
                const target = this.attribute(t.id);
                // Remove a found schema extension from the schema definition
                const index = this.attributes.indexOf(target);
                if (index >= 0) this.attributes.splice(index, 1);
            }
        }
        
        return this;
    }
    
    /**
     * Coerce a given value by making sure it conforms to all schema attributes' characteristics
     * @param {Object} data - value to coerce and confirm conformity of properties to schema attributes' characteristics
     * @param {String} [direction="both"] - whether to check for inbound, outbound, or bidirectional attributes
     * @param {String} [basepath] - the URI representing the resource type's location
     * @param {SCIMMY.Types.Filter} [filters] - the attribute filters to apply to the coerced value
     * @returns {Object} the coerced value, conforming to all schema attributes' characteristics
     */
    coerce(data, direction = "both", basepath, filters) {
        // Make sure there is data to coerce...
        if (data === undefined || Array.isArray(data) || Object(data) !== data)
            throw new TypeError("Expected 'data' parameter to be an object in SchemaDefinition instance");
        
        // Get the filter and coercion target ready
        const filter = (filters ?? []).slice(0).shift();
        const target = {};
        // Compile a list of schema IDs to include in the resource
        const schemas = [...new Set([
            this.id,
            ...(this.attributes.filter(a => a instanceof SchemaDefinition).map(s => s.id)
                .filter(id => !!data[id] || Object.keys(data).some(d => d.startsWith(`${id}:`)))),
            ...(Array.isArray(data.schemas) ? data.schemas : [])
        ])];
        // Add schema IDs, and schema's name as resource type to meta attribute
        const source = {
            // Cast all key names to lower case to eliminate case sensitivity....
            ...(Object.keys(data).reduce((res, key) => Object.assign(res, {[key.toLowerCase()]: data[key]}), {})),
            schemas, meta: {
                ...(data?.meta ?? {}), resourceType: this.name,
                ...(typeof basepath === "string" ? {location: `${basepath}${!!data.id ? `/${data.id}` : ""}`} : {})
            }
        };
        
        // Go through all attributes and coerce them
        for (let attribute of this.attributes) {
            if (attribute instanceof Attribute) {
                // Evaluate the coerced value
                const {name} = attribute;
                const value = attribute.coerce(source[name.toLowerCase()], direction);
                
                // If it's defined, add it to the target
                if (value !== undefined) target[name] = value;
            } else if (attribute instanceof SchemaDefinition) {
                const {id: name, required} = attribute;
                // Get any values from the source that begin with the extension ID
                const namespacedValues = Object.keys(source).filter(k => k.startsWith(`${name.toLowerCase()}:`))
                    // Get the actual attribute name and value
                    .map(k => [k.replace(`${name.toLowerCase()}:`, ""), source[k]])
                    .reduce((res, [name, value]) => {
                        // Get attribute path parts and actual value
                        const parts = name.toLowerCase().split(".");
                        const target = {[parts.pop()]: value};
                        let parent = res;
                        
                        // Traverse as deep as necessary
                        while (parts.length > 0) {
                            const path = parts.shift();
                            parent = (parent[path] = parent[path] ?? {});
                        }
                        
                        // Assign and return
                        Object.assign(parent, target);
                        return res;
                    }, {});
                // Mix the namespaced attribute values in with the extension value
                const mixedSource = [source[name.toLowerCase()] ?? {}, namespacedValues ?? {}].reduce(function merge(t, s) {
                    // Cast all key names to lower case to eliminate case sensitivity....
                    t = (Object.keys(t).reduce((res, key) => Object.assign(res, {[key.toLowerCase()]: t[key]}), {}));
                    
                    // Merge all properties from s into t, joining arrays and objects
                    for (let skey of Object.keys(s)) {
                        const tkey = skey.toLowerCase();
                        
                        // If source is an array...
                        if (Array.isArray(s[skey])) {
                            // ...and target is an array, merge them...
                            if (Array.isArray(t[tkey])) t[tkey].push(...s[skey]);
                            // ...otherwise, make target an array
                            else t[tkey] = [...s[skey]];
                        }
                        // If source is a primitive value, copy it
                        else if (s[skey] !== Object(s[skey])) t[tkey] = s[skey];
                        // Finally, if source is neither an array nor primitive, merge it
                        else t[tkey] = merge(t[tkey] ?? {}, s[skey]);
                    }
                    
                    return t;
                }, {});
                
                // Attempt to coerce the schema extension
                if (!!required && !Object.keys(mixedSource).length) {
                    throw new TypeError(`Missing values for required schema extension '${name}'`);
                } else if (required || Object.keys(mixedSource).length) {
                    try {
                        // Coerce the mixed value, using only namespaced attributes for this extension
                        target[name] = attribute.coerce(mixedSource, direction, basepath, [Object.keys(filter ?? {})
                            .filter(k => k.startsWith(`${name}:`))
                            .reduce((res, key) => Object.assign(res, {[key.replace(`${name}:`, "")]: filter[key]}), {})
                        ]);
                    } catch (ex) {
                        // Rethrow exception with added context
                        ex.message += ` in schema extension '${name}'`;
                        throw ex;
                    }
                }
            }
        }
        
        return SchemaDefinition.#filter(this, filter && {...filter}, target);
    }
    
    /**
     * Filter out desired or undesired attributes from a coerced schema value
     * @param {SCIMMY.Types.SchemaDefinition} definition - the schema definition requesting the filtering
     * @param {Object} [filter] - the filter to apply to the coerced value
     * @param {Object|Object[]} [data={}] - the data to filter attributes from
     * @param {String} [prefix=""] - prefix to use when filtering on complex value subAttributes
     * @returns {Object} the coerced value with desired or undesired attributes filtered out
     * @private
     */
    static #filter(definition, filter, data = {}, prefix = "") {
        // If there's no filter, just return the data
        if (filter === undefined || !Object.keys(filter).length)
            return data;
        // If the data is a set, only get values that match the filter
        else if (Array.isArray(data))
            return data.map(data => SchemaDefinition.#filter(definition, {...filter}, data, prefix)).filter(v => Object.keys(v).length);
        // Otherwise, filter the data!
        else {
            // Prepare resultant value storage
            const target = {};
            const inclusions = [];
            const exclusions = [];
            
            for (let key in filter) try {
                // Find the attribute or extension definition using the filter key
                const attribute = definition.attribute(prefix ? `${prefix}.${key}` : key);
                
                // Only be concerned with filter expressions for attributes or extensions directly for now
                if (Array.isArray(filter[key]) && (attribute instanceof SchemaDefinition || !key.startsWith("urn:"))) {
                    // Get real name and handle potentially overlapping filter conditions
                    const name = (attribute instanceof SchemaDefinition ? attribute.id : attribute.name);
                    const condition = filter[key].map(c => Array.isArray(c) ? c[0] : c);
                    
                    // Mark the positively filtered property as included in the result
                    if (condition.includes("pr"))
                        inclusions.push(name);
                    // Mark the negatively filtered property as excluded from the result
                    else if (condition.includes("np"))
                        exclusions.push(name);
                }
            } catch {
                // If we've reached here, the filter refers to an unknown attribute and should be ignored
            }
            
            // If there were no explicit inclusions, and all filter expressions were negative...
            if (!inclusions.length && isExcludedAttributesFilter(filter)) {
                // ...go through all subAttributes, or extension attributes...
                for (let attribute of (prefix ? definition.attribute(prefix).subAttributes : definition.attributes)) {
                    // ...and assume they should be included, if they weren't explicitly excluded
                    if (attribute instanceof Attribute && !exclusions.includes(attribute.name)) inclusions.push(attribute.name);
                }
            }
            
            // Go through every value in the data and filter it
            for (let key in data) {
                // Get the matching attribute or extension definition for the key
                const attribute = definition.attribute(prefix ? `${prefix}.${key}` : key) ?? {};
                
                if (attribute instanceof SchemaDefinition) {
                    // If there is data in a namespaced key and no namespace filter, or there's an explicit inclusion filter...
                    if ((Object.keys(data[key]).length && !Array.isArray(filter[key])) || (key in filter && inclusions.includes(key)))
                        // ...include the extension data
                        target[key] = data[key];
                } else {
                    // Get some relevant config values from the attribute
                    const {name, type, config: {returned, multiValued} = {}} = attribute;
                    
                    // If the attribute is always returned, add it to the result
                    if (returned === "always") target[key] = data[key];
                    // Otherwise, if the attribute was requested and ~can~ be returned, process it
                    else if (![false, "never"].includes(returned)) {
                        // If there's a filter for a complex attribute, evaluate it
                        if (key in filter && !Array.isArray(filter[key]) && type === "complex") {
                            const value = SchemaDefinition.#filter(definition, filter[key], data[key], key);
                            
                            // Only set the value if it isn't empty
                            if ((!multiValued && value !== undefined) || (Array.isArray(value) && value.length))
                                target[key] = value;
                        }
                        // Otherwise, if there was a simple presence filter for the attribute, assign it
                        else if (inclusions.includes(name) && data[key] !== undefined) {
                            target[key] = data[key];
                        }
                    }
                }
            }
            
            return target;
        }
    }
}

/**
 * Deeply check whether a targeted object has any properties with actual values
 * @param {Object} target - object to deeply check for values
 * @returns {Boolean} whether the target object, or any of its object properties, have a value other than undefined
 * @private
 */
const hasActualValues = (target) => (Object.values(target).some((v) => typeof v === "object" ? hasActualValues(v) : v !== undefined));

/**
 * Define the "toJSON" property for the given target
 * @param {Object} target - the object to define the "toJSON" property on
 * @param {SchemaDefinition} definition - the schema definition associated with the target
 * @param {Object} resource - the underlying resource associated with the target
 * @returns {Object} the original target object, with the "toJSON" property defined
 * @private
 */
const defineToJSONProperty = (target, definition, resource) => Object.defineProperty(target, "toJSON", {
    value: () =>  Object.entries(resource)
        .filter(([name]) => ![false, "never"].includes(definition.attribute(name)?.config?.returned))
        .filter(([name, value]) => value !== undefined && (typeof value !== "object" || hasActualValues(value)))
        .reduce((res, [name, value]) => Object.assign(res, {[name]: value}), {})
});


/**
 * SCIM Schema Type
 * @alias SCIMMY.Types.Schema
 * @summary
 * *   Extendable class which provides the ability to construct resource instances with automated validation of conformity to a resource's schema definition.
 * *   Once instantiated, any modifications will also be validated against the attached schema definition's matching attribute configuration (e.g. for mutability or canonical values).
 */
class Schema {
    /**
     * Retrieves a schema's definition instance
     * @type {SCIMMY.Types.SchemaDefinition}
     * @abstract
     */
    static get definition() {
        throw new TypeError("Method 'get' for property 'definition' must be implemented by subclass");
    }
    
    /**
     * Stores a schema's definition instance
     * @type {SCIMMY.Types.SchemaDefinition}
     * @private
     * @abstract
     */
    static #definition;
    
    /**
     * Extend a schema by mixing in other schemas or attributes
     * @param {SCIMMY.Types.Schema|Array<SCIMMY.Types.Attribute>} extension - the schema extensions or collection of attributes to register
     * @param {Boolean} [required=false] - if the extension is a schema, whether the extension is required
     */
    static extend(extension, required = false) {
        if (!(extension instanceof SchemaDefinition) && !(extension?.prototype instanceof Schema)
            && !(Array.isArray(extension) ? extension : [extension]).every(e => e instanceof Attribute))
            throw new TypeError("Expected 'extension' to be a Schema class, SchemaDefinition instance, or collection of Attribute instances");
        
        this.definition.extend((extension.prototype instanceof Schema ? extension.definition : extension), required);
    }
    
    /**
     * Remove an attribute, schema extension, or subAttribute from the schema's definition
     * @param {SCIMMY.Types.Schema|String|SCIMMY.Types.Attribute|Array<String|SCIMMY.Types.Attribute>} attributes - the child attributes to remove from the schema definition
     */
    static truncate(attributes) {
        this.definition.truncate(attributes?.prototype instanceof Schema ? attributes.definition : attributes);
    }
    
    /**
     * Construct a resource instance after verifying schema compatibility
     * @param {Object} data - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     */
    constructor(data = {}, direction) {
        const {schemas = []} = data;
        // Create internally scoped storage object
        const resource = {};
        // Source attributes and extensions from schema definition
        const {definition} = this.constructor;
        const attributes = definition.attributes.filter(a => a instanceof Attribute);
        const extensions = definition.attributes.filter(a => a instanceof SchemaDefinition);
        
        // If schemas attribute is specified, make sure all required schema IDs are present
        if (Array.isArray(schemas) && schemas.length) {
            // Check for this schema definition's ID
            if (!schemas.includes(definition.id))
                throw new SCIMError(400, "invalidSyntax", "The request body supplied a schema type that is incompatible with this resource");
            
            // Check for required schema extension IDs
            for (let extension of extensions) {
                if (extension.required && !schemas.includes(extension.id)) {
                    throw new SCIMError(400, "invalidValue", `The request body is missing schema extension '${extension.id}' required by this resource type`);
                }
            }
        }
        
        // Save the directionality of this instance to a symbol for use elsewhere
        Object.defineProperty(this, Symbol.for("direction"), {value: direction});
        // Set "toJSON" method on self so attributes can be filtered
        defineToJSONProperty(this, definition, resource);
        
        // Predefine getters and setters for all possible attributes
        for (let attribute of attributes) Object.defineProperties(this, {
            // Because why bother with case-sensitivity in a JSON-based standard?
            // See: RFC7643§2.1 (https://datatracker.ietf.org/doc/html/rfc7643#section-2.1)
            [attribute.name.toLowerCase()]: {
                get: () => (this[attribute.name]),
                set: (value) => (this[attribute.name] = value)
            },
            // Now set the handles for the actual name
            // Overrides above if attribute.name is already all lower case
            [attribute.name]: {
                enumerable: true,
                // Get and set the value from the internally scoped object
                get: () => (resource[attribute.name]),
                set: (value) => {
                    const {name, config: {mutable}} = attribute;
                    
                    // Check for mutability of attribute before setting the value
                    if (mutable !== true && this[name] !== undefined && this[name] !== value)
                        throw new SCIMError(400, "mutability", `Attribute '${name}' already defined and is not mutable`);
                    
                    try {
                        // Validate the supplied value through attribute coercion
                        return (resource[name] = attribute.coerce(value, direction));
                    } catch (ex) {
                        // Rethrow attribute coercion exceptions as SCIM errors
                        throw new SCIMError(400, "invalidValue", ex.message);
                    }
                }
            }
        });
        
        // Predefine getters and setters for all schema extensions
        for (let extension of extensions) Object.defineProperties(this, {
            // Same as above, who needs case sensitivity?
            [extension.id.toLowerCase()]: {
                get: () => (this[extension.id]),
                set: (value) => (this[extension.id] = value)
            },
            // Set the handles for the actual extension ID
            [extension.id]: {
                enumerable: true,
                // Get and set the value from the internally scoped object
                get: () => {
                    return resource[extension.id];
                },
                set: (value) => {
                    try {
                        // Validate the supplied value through schema extension coercion
                        resource[extension.id] = extension.coerce(value, direction);
                        
                        // Return the value with JSON stringifier attached, marked as 
                        defineToJSONProperty(resource[extension.id], extension, resource[extension.id]);
                        return Object.assign(resource[extension.id], value);
                    } catch (ex) {
                        // Rethrow attribute coercion exceptions as SCIM errors
                        throw new SCIMError(400, "invalidValue", ex.message);
                    }
                }
            },
            // Predefine namespaced getters and setters for schema extension attributes
            ...extension.attributes.reduce((() => {
                const getExtensionReducer = (path = "") => (definitions, attribute) => Object.assign(definitions, {
                    // Lower-case getter/setter aliases to work around case sensitivity, as above
                    [`${extension.id}:${path}${attribute.name}`.toLowerCase()]: {
                        get: () => (this[`${extension.id}:${path}${attribute.name}`]),
                        set: (value) => (this[`${extension.id}:${path}${attribute.name}`] = value)
                    },
                    // Proper-case namespaced extension attributes
                    [`${extension.id}:${path}${attribute.name}`]: {
                        get: () => {
                            // Get the underlying nested path of the attribute
                            const paths = path.replace(/([.])$/, "").split(".").filter(p => !!p);
                            let target = this[extension.id];
                            
                            // Go through the attribute path on the extension to find the actual target
                            while (paths.length) target = target?.[paths.shift()];
                            
                            return target?.[attribute.name];
                        },
                        // Trigger setter for the actual schema extension property
                        set: (value) => {
                            // Get the underlying nested path of the attribute, and a copy of the data to set
                            const paths = path.replace(/([.])$/, "").split(".").filter(p => !!p);
                            let target = {...this[extension.id]}, data = target;
                            
                            // Go through the attribute path on the extension...
                            while (paths.length) {
                                const path = paths.shift();
                                
                                // ...and set any missing container paths along the way
                                target = target[path] = {...(target?.[path] ?? {})};
                            }
                            
                            // Set the actual value
                            target[attribute.name] = value;
                            
                            // Then assign it back to the extension for coercion
                            return (this[extension.id] = Object.assign(this[extension.id] ?? {}, data));
                        }
                    },
                    // Go through the process again for subAttributes
                    ...(attribute.subAttributes ? attribute.subAttributes.reduce(getExtensionReducer(`${path}${attribute.name}.`), {}) : {})
                });
                
                return getExtensionReducer();
            })(), {})
        });
        
        // Prevent attributes from being added or removed
        Object.freeze(this);
    }
}

/**
 * SCIM Resource Type
 * @alias SCIMMY.Types.Resource
 * @summary
 * *   Extendable class representing a SCIM Resource Type, which acts as an interface between a SCIM resource type schema, and an app's internal data model.
 * *   Handles incoming requests to read/write/delete a resource, parses any attribute, filter, and sort parameters of a request, and formats responses for consumption by other SCIM clients and service providers.
 */
class Resource {
    /**
     * Retrieves a resource's endpoint relative to the service provider's base URL
     * @type {String}
     * @abstract
     */
    static get endpoint() {
        throw new TypeError(`Method 'get' for property 'endpoint' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Base path for resource's location
     * @type {String}
     * @private
     * @abstract
     */
    static #basepath;
    /**
     * Sets or retrieves the base path for resolution of a resource's location
     * @param {String} [path] - the path to use as the base of a resource's location
     * @returns {SCIMMY.Types.Resource|String} this resource type class for chaining if path is a string, or the resource's basepath
     * @abstract
     */
    static basepath(path) {
        throw new TypeError(`Method 'basepath' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Retrieves a resource's core schema
     * @type {typeof SCIMMY.Types.Schema}
     * @abstract
     */
    static get schema() {
        throw new TypeError(`Method 'get' for property 'schema' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Register an extension to the resource's core schema
     * @param {typeof SCIMMY.Types.Schema} extension - the schema extension to register
     * @param {Boolean} [required] - whether the extension is required
     * @returns {SCIMMY.Types.Resource|void} this resource type implementation for chaining
     */
    static extend(extension, required) {
        this.schema.extend(extension, required);
        
        return this;
    }
    
    /**
     * Handler for ingress of a resource
     * @callback SCIMMY.Types.Resource~IngressHandler
     * @param {SCIMMY.Types.Resource} resource - the resource performing the ingress
     * @param {SCIMMY.Types.Schema} instance - an instance of the resource type that conforms to the resource's schema
     * @param {*} [ctx] - external context in which the handler has been called
     * @returns {Object} an object to be used to create a new schema instance, whose properties conform to the resource type's schema
     * @example
     * // Handle a request to create a new resource, or update an existing resource
     * async function ingress(resource, instance, ctx) {
     *     try {
     *         // Call some external controller to update the resource in your database...
     *         if (resource.id) return await ResourceController.update(resource.id, instance, ctx);
     *         // ...or if a resource ID wasn't specified, to create the resource in your database
     *         else return await ResourceController.create(instance, ctx);
     *     } catch (ex) {
     *         switch (ex.message) {
     *             // Be sure to throw a SCIM 404 error if the specific resource wasn't found...
     *             case "Not Found":
     *                 throw new SCIMMY.Types.Error(404, null, `Resource ${resource.id} not found`);
     *             // ...or a SCIM 409 error if a database unique constraint wasn't met...
     *             case "Not Unique":
     *                 throw new SCIMMY.Types.Error(409, "uniqueness", "Primary email address is not unique");
     *             // ...and also rethrow any other exceptions as SCIM 500 errors
     *             default:
     *                 throw new SCIMMY.Types.Error(500, null, ex.message);
     *         }
     *     }
     * }
     */
    
    /**
     * Ingress handler method storage property
     * @type {SCIMMY.Types.Resource~IngressHandler}
     * @private
     * @abstract
     */
    static #ingress;
    /**
     * Sets the method to be called to consume a resource on create
     * @param {SCIMMY.Types.Resource~IngressHandler} handler - function to invoke to consume a resource on create
     * @returns {SCIMMY.Types.Resource} this resource type class for chaining
     * @abstract
     */
    static ingress(handler) {
        throw new TypeError(`Method 'ingress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Handler for egress of a resource
     * @callback SCIMMY.Types.Resource~EgressHandler
     * @param {SCIMMY.Types.Resource} resource - the resource performing the egress
     * @param {*} [ctx] - external context in which the handler has been called
     * @returns {Object} an object, to be used to create a new schema instance, whose properties conform to the resource type's schema
     * @returns {Object[]} an array of objects, to be used to create new schema instances, whose properties conform to the resource type's schema
     * @example
     * // Handle a request to retrieve a specific resource, or a list of resources
     * async function egress(resource, ctx) {
     *     try {
     *         // Call some external controller to retrieve the specified resource from your database...
     *         if (resource.id) return await ResourceController.findOne(resource.id, ctx);
     *         // ...or if a resource ID wasn't specified, to retrieve a list of matching resources from your database
     *         else return await ResourceController.findMany(resource.filter, resource.constraints, ctx);
     *     } catch (ex) {
     *         switch (ex.message) {
     *             // Be sure to throw a SCIM 404 error if the specific resource wasn't found...
     *             case "Not Found":
     *                 throw new SCIMMY.Types.Error(404, null, `Resource ${resource.id} not found`);
     *             // ...and also rethrow any other exceptions as SCIM 500 errors
     *             default:
     *                 throw new SCIMMY.Types.Error(500, null, ex.message);
     *         }
     *     }
     * }
     */
    
    /**
     * Egress handler method storage property
     * @type {SCIMMY.Types.Resource~EgressHandler}
     * @private
     * @abstract
     */
    static #egress;
    /**
     * Sets the method to be called to retrieve a resource on read
     * @param {SCIMMY.Types.Resource~EgressHandler} handler - function to invoke to retrieve a resource on read
     * @returns {SCIMMY.Types.Resource} this resource type class for chaining
     * @abstract
     */
    static egress(handler) {
        throw new TypeError(`Method 'egress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Handler for degress of a resource
     * @callback SCIMMY.Types.Resource~DegressHandler
     * @param {SCIMMY.Types.Resource} resource - the resource performing the degress
     * @param {*} [ctx] - external context in which the handler has been called
     * @example
     * // Handle a request to delete a specific resource
     * async function degress(resource, ctx) {
     *     try {
     *         // Call some external controller to delete the resource from your database
     *         await ResourceController.delete(resource.id, ctx);
     *     } catch (ex) {
     *         switch (ex.message) {
     *             // Be sure to throw a SCIM 404 error if the specific resource wasn't found...
     *             case "Not Found":
     *                 throw new SCIMMY.Types.Error(404, null, `Resource ${resource.id} not found`);
     *             // ...and also rethrow any other exceptions as SCIM 500 errors
     *             default:
     *                 throw new SCIMMY.Types.Error(500, null, ex.message);
     *         }
     *     }
     * }
     */
    
    /**
     * Degress handler method storage property
     * @type {SCIMMY.Types.Resource~DegressHandler}
     * @private
     * @abstract
     */
    static #degress;
    /**
     * Sets the method to be called to dispose of a resource on delete
     * @param {SCIMMY.Types.Resource~DegressHandler} handler - function to invoke to dispose of a resource on delete
     * @returns {SCIMMY.Types.Resource} this resource type class for chaining
     * @abstract
     */
    static degress(handler) {
        throw new TypeError(`Method 'degress' not implemented by resource '${this.name}'`);
    }
    
    /**
     * Describe this resource type implementation
     * @returns {SCIMMY.Types.Resource~ResourceType} object describing the resource type implementation 
     */
    static describe() {
        // Find all schema definitions that extend this resource's definition...
        const findSchemaDefinitions = (d) => d.attributes.filter(a => a instanceof SchemaDefinition)
            .map(e => ([e, ...findSchemaDefinitions(e)])).flat(Infinity);
        // ...so they can be included in the returned description
        const schemaExtensions = [...new Set(findSchemaDefinitions(this.schema.definition))]
            .map(({id: schema, required}) => ({schema, required}));
        
        /**
         * @typedef {Object} SCIMMY.Types.Resource~ResourceType
         * @description An object describing a resource type's implementation
         * @property {String} id - URN namespace of the resource's SCIM schema definition
         * @property {String} name - friendly name of the resource's SCIM schema definition
         * @property {String} endpoint - resource type's endpoint, relative to a service provider's base URL
         * @property {String} description - human-readable description of the resource
         * @property {Object} [schemaExtensions] - schema extensions that augment the resource
         * @property {String} schemaExtensions[].schema - URN namespace of the schema extension that augments the resource
         * @property {Boolean} schemaExtensions[].required - whether resource instances must include the schema extension
         */
        return {
            id: this.schema.definition.name, name: this.schema.definition.name, endpoint: this.endpoint,
            description: this.schema.definition.description, schema: this.schema.definition.id,
            ...(schemaExtensions.length ? {schemaExtensions} : {})
        };
    }
    
    /**
     * Instantiate a new SCIM resource and parse any supplied parameters
     * @param {String} [id] - the ID of the requested resource
     * @param {Object} [config={}] - the parameters of the resource instance request
     * @param {String} [config.filter] - the filter to be applied on ingress/egress by implementing resource
     * @param {String} [config.excludedAttributes] - the comma-separated string list of attributes or filters to exclude on egress
     * @param {String} [config.attributes] - the comma-separated string list of attributes or filters to include on egress
     * @param {String} [config.sortBy] - the attribute retrieved resources should be sorted by
     * @param {String} [config.sortOrder] - the direction retrieved resources should be sorted in
     * @param {Number} [config.startIndex] - offset index that retrieved resources should start from
     * @param {Number} [config.count] - maximum number of retrieved resources that should be returned in one operation
     * @property {String} [id] - ID of the resource instance being targeted
     * @property {SCIMMY.Types.Filter} [filter] - filter parsed from the supplied config
     * @property {SCIMMY.Types.Filter} [attributes] - attributes or excluded attributes parsed from the supplied config
     * @property {Object} [constraints] - sort and pagination properties parsed from the supplied config
     * @property {String} [constraints.sortBy] - the attribute retrieved resources should be sorted by
     * @property {String} [constraints.sortOrder] - the direction retrieved resources should be sorted in
     * @property {Number} [constraints.startIndex] - offset index that retrieved resources should start from
     * @property {Number} [constraints.count] - maximum number of retrieved resources that should be returned in one operation
     */
    constructor(id, config) {
        // Unwrap params from arguments
        const params = (typeof id === "string" || config !== undefined ? config : id) ?? {};
        
        // Make sure params is a valid object
        if (Object(params) !== params || Array.isArray(params))
            throw new SCIMError(400, "invalidSyntax", "Expected query parameters to be a single complex object value");
        // Make sure ID is valid
        if ((id !== undefined && Object(id) !== params) && (String(id) !== id || !id.length))
            throw new SCIMError(400, "invalidSyntax", "Expected 'id' parameter to be a non-empty string");

        let definition;
        try {
            definition = this.constructor.schema?.definition;
        } catch(e) {
            // Skip definition if the schema doesn't define it (e.g. in some of the test code)
        }
        
        // Handle case where ID is supplied as first argument
        if (typeof id === "string") {
            // Store the ID and create a filter to match the ID 
            this.id = id;
            this.filter = new Filter(`id eq "${this.id}"`, definition);
        }
        // Parse the filter if it exists, and wasn't set by ID above
        else if ("filter" in params) {
            // Bail out if filter isn't a non-empty string
            if (typeof params.filter !== "string" || !params.filter.trim().length)
                throw new SCIMError(400, "invalidFilter", "Expected filter to be a non-empty string");
            
            this.filter = new Filter(params.filter, definition);
        }
        
        // Handle excluded attributes
        if ("excludedAttributes" in params) {
            // Bail out if excludedAttributes isn't a non-empty string
            if (typeof params.excludedAttributes !== "string" || !params.excludedAttributes.trim().length)
                throw new SCIMError(400, "invalidFilter", "Expected excludedAttributes to be a comma-separated list string");
            
            // Convert excludedAttributes into a filter string, and instantiate a new filter
            this.attributes = new Filter(params.excludedAttributes.split(",").map(a => `${a} np`).join(" and "), definition);
        }
        
        // Handle attributes (overwrites excluded attributes if previously defined)
        if ("attributes" in params) {
            // Bail out if attributes isn't a non-empty string
            if (typeof params.attributes !== "string" || !params.attributes.trim().length)
                throw new SCIMError(400, "invalidFilter", "Expected attributes to be a comma-separated list string");
            
            // Convert attributes into a filter string, and instantiate a new filter
            this.attributes = new Filter(params.attributes.split(",").map(a => `${a} pr`).join(" and "), definition);
        }
        
        // Handle sort and pagination parameters
        if (["sortBy", "sortOrder", "startIndex", "count"].some(k => k in params)) {
            const {sortBy, sortOrder, startIndex, count} = params;
            
            this.constraints = {
                ...(typeof sortBy === "string" ? {sortBy} : {}),
                ...(["ascending", "descending"].includes(sortOrder) ? {sortOrder} : {}),
                ...(!Number.isNaN(Number(startIndex)) && Number.isInteger(startIndex) ? {startIndex} : {}),
                ...(!Number.isNaN(Number(count)) && Number.isInteger(count) ? {count} : {})
            };
        }
    }
    
    /**
     * Calls resource's egress method for data retrieval.
     * Wraps the results in valid SCIM list response or single resource syntax.
     * @param {*} [ctx] - any additional context information to pass to the egress handler
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Types.Schema}
     * *   A collection of resources matching instance's configured filter, if no ID was supplied to resource constructor.
     * *   The specifically requested resource instance, if an ID was supplied to resource constructor.
     * @abstract
     */
    read(ctx) {
        throw new TypeError(`Method 'read' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Calls resource's ingress method for consumption after unwrapping the SCIM resource
     * @param {Object} instance - the raw resource type instance for consumption by ingress method
     * @param {*} [ctx] - any additional context information to pass to the ingress handler
     * @returns {SCIMMY.Types.Schema} the consumed resource type instance
     * @abstract
     */
    write(instance, ctx) {
        throw new TypeError(`Method 'write' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Retrieves resources via egress method, and applies specified patch operations.
     * Emits patched resources for consumption with resource's ingress method.
     * @param {Object} message - the PatchOp message to apply to the received resource
     * @param {*} [ctx] - any additional context information to pass to the ingress/egress handlers
     * @returns {SCIMMY.Types.Schema} the resource type instance after patching and consumption by ingress method
     * @abstract
     */
    patch(message, ctx) {
        throw new TypeError(`Method 'patch' not implemented by resource '${this.constructor.name}'`);
    }
    
    /**
     * Calls resource's degress method for disposal of the SCIM resource
     * @param {*} [ctx] - any additional context information to pass to the degress handler
     * @abstract
     */
    dispose(ctx) {
        throw new TypeError(`Method 'dispose' not implemented by resource '${this.constructor.name}'`);
    }
}

/**
 * SCIMMY Types Container Class
 * @namespace SCIMMY.Types
 * @description
 * SCIMMY provides a singleton class, `SCIMMY.Types`, that exposes the building blocks used to create SCIM schemas and resource types, and handle SCIM schema and protocol errors.
 * These can be used to construct custom resource types and handle errors encountered when invoking supplied read/write/delete handlers of built-in resources.
 */
class Types {
    static Attribute = Attribute;
    static SchemaDefinition = SchemaDefinition;
    static Schema = Schema;
    static Resource = Resource;
    static Filter = Filter;
    static Error = SCIMError;
}

exports.Types = Types;
