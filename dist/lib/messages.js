import { Types } from './types.js';
import { Resources } from './resources.js';

/**
 * HTTP response status codes specified by RFC7644§3.12
 * @enum
 * @inner
 * @constant
 * @type {Number[]}
 * @alias ValidStatusTypes
 * @memberOf SCIMMY.Messages.Error
 * @default
 */
const validStatusCodes = [307, 308, 400, 401, 403, 404, 409, 412, 413, 500, 501];

/**
 * SCIM detail error keywords specified by RFC7644§3.12
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidScimTypes
 * @memberOf SCIMMY.Messages.Error
 * @default
 */
const validScimTypes = [
    "uniqueness", "tooMany", "invalidFilter", "mutability", "invalidSyntax",
    "invalidPath", "noTarget", "invalidValue", "invalidVers", "sensitive"
];

// Map of valid scimType codes for each HTTP status code (where applicable)
const validCodeTypes = {400: validScimTypes.slice(2), 409: ["uniqueness"], 413: ["tooMany"]};

/**
 * SCIM Error Message
 * @alias SCIMMY.Messages.Error
 * @summary
 * *   Formats exceptions to conform to the [HTTP Status and Error Response Handling](https://datatracker.ietf.org/doc/html/rfc7644#section-3.12) section of the SCIM protocol, ensuring HTTP status codes and scimType error detail keyword pairs are valid.
 * *   When used to parse service provider responses, throws a new instance of `SCIMMY.Types.Error` with details sourced from the message.
 */
class ErrorMessage extends Error {
    /**
     * SCIM Error Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:Error";
    
    /**
     * Instantiate a new SCIM Error Message with relevant details
     * @param {Object} [ex={}] - the initiating exception to parse into a SCIM error message
     * @param {SCIMMY.Messages.Error~ValidStatusTypes} ex.status=500 - HTTP status code to be sent with the error
     * @param {SCIMMY.Messages.Error~ValidScimTypes} [ex.scimType] - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @param {String} [ex.detail] - a human-readable description of what caused the error to occur
     * @property {String} status - stringified HTTP status code to be sent with the error
     * @property {String} [scimType] - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
     * @property {String} [detail] - a human-readable description of what caused the error to occur
     */
    constructor(ex = {}) {
        // Dereference parts of the exception
        const {schemas = [], status = 500, scimType, message, detail = message} = ex;
        const errorSuffix = "SCIM Error Message constructor";
        
        super(message, {cause: ex});
        
        // Rethrow SCIM Error messages when error message schema ID is present
        if (schemas.includes(ErrorMessage.#id))
            throw new Types.Error(status, scimType, detail);
        // Validate the supplied parameters
        if (!validStatusCodes.includes(Number(status)))
            throw new TypeError(`Incompatible HTTP status code '${status}' supplied to ${errorSuffix}`);
        if (!!scimType && !validScimTypes.includes(scimType))
            throw new TypeError(`Unknown detail error keyword '${scimType}' supplied to ${errorSuffix}`);
        if (!!scimType && !validCodeTypes[Number(status)]?.includes(scimType))
            throw new TypeError(`HTTP status code '${Number(status)}' not valid for detail error keyword '${scimType}' in ${errorSuffix}`);
        
        // No exceptions thrown, assign the parameters to the instance
        this.schemas = [ErrorMessage.#id];
        this.status = String(status);
        if (!!scimType) this.scimType = String(scimType);
        if (!!detail) this.detail = detail;
    }
}

/**
 * SCIM List Response Message
 * @alias SCIMMY.Messages.ListResponse
 * @summary
 * *   Formats supplied service provider resources as [ListResponse messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2), handling pagination and sort when required.
 */
class ListResponse {
    /**
     * SCIM List Response Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
    
    /**
     * Instantiate a new SCIM List Response Message with relevant details
     * @param {Object|SCIMMY.Types.Schema[]} request - contents of the ListResponse message, or items to include in the list response
     * @param {Object} [params] - parameters for the list response (i.e. sort details, start index, and items per page)
     * @param {String} [params.sortBy] - the attribute to sort results by, if any
     * @param {String} [params.sortOrder="ascending"] - the direction to sort results in, if sortBy is specified
     * @param {Number} [params.startIndex=1] - offset index that items start from
     * @param {Number} [params.count=20] - alias property for itemsPerPage, used only if itemsPerPage is unset
     * @param {Number} [params.itemsPerPage=20] - maximum number of items returned in this list response
     * @property {Array<Object|SCIMMY.Types.Schema>} Resources - resources included in the list response
     * @property {Number} totalResults - the total number of resources matching a given request
     * @property {Number} startIndex - index within total results that included resources start from
     * @property {Number} itemsPerPage - maximum number of items returned in this list response
     */
    constructor(request = [], params = {}) {
        const outbound = Array.isArray(request);
        const resources = (outbound ? request : request?.Resources ?? []);
        const totalResults = (outbound ? resources.totalResults ?? resources.length : request.totalResults);
        const {sortBy, sortOrder = "ascending"} = params ?? {};
        const {startIndex = 1, count = 20, itemsPerPage = count} = (outbound ? params : request);
        
        // Verify the ListResponse contents are valid
        if (!outbound && Array.isArray(request.schemas) && (!request.schemas.includes(ListResponse.#id) || request.schemas.length > 1))
            throw new TypeError(`ListResponse request body messages must exclusively specify schema as '${ListResponse.#id}'`);
        if (sortBy !== undefined && typeof sortBy !== "string")
            throw new TypeError("Expected 'sortBy' parameter to be a string in ListResponse message constructor");
        if (sortBy !== undefined && !["ascending", "descending"].includes(sortOrder))
            throw new TypeError("Expected 'sortOrder' parameter to be either 'ascending' or 'descending' in ListResponse message constructor");
        
        // Check supplied itemsPerPage and startIndex are valid integers...
        for (let [key, val, min] of Object.entries({itemsPerPage, startIndex}).map(([key, val], index) => ([key, val, index]))) {
            // ...but only expect actual number primitives when preparing an outbound list response
            if (Number.isNaN(Number.parseInt(val)) || !`${val}`.match(/^-?\d*$/) || (outbound && (typeof val !== "number" || !Number.isInteger(val) || val < min))) {
                throw new TypeError(`Expected '${key}' parameter to be a ${min ? "positive" : "non-negative"} integer in ListResponse message constructor`);
            }
        }
        
        // Construct the ListResponse message
        this.schemas = [ListResponse.#id];
        this.totalResults = totalResults;
        this.Resources = resources.filter(r => r);
        // Constrain integer properties to their minimum values
        this.startIndex = Math.max(Number.parseInt(startIndex), 1);
        this.itemsPerPage = Math.max(Number.parseInt(itemsPerPage), 0);
        
        // Handle sorting if sortBy is defined
        if (sortBy !== undefined) {
            const paths = sortBy.split(".");
            
            // Do the sort!
            this.Resources = this.Resources.sort((a, b) => {
                // Resolve target sort values for each side of the comparison (either the "primary" entry, or first entry, in a multi-valued attribute, or the target value)
                const ta = paths.reduce((res = {}, path = "") => ((!Array.isArray(res[path]) ? res[path] : (res[path].find(v => !!v.primary) ?? res[0])?.value) ?? ""), a);
                const tb = paths.reduce((res = {}, path = "") => ((!Array.isArray(res[path]) ? res[path] : (res[path].find(v => !!v.primary) ?? res[0])?.value) ?? ""), b);
                const list = [ta, tb];
                
                // If some or all of the targets are unspecified, sort specified value above unspecified value
                if (list.some(t => ((t ?? undefined) === undefined)))
                    return ((ta ?? undefined) === (tb ?? undefined) ? 0 : (ta ?? undefined) === undefined ? 1 : -1);
                // If all the targets are numbers, sort by the bigger number
                if (list.every(t => (typeof t === "number" && !Number.isNaN(Number(t)))))
                    return ta - tb;
                // If all the targets are dates, sort by the later date
                if (list.every(t => (String(t instanceof Date ? t.toISOString() : t)
                    .match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/))))
                    return new Date(ta) - new Date(tb);
                
                // If all else fails, compare the targets by string values
                return (String(ta).localeCompare(String(tb)));
            });
            
            // Reverse the order on descending
            if (sortOrder === "descending") this.Resources.reverse();
        }
        
        // If startIndex is within results, offset results to startIndex
        if ((this.Resources.length >= this.startIndex) && (this.totalResults !== this.Resources.length + this.startIndex - 1)) {
            this.Resources = this.Resources.slice(this.startIndex-1);
        }
        
        // If there are more resources than items per page, paginate the resources
        if (this.Resources.length > this.itemsPerPage) {
            this.Resources.length = this.itemsPerPage;
        }
    }
}

/**
 * List of valid SCIM patch operations
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidPatchOperations
 * @memberOf SCIMMY.Messages.PatchOp
 * @default
 */
const validOps = ["add", "remove", "replace"];
// Split a path by fullstops when they aren't in a filter group or decimal
const pathSeparator = /(?<![^\w]\d)\.(?!\d[^\w]|[^[]*])/g;
// Extract attributes and filter strings from path parts
const multiValuedFilter = /^(.+?)(\[(?:.*?)])?$/g;

/**
 * Deeply compare two objects, arrays, or primitive values to see if there are any differences 
 * @param {Object} original - object with original property values to compare against 
 * @param {*} original - original value to test equality against 
 * @param {Object} current - object with potentially changed property values to search for
 * @param {*} current - current value to test equality against
 * @param {String[]} [keys] - unused placeholder for storing object keys to avoid multiple calls to Object.keys 
 * @returns {Boolean} whether any properties or values at any level are different
 * @private
 */
const hasChanges = (original, current, keys) => (
    // If the values are the same, they are unchanged...
    original === current ? false :
    // If the original value is an array...
    Array.isArray(original) ? (
        // ...make sure the current value is also an array with matching length, then see if any values have changed
        (original.length !== (current ?? []).length) || (original.some((v, i) => hasChanges(v, current[i])))
    // Otherwise, if the original and current values are both non-null objects, compare property values
    ) : (original !== null && current !== null && typeof original === "object" && typeof current === "object") ? (
        // Compare underlying value of Date instances, since they are also "objects"
        original instanceof Date ? original.valueOf() !== current.valueOf() :
        // Cheaply see if key lengths differ...
        (keys = Object.keys(original)).length !== Object.keys(current).length ? true :
        // ...before expensively traversing object properties for changes    
        (keys.some((k) => (!(k in current) || hasChanges(original[k], current[k]))))
    ) : (
        // Fall back on whether both values are NaN
        (original === original && current === current)
    )
);

/**
 * SCIM Patch Operation Message
 * @alias SCIMMY.Messages.PatchOp
 * @summary
 * *   Parses [PatchOp messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.5.2), making sure all specified "Operations" are valid and conform with the SCIM protocol.
 * *   Provides a method to atomically apply PatchOp operations to a resource instance, handling any exceptions that occur along the way.
 */
class PatchOp {
    /**
     * SCIM Patch Operation Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:PatchOp";
    
    /**
     * Whether the PatchOp message has been fully formed.
     * Fully formed inbound requests will be considered to have been dispatched.
     * @type {Boolean}
     * @private
     */
    #dispatched = false;
    
    /**
     * Instantiate a new SCIM Patch Operation Message with relevant details
     * @param {Object} request - contents of the patch operation request being performed
     * @property {Object[]} Operations - list of SCIM-compliant patch operations to apply to the given resource
     */
    constructor(request) {
        const {schemas = [], Operations: operations = []} = request ?? {};
        
        // Determine if message is being prepared (outbound) or has been dispatched (inbound) 
        this.#dispatched = (request !== undefined);
        
        // Make sure specified schema is valid
        if (this.#dispatched && (schemas.length !== 1 || !schemas.includes(PatchOp.#id)))
            throw new Types.Error(400, "invalidSyntax", `PatchOp request body messages must exclusively specify schema as '${PatchOp.#id}'`);
        
        // Make sure request body contains valid operations to perform
        if (!Array.isArray(operations))
            throw new Types.Error(400, "invalidValue", "PatchOp expects 'Operations' attribute of 'request' parameter to be an array");
        if (this.#dispatched && !operations.length)
            throw new Types.Error(400, "invalidValue", "PatchOp request body must contain 'Operations' attribute with at least one operation");
        
        // Make sure all specified operations are valid
        for (let operation of operations) {
            const index = (operations.indexOf(operation) + 1);
            const {op, path, value} = operation;
            
            // Make sure operation is of type 'complex' (i.e. it's an object)
            if (Object(operation) !== operation || Array.isArray(operation))
                throw new Types.Error(400, "invalidValue", `PatchOp request body expected value type 'complex' for operation ${index} but found type '${Array.isArray(operation) ? "collection" : typeof operation}'`);
            // Make sure all operations have a valid action defined
            if (op === undefined)
                throw new Types.Error(400, "invalidValue", `Missing required attribute 'op' from operation ${index} in PatchOp request body`);
            if (typeof op !== "string" || !validOps.includes(op.toLowerCase()))
                throw new Types.Error(400, "invalidSyntax", `Invalid operation '${op}' for operation ${index} in PatchOp request body`);
            
            // Make sure value attribute is specified for "add" operations
            if ("add" === op.toLowerCase() && value === undefined)
                throw new Types.Error(400, "invalidValue", `Missing required attribute 'value' for 'add' op of operation ${index} in PatchOp request body`);
            // Make sure path attribute is specified for "remove" operations
            if ("remove" === op.toLowerCase() && path === undefined)
                throw new Types.Error(400, "noTarget", `Missing required attribute 'path' for 'remove' op of operation ${index} in PatchOp request body`);
            // Make sure path attribute is a string
            if (path !== undefined && typeof path !== "string")
                throw new Types.Error(400, "invalidPath", `Invalid path '${path}' for operation ${index} in PatchOp request body`);
        }
        
        // Store the attributes that define a PatchOp
        this.schemas = [PatchOp.#id];
        this.Operations = operations;
    }
    
    /**
     * SCIM SchemaDefinition instance for resource being patched
     * @type {SCIMMY.Types.SchemaDefinition}
     * @private
     */
    #schema;
    
    /**
     * Original SCIM Schema resource instance being patched
     * @type {SCIMMY.Types.Schema}
     * @private
     */
    #source;
    
    /**
     * Target SCIM Schema resource instance to apply patches to
     * @type {SCIMMY.Types.Schema}
     * @private
     */
    #target;
    
    /**
     * Apply patch operations to a resource as defined by the PatchOp instance
     * @param {SCIMMY.Types.Schema} resource - the schema instance the patch operation will be performed on
     * @param {Function} [finalise] - method to call when all operations are complete, to feed target back through model
     * @returns {Promise<SCIMMY.Types.Schema>} an instance of the resource modified as per the included patch operations
     */
    async apply(resource, finalise) {
        // Bail out if message has not been dispatched (i.e. it's not ready yet)
        if (!this.#dispatched)
            throw new TypeError("PatchOp expected message to be dispatched before calling 'apply' method");
        
        // Bail out if resource is not specified, or it's not a Schema instance
        if ((resource === undefined) || !(resource instanceof Types.Schema))
            throw new TypeError("Expected 'resource' to be an instance of SCIMMY.Types.Schema in PatchOp 'apply' method");
        
        // Store details about the resource being patched
        this.#schema = resource.constructor.definition;
        this.#source = resource;
        this.#target = new resource.constructor(resource);
        
        // Go through all specified operations
        for (let operation of this.Operations) {
            const index = (this.Operations.indexOf(operation) + 1);
            const {op, path, value} = operation;
            
            // And action it
            switch (op.toLowerCase()) {
                case "add":
                    this.#add(index, path, value);
                    break;
                    
                case "remove":
                    this.#remove(index, path, value);
                    break;
                    
                case "replace":
                    this.#replace(index, path, value);
                    break;
                    
                default:
                    // I don't know how we made it to here, as this should have been checked earlier, but just in case!
                    throw new Types.Error(400, "invalidSyntax", `Invalid operation '${op}' for operation ${index} in PatchOp request body`);
            }
        }
        
        // If finalise is a method, feed it the target to retrieve final representation of resource
        if (typeof finalise === "function")
            this.#target = new this.#target.constructor(await finalise(this.#target));
        
        // Only return value if something has changed
        if (hasChanges({...this.#source, meta: undefined}, {...this.#target, meta: undefined}))
            return this.#target;
    }
    
    /**
     * Dig in to an operation's path, making sure it is valid, and yields actual targets to patch
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - specifies path to the attribute or value being patched
     * @param {String} op - the operation being performed, for use in error messages
     * @returns {SCIMMY.Messages.PatchOp~PatchOpDetails}
     * @private
     */
    #resolve(index, path, op) {
        // Work out parts of the supplied path
        const paths = path.split(pathSeparator).filter(p => p);
        const targets = [this.#target];
        let property, attribute, multiValued;
        
        try {
            // Remove any filters from the path and attempt to get targeted attribute definition
            attribute = this.#schema.attribute(paths.map(p => p.replace(multiValuedFilter, "$1")).join("."));
            multiValued = attribute?.config?.multiValued ?? false;
        } catch {
            // Rethrow exceptions as SCIM errors when attribute wasn't found
            throw new Types.Error(400, "invalidPath", `Invalid path '${path}' for '${op}' op of operation ${index} in PatchOp request body`);
        }
        
        // Traverse the path
        while (paths.length > 0) {
            // Work out if path contains a filter expression
            const path = paths.shift();
            const [, key = path, filter] = multiValuedFilter.exec(path) ?? [];
            
            // We have arrived at our destination
            if (paths.length === 0) {
                property = (!filter ? key : false);
                multiValued = (multiValued ? !filter : multiValued);
            }
            
            // Traverse deeper into each existing target
            for (let target of targets.splice(0)) {
                if (target !== undefined) try {
                    if (filter !== undefined) {
                        // If a filter is specified, apply it to the target and add results back to targets
                        targets.push(...(new Types.Filter(filter.substring(1, filter.length - 1), this.#schema?.definition).match(target[key])));
                    } else {
                        // Add the traversed value to targets, or back out if already arrived
                        targets.push(paths.length === 0 ? target : target[key] ?? (op === "add" ? ((target[key] = target[key] ?? {}) && target[key]) : undefined));
                    }
                } catch {
                    // Nothing to do here, carry on
                }
            }
        }
        
        // No targets, bail out!
        if (targets.length === 0 && op !== "remove")
            throw new Types.Error(400, "noTarget", `Filter '${path}' does not match any values for '${op}' op of operation ${index} in PatchOp request body`);
        
        /**
         * @typedef {Object} SCIMMY.Messages.PatchOp~PatchOpDetails
         * @property {Boolean} complex - whether the target attribute value should be complex
         * @property {Boolean} multiValued - whether the target attribute expects a collection of values
         * @property {String} property - name of the targeted attribute to apply values to
         * @property {Object[]} targets - the resources containing the attributes to apply values to
         * @private
         */
        return {
            complex: (attribute instanceof Types.SchemaDefinition ? true : attribute.type === "complex"),
            multiValued, property, targets
        };
    }
    
    /**
     * Perform the "add" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - if supplied, specifies path to the attribute being added
     * @param {any|any[]} value - value being added to the resource or attribute specified by path
     * @private
     */
    #add(index, path, value) {
        if (path === undefined) {
            // If path is unspecified, value must be a plain object
            if (typeof value !== "object" || Array.isArray(value))
                throw new Types.Error(400, "invalidValue", `Attribute 'value' must be an object when 'path' is empty for 'add' op of operation ${index} in PatchOp request body`);
            
            // Go through and add the data specified by value
            for (let [key, val] of Object.entries(value)) this.#add(index, key, val);
        } else {
            // Validate and extract details about the operation
            const {targets, property, multiValued, complex} = this.#resolve(index, path, "add");
            
            // Go and apply the operation to matching targets
            for (let target of targets) {
                try {
                    // The target is expected to be a collection
                    if (multiValued) {
                        // Wrap objects as arrays
                        const values = (Array.isArray(value) ? value : [value]);
                        
                        // Add the values to the existing collection, or create a new one if it doesn't exist yet
                        if (Array.isArray(target[property])) target[property].push(...values);
                        else target[property] = values;
                    }
                    // The target is a complex attribute - add specified values to it
                    else if (complex) {
                        if (!property) Object.assign(target, value);
                        else if (target[property] === undefined) target[property] = value;
                        else Object.assign(target[property], value);
                    }
                    // The target is not a collection or a complex attribute - assign the value
                    else target[property] = value;
                } catch (ex) {
                    if (ex instanceof Types.Error) {
                        // Add additional context to SCIM errors
                        ex.message += ` for 'add' op of operation ${index} in PatchOp request body`;
                        throw ex;
                    } else if (ex.message?.endsWith?.("object is not extensible")) {
                        // Handle errors caused by non-existent attributes in complex values
                        throw new Types.Error(400, "invalidPath", `Invalid attribute path '${property}' in supplied value for 'add' op of operation ${index} in PatchOp request body`);
                    } else {
                        // Rethrow exceptions as SCIM errors
                        throw new Types.Error(400, "invalidValue", ex.message + ` for 'add' op of operation ${index} in PatchOp request body`);
                    }
                }
            }
        }
    }
    
    /**
     * Perform the "remove" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - specifies path to the attribute being removed
     * @param {any|any[]} value - value being removed from the resource or attribute specified by path
     * @private
     */
    #remove(index, path, value) {
        // Validate and extract details about the operation
        const {targets, property, complex, multiValued} = this.#resolve(index, path, "remove");
        
        // If there's a property defined, we have an easy target for removal
        if (property) {
            // Go through and remove the property from the targets
            for (let target of targets) {
                try {
                    // No value filter defined, or target is not multi-valued - unset the property
                    if (value === undefined || !multiValued) target[property] = undefined;
                    // Multivalued target, attempt removal of matching values from attribute
                    else if (multiValued) {
                        // Make sure filter values is an array for easy use of "includes" comparison when filtering
                        const values = (Array.isArray(value) ? value : [value]);
                        // If values are complex, build a filter to match with - otherwise just use values
                        const removals = (!complex || values.every(v => Object.isFrozen(v)) ? values : (
                            new Types.Filter(values.map(f => Object.entries(f)
                                // Get rid of any empty values from the filter
                                .filter(([, value]) => value !== undefined)
                                // Turn it into an equity filter string
                                .map(([key, value]) => (`${key} eq ${typeof value === "string" ? `"${value}"` : value}`))
                                // Join all comparisons into one logical expression
                                .join(" and ")).join(" or "))
                            // Get any matching values from the filter
                            .match(target[property])
                        ));
                        
                        // Filter out any values that exist in removals list
                        target[property] = (target[property] ?? []).filter(v => !removals.includes(v));
                        // Unset the property if it's now empty
                        if (target[property].length === 0) target[property] = undefined;
                    }
                } catch (ex) {
                    if (ex instanceof Types.Error) {
                        // Add additional context to SCIM errors
                        ex.message += ` for 'remove' op of operation ${index} in PatchOp request body`;
                        throw ex;
                    } else if (ex.message?.endsWith?.("object is not extensible")) {
                        // Handle errors caused by non-existent attributes in complex values
                        throw new Types.Error(400, "invalidPath", `Invalid attribute path '${property}' in supplied value for 'remove' op of operation ${index} in PatchOp request body`);
                    } else {
                        // Rethrow exceptions as SCIM errors
                        throw new Types.Error(400, "invalidValue", ex.message + ` for 'remove' op of operation ${index} in PatchOp request body`);
                    }
                }
            }
        } else {
            // Get path to the parent attribute having values removed
            const parentPath = path.split(pathSeparator).filter(v => v)
                .map((path, index, paths) => (index < paths.length-1 ? path : path.replace(multiValuedFilter, "$1")))
                .join(".");
            
            // Remove targeted values from parent attributes
            this.#remove(index, parentPath, targets);
        }
    }
    
    /**
     * Perform the "replace" operation on the resource
     * @param {Number} index - the operation's location in the list of operations, for use in error messages
     * @param {String} path - specifies path to the attribute being replaced
     * @param {any|any[]} value - value being replaced from the resource or attribute specified by path
     * @private
     */
    #replace(index, path, value) {
        try {
            // Call remove, then call add!
            try {
                if (path !== undefined) this.#remove(index, path);
            } catch {
                // Do nothing, as we're immediately adding a new value, which will enforce actual attribute validity
            }
            
            try {
                // Try set the value at the path
                this.#add(index, path, value);
            } catch (ex) {
                // If it's a multi-value target that doesn't exist, add to the collection instead
                if (ex.scimType === "noTarget") {
                    this.#add(index, path.split(pathSeparator).filter(p => p)
                        .map((p, i, s) => (i < s.length - 1 ? p : p.replace(multiValuedFilter, "$1"))).join("."), value);
                }
                // Otherwise, rethrow the error
                else throw ex;
            }
        } catch (ex) {
            // Rethrow exceptions with 'replace' instead of 'add' or 'remove'
            ex.message = ex.message.replace(/for '(add|remove)' op/, "for 'replace' op");
            throw ex;
        }
    }
}

/**
 * SCIM Bulk Response Message
 * @alias SCIMMY.Messages.BulkResponse
 * @since 1.0.0
 * @summary
 * *   Encapsulates bulk operation results as [BulkResponse messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.7) for consumption by a client.
 * *   Provides a method to unwrap BulkResponse results into operation success status, and map newly created resource IDs to their BulkRequest bulkIds.
 */
class BulkResponse {
    /**
     * SCIM BulkResponse Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:BulkResponse";
    
    /**
     * Instantiate a new SCIM BulkResponse message from the supplied Operations
     * @param {Object|Object[]} request - contents of the BulkResponse if object, or results of performed operations if array
     * @param {Object[]} [request.Operations] - list of applied SCIM-compliant bulk operation results, if request is an object
     * @property {Object[]} Operations - list of BulkResponse operation results
     */
    constructor(request = []) {
        let outbound = Array.isArray(request),
            operations = (outbound ? request : request?.Operations ?? []);
        
        // Verify the BulkResponse contents are valid
        if (!outbound && Array.isArray(request?.schemas) && (!request.schemas.includes(BulkResponse.#id) || request.schemas.length > 1))
            throw new TypeError(`BulkResponse request body messages must exclusively specify schema as '${BulkResponse.#id}'`);
        if (!Array.isArray(operations))
            throw new TypeError("BulkResponse constructor expected 'Operations' property of 'request' parameter to be an array");
        if (!outbound && !operations.length)
            throw new TypeError("BulkResponse request body must contain 'Operations' attribute with at least one operation");
        
        // All seems OK, prepare the BulkResponse
        this.schemas = [BulkResponse.#id];
        this.Operations = [...operations];
    }
    
    /**
     * Resolve bulkIds of POST operations into new resource IDs  
     * @returns {Map<String, String|Boolean>} map of bulkIds to resource IDs if operation was successful, or false if not
     */
    resolve() {
        return new Map(this.Operations
            // Only target POST operations with valid bulkIds
            .filter(o => o.method === "POST" && !!o.bulkId && typeof o.bulkId === "string")
            .map(o => ([o.bulkId, (typeof o.location === "string" && !!o.location ? o.location.split("/").pop() : false)])));
    }
}

/**
 * List of valid HTTP methods in a SCIM bulk request operation
 * @enum
 * @inner
 * @constant
 * @type {String[]}
 * @alias ValidBulkMethods
 * @memberOf SCIMMY.Messages.BulkRequest
 * @default
 */
const validMethods = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * SCIM Bulk Request Message
 * @alias SCIMMY.Messages.BulkRequest
 * @since 1.0.0
 * @summary
 * *   Parses [BulkRequest messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.7), making sure "Operations" have been specified, and conform with the SCIM protocol.
 * *   Provides a method to apply BulkRequest operations and return the results as a BulkResponse.
 */
class BulkRequest {
    /**
     * SCIM BulkRequest Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:BulkRequest";
    
    /**
     * Whether the incoming BulkRequest has been applied 
     * @type {Boolean}
     * @private
     */
    #dispatched = false;
    
    /**
     * Instantiate a new SCIM BulkResponse message from the supplied BulkRequest
     * @param {Object} request - contents of the BulkRequest operation being performed
     * @param {Object[]} request.Operations - list of SCIM-compliant bulk operations to apply
     * @param {Number} [request.failOnErrors] - number of error results to encounter before aborting any following operations
     * @param {Number} [maxOperations] - maximum number of operations supported in the request, as specified by the service provider
     * @property {Object[]} Operations - list of operations in this BulkRequest instance
     * @property {Number} [failOnErrors] - number of error results a service provider should tolerate before aborting any following operations
     */
    constructor(request, maxOperations = 0) {
        let {schemas = [], Operations: operations = [], failOnErrors = 0} = request ?? {};
        
        // Make sure specified schema is valid
        if (schemas.length !== 1 || !schemas.includes(BulkRequest.#id))
            throw new Types.Error(400, "invalidSyntax", `BulkRequest request body messages must exclusively specify schema as '${BulkRequest.#id}'`);
        // Make sure failOnErrors is a valid integer
        if (typeof failOnErrors !== "number" || !Number.isInteger(failOnErrors) || failOnErrors < 0)
            throw new Types.Error(400, "invalidSyntax", "BulkRequest expected 'failOnErrors' attribute of 'request' parameter to be a positive integer");
        // Make sure maxOperations is a valid integer
        if (typeof maxOperations !== "number" || !Number.isInteger(maxOperations) || maxOperations < 0)
            throw new Types.Error(400, "invalidSyntax", "BulkRequest expected 'maxOperations' parameter to be a positive integer");
        // Make sure request body contains valid operations to perform
        if (!Array.isArray(operations))
            throw new Types.Error(400, "invalidValue", "BulkRequest expected 'Operations' attribute of 'request' parameter to be an array");
        if (!operations.length)
            throw new Types.Error(400, "invalidValue", "BulkRequest request body must contain 'Operations' attribute with at least one operation");
        if (maxOperations > 0 && operations.length > maxOperations)
            throw new Types.Error(413, null, `Number of operations in BulkRequest exceeds maxOperations limit (${maxOperations})`);
        
        // All seems OK, prepare the BulkRequest body
        this.schemas = [BulkRequest.#id];
        this.Operations = [...operations];
        if (failOnErrors) this.failOnErrors = failOnErrors;
    }
    
    /**
     * Apply the operations specified by the supplied BulkRequest 
     * @param {typeof SCIMMY.Types.Resource[]} [resourceTypes] - resource type classes to be used while processing bulk operations, defaults to declared resources
     * @param {*} [ctx] - any additional context information to pass to the ingress, egress, and degress handlers
     * @returns {SCIMMY.Messages.BulkResponse} a new BulkResponse Message instance with results of the requested operations 
     */
    async apply(resourceTypes = Object.values(Resources.declared()), ctx) {
        // Bail out if BulkRequest message has already been applied
        if (this.#dispatched) 
            throw new TypeError("BulkRequest 'apply' method must not be called more than once");
        // Make sure all specified resource types extend the Resource type class so operations can be processed correctly 
        else if (!resourceTypes.every(r => r.prototype instanceof Types.Resource))
            throw new TypeError("Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of BulkRequest");
        // Seems OK, mark the BulkRequest as dispatched so apply can't be called again
        else this.#dispatched = true;
        
        // Set up easy access to resource types by endpoint, and store pending results
        const typeMap = new Map(resourceTypes.map((r) => [r.endpoint, r]));
        const results = [];
        
        // Get a map of POST ops with bulkIds for direct and circular reference resolution
        const bulkIds = new Map(this.Operations
            .filter(o => o.method === "POST" && !!o.bulkId && typeof o.bulkId === "string")
            .map(({bulkId}, index, postOps) => {
                // Establish who waits on what, and provide a way for that to happen
                const handlers = {referencedBy: postOps.filter(({data}) => JSON.stringify(data ?? {}).includes(`bulkId:${bulkId}`)).map(({bulkId}) => bulkId)};
                const value = new Promise((resolve, reject) => Object.assign(handlers, {resolve, reject}));
                
                return [bulkId, Object.assign(value, handlers)];
            })
        );
        
        // Turn them into a list for operation ordering
        const bulkIdTransients = [...bulkIds.keys()];
        
        // Establish error handling for the entire list of operations
        const errorLimit = this.failOnErrors;
        let errorCount = 0,
            lastErrorIndex = this.Operations.length + 1;
        
        for (let op of this.Operations) results.push((async () => {
            // Unwrap useful information from the operation
            const {method, bulkId: opBulkId, path = "", data} = op;
            // Ignore the bulkId unless method is POST
            const bulkId = (String(method).toUpperCase() === "POST" ? opBulkId : undefined);
            // Evaluate endpoint and resource ID, and thus what kind of resource we're targeting 
            const [endpoint, id] = (typeof path === "string" ? path : "").substring(1).split("/");
            const TargetResource = (endpoint ? typeMap.get(`/${endpoint}`) : false);
            // Construct a location for the response, and prepare common aspects of the result
            const location = (TargetResource ? [TargetResource.basepath() ?? TargetResource.endpoint, id].filter(v => v).join("/") : path || undefined);
            const result = {method, bulkId: (typeof bulkId === "string" ? bulkId : undefined), location: (typeof location === "string" ? location : undefined)};
            // Get op data and find out if this op waits on any other operations
            const jsonData = (!!data ? JSON.stringify(data) : "");
            const waitingOn = (!jsonData.includes("bulkId:") ? [] : [...new Set([...jsonData.matchAll(/"bulkId:(.+?)"/g)].map(([, id]) => id))]);
            const {referencedBy = []} = bulkIds.get(bulkId) ?? {};
            // Establish error handling for this operation
            const index = this.Operations.indexOf(op) + 1;
            const errorSuffix = `in BulkRequest operation #${index}`;
            let error = false;
            
            // If not the first operation, and there's no circular references, wait on prior operations
            if (index > 1 && (!bulkId || !waitingOn.length || !waitingOn.some(id => referencedBy.includes(id)))) {
                // Check to see if any preceding operations reference this one
                const dependents = referencedBy.map(bulkId => bulkIdTransients.indexOf(bulkId));
                // Then filter them out, so they aren't waited on, and get results of the last operation
                const precedingOps = results.slice(0, index - 1).filter((v, i) => !dependents.includes(i));
                const lastOp = (await Promise.all(precedingOps)).pop();
                
                // If there was last operation, and it failed, and error limit reached, bail out here
                if (precedingOps.length && (!lastOp || (lastOp.response instanceof ErrorMessage && !(!errorLimit || (errorCount < errorLimit)))))
                    return;
            }
            
            // Make sure method has a value
            if (!method && method !== false)
                error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Missing or empty 'method' string ${errorSuffix}`));
            // Make sure that value is a string
            else if (typeof method !== "string")
                error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Expected 'method' to be a string ${errorSuffix}`));
            // Make sure that string is a valid method
            else if (!validMethods.includes(String(method).toUpperCase()))
                error = new ErrorMessage(new Types.Error(400, "invalidValue", `Invalid 'method' value '${method}' ${errorSuffix}`));
            // Make sure path has a value
            else if (!path && path !== false)
                error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Missing or empty 'path' string ${errorSuffix}`));
            // Make sure that path is a string
            else if (typeof path !== "string")
                error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Expected 'path' to be a string ${errorSuffix}`));
            // Make sure that string points to a valid resource type
            else if (![...typeMap.keys()].includes(`/${endpoint}`))
                error = new ErrorMessage(new Types.Error(400, "invalidValue", `Invalid 'path' value '${path}' ${errorSuffix}`));
            // Make sure there IS a bulkId if the method is POST
            else if (method.toUpperCase() === "POST" && !bulkId && bulkId !== false)
                error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `POST operation missing required 'bulkId' string ${errorSuffix}`));
            // Make sure there IS a bulkId if the method is POST
            else if (method.toUpperCase() === "POST" && typeof bulkId !== "string")
                error = new ErrorMessage(new Types.Error(400, "invalidValue", `POST operation expected 'bulkId' to be a string ${errorSuffix}`));
            // Make sure there ISN'T a resource targeted if the method is POST
            else if (method.toUpperCase() === "POST" && !!id)
                error = new ErrorMessage(new Types.Error(404, null, `POST operation must not target a specific resource ${errorSuffix}`));
            // Make sure there IS a resource targeted if the method isn't POST
            else if (method.toUpperCase() !== "POST" && !id)
                error = new ErrorMessage(new Types.Error(404, null, `${method.toUpperCase()} operation must target a specific resource ${errorSuffix}`));
            // Make sure data is an object, if method isn't DELETE
            else if (method.toUpperCase() !== "DELETE" && (Object(data) !== data || Array.isArray(data)))
                error = new ErrorMessage(new Types.Error(400, "invalidSyntax", `Expected 'data' to be a single complex value ${errorSuffix}`));
            // Make sure any bulkIds referenced in data can eventually be resolved
            else if (!waitingOn.every((id) => bulkIds.has(id)))
                error = new ErrorMessage(new Types.Error(400, "invalidValue", `No POST operation found matching bulkId '${waitingOn.find((id) => !bulkIds.has(id))}'`));
            // If things look OK, attempt to apply the operation
            else try {
                // Get replaceable data for reference resolution
                let {data} = op;
                
                // Go through and wait on any referenced POST bulkIds
                for (let referenceId of waitingOn) {
                    // Find the referenced operation to wait for
                    const reference = bulkIds.get(referenceId);
                    const referenceIndex = bulkIdTransients.indexOf(referenceId);
                    
                    // If the reference is also waiting on us, we have ourselves a circular reference!
                    if (bulkId && !id && reference.referencedBy.includes(bulkId) && (bulkIdTransients.indexOf(bulkId) < referenceIndex)) {
                        // Attempt to POST self without reference so referenced operation can complete and give us its ID!
                        const {id} = await new TargetResource().write(Object.entries(data)
                            // Remove any values that reference a bulkId
                            .filter(([,v]) => !JSON.stringify(v).includes("bulkId:"))
                            .reduce((res, [k, v]) => Object.assign(res, {[k]: v}), {}), ctx);
                        
                        // Set the ID for future use and resolve pending references
                        Object.assign(data, {id});
                        bulkIds.get(bulkId).resolve(id);
                    }
                    
                    try {
                        // Replace reference with real value once resolved, preserving any new resource ID
                        data = Object.assign(JSON.parse(jsonData.replaceAll(`bulkId:${referenceId}`, await reference)), {id: data.id});
                    } catch (ex) {
                        // Referenced POST operation precondition failed, remove any created resource and bail out
                        if (bulkId && data.id) await new TargetResource(data.id).dispose(ctx);
                        
                        // If we're following on from a prior failure, no need to explain why, otherwise, explain the failure
                        if (ex instanceof ErrorMessage && (!!errorLimit && errorCount >= errorLimit && index > lastErrorIndex)) return;
                        else throw new Types.Error(412, null, `Referenced POST operation with bulkId '${referenceId}' was not successful`);
                    }
                }
                
                // Get ready
                const resource = new TargetResource(method.toUpperCase() === "POST" ? undefined : id ?? data?.id);
                let value;
                
                // Do the thing!
                switch (method.toUpperCase()) {
                    case "POST":
                    case "PUT":
                        value = await resource.write(data, ctx);
                        if (bulkId && !resource.id && value?.id) bulkIds.get(bulkId).resolve(value?.id); 
                        break;
                        
                    case "PATCH":
                        value = await resource.patch(data, ctx);
                        break;
                        
                    case "DELETE":
                        await resource.dispose(ctx);
                        break;
                }
                
                Object.assign(result, {status: (value ? (!bulkId ? "200" : "201") : "204")}, (value ? {location: value?.meta?.location} : {}));
            } catch (ex) {
                // Coerce the exception into a SCIMError
                if (!(ex instanceof Types.Error)) 
                    ex = new Types.Error(...(ex instanceof TypeError ? [400, "invalidValue"] : [500, null]), ex.message);
                
                // Set the error variable for final handling, and reject any pending operations
                error = new ErrorMessage(ex);
            }
            
            // If there was an error, store result and increment error count
            if (error instanceof ErrorMessage) {
                Object.assign(result, {status: error.status, response: error, location: (String(method).toUpperCase() !== "POST" ? result.location : undefined)});
                lastErrorIndex = (index < lastErrorIndex ? index : lastErrorIndex);
                errorCount++;
                
                // Also reject the pending bulkId promise as no resource ID can exist
                if (bulkId && bulkIds.has(bulkId)) {
                    bulkIds.get(bulkId).reject(error);
                    bulkIds.get(bulkId).catch(() => {});
                }
            }
            
            return result;
        })());
        
        // Await the results and return a new BulkResponse
        return new BulkResponse((await Promise.all(results)).filter(r => r));
    }
}

/**
 * SCIM Search Request Message
 * @alias SCIMMY.Messages.SearchRequest
 * @since 1.0.0
 * @summary
 * *   Encapsulates HTTP POST data as [SCIM SearchRequest messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.3).
 * *   Provides a method to perform the search request against the declared or specified resource types.
 */
class SearchRequest {
    /**
     * SCIM SearchRequest Message Schema ID
     * @type {String}
     * @private
     */
    static #id = "urn:ietf:params:scim:api:messages:2.0:SearchRequest";
    
    /**
     * Instantiate a new SCIM SearchRequest message from the supplied request
     * @param {Object} [request] - contents of the SearchRequest received by the service provider
     * @param {String} [request.filter] - the filter to be applied on ingress/egress by implementing resource
     * @param {String[]} [request.excludedAttributes] - the string list of attributes or filters to exclude on egress
     * @param {String[]} [request.attributes] - the string list of attributes or filters to include on egress
     * @param {String} [request.sortBy] - the attribute retrieved resources should be sorted by
     * @param {String} [request.sortOrder] - the direction retrieved resources should be sorted in
     * @param {Number} [request.startIndex] - offset index that retrieved resources should start from
     * @param {Number} [request.count] - maximum number of retrieved resources that should be returned in one operation
     * @property {String} [filter] - the filter to be applied on ingress/egress by implementing resource
     * @property {String[]} [excludedAttributes] - the string list of attributes or filters to exclude on egress
     * @property {String[]} [attributes] - the string list of attributes or filters to include on egress
     * @property {String} [sortBy] - the attribute retrieved resources should be sorted by
     * @property {String} [sortOrder] - the direction retrieved resources should be sorted in
     * @property {Number} [startIndex] - offset index that retrieved resources should start from
     * @property {Number} [count] - maximum number of retrieved resources that should be returned in one operation
     */
    constructor(request) {
        const {schemas} = request ?? {};
        
        // Verify the SearchRequest contents are valid
        if (request !== undefined && (!Array.isArray(schemas) || ((schemas.length === 1 && !schemas.includes(SearchRequest.#id)) || schemas.length > 1)))
            throw new Types.Error(400, "invalidSyntax", `SearchRequest request body messages must exclusively specify schema as '${SearchRequest.#id}'`);
        
        try {
            // All seems OK, prepare the SearchRequest
            this.schemas = [SearchRequest.#id];
            this.prepare(request);
        } catch (ex) {
            // Rethrow TypeErrors from prepare as SCIM Errors
            throw new Types.Error(400, "invalidValue", ex.message.replace(" in 'prepare' method of SearchRequest", ""));
        }
    }
    
    /**
     * Prepare a new search request for transmission to a service provider
     * @param {Object} [params] - details of the search request to be sent to a service provider
     * @param {String} [params.filter] - the filter to be applied on ingress/egress by implementing resource
     * @param {String[]} [params.excludedAttributes] - the string list of attributes or filters to exclude on egress
     * @param {String[]} [params.attributes] - the string list of attributes or filters to include on egress
     * @param {String} [params.sortBy] - the attribute retrieved resources should be sorted by
     * @param {String} [params.sortOrder] - the direction retrieved resources should be sorted in
     * @param {Number} [params.startIndex] - offset index that retrieved resources should start from
     * @param {Number} [params.count] - maximum number of retrieved resources that should be returned in one operation
     * @returns {SCIMMY.Messages.SearchRequest} this SearchRequest instance for chaining
     */
    prepare(params = {}) {
        const {filter, excludedAttributes = [], attributes = [], sortBy, sortOrder, startIndex, count} = params;
        
        // Make sure filter is a non-empty string, if specified
        if (filter !== undefined && (typeof filter !== "string" || !filter.trim().length))
            throw new TypeError("Expected 'filter' parameter to be a non-empty string in 'prepare' method of SearchRequest");
        // Make sure excludedAttributes is an array of non-empty strings
        if (!Array.isArray(excludedAttributes) || !excludedAttributes.every((a) => (typeof a === "string" && !!a.trim().length)))
            throw new TypeError("Expected 'excludedAttributes' parameter to be an array of non-empty strings in 'prepare' method of SearchRequest");
        // Make sure attributes is an array of non-empty strings
        if (!Array.isArray(attributes) || !attributes.every((a) => (typeof a === "string" && !!a.trim().length)))
            throw new TypeError("Expected 'attributes' parameter to be an array of non-empty strings in 'prepare' method of SearchRequest");
        // Make sure sortBy is a non-empty string, if specified
        if (sortBy !== undefined && (typeof sortBy !== "string" || !sortBy.trim().length))
            throw new TypeError("Expected 'sortBy' parameter to be a non-empty string in 'prepare' method of SearchRequest");
        // Make sure sortOrder is a non-empty string, if specified
        if (sortOrder !== undefined && !["ascending", "descending"].includes(sortOrder))
            throw new TypeError("Expected 'sortOrder' parameter to be either 'ascending' or 'descending' in 'prepare' method of SearchRequest");
        // Make sure startIndex is a positive integer, if specified
        if (startIndex !== undefined && (typeof startIndex !== "number" || !Number.isInteger(startIndex) || startIndex < 1))
            throw new TypeError("Expected 'startIndex' parameter to be a positive integer in 'prepare' method of SearchRequest");
        // Make sure count is a positive integer, if specified
        if (count !== undefined && (typeof count !== "number" || !Number.isInteger(count) || count < 1))
            throw new TypeError("Expected 'count' parameter to be a positive integer in 'prepare' method of SearchRequest");
        
        // Sanity checks have passed, assign values
        if (!!filter) this.filter = filter;
        if (excludedAttributes.length) this.excludedAttributes = [...excludedAttributes];
        if (attributes.length) this.attributes = [...attributes];
        if (sortBy !== undefined) this.sortBy = sortBy;
        if (["ascending", "descending"].includes(sortOrder)) this.sortOrder = sortOrder;
        if (startIndex !== undefined) this.startIndex = startIndex;
        if (count !== undefined) this.count = count;
        
        return this;
    }
    
    /**
     * Apply a search request operation, retrieving results from specified resource types
     * @param {typeof SCIMMY.Types.Resource[]} [resourceTypes] - resource type classes to be used while processing the search request, defaults to declared resources
     * @param {*} [ctx] - any additional context information to pass to the egress handler
     * @returns {SCIMMY.Messages.ListResponse} a ListResponse message with results of the search request 
     */
    async apply(resourceTypes = Object.values(Resources.declared()), ctx) {
        // Make sure all specified resource types extend the Resource type class so operations can be processed correctly 
        if (!Array.isArray(resourceTypes) || !resourceTypes.every(r => r.prototype instanceof Types.Resource))
            throw new TypeError("Expected 'resourceTypes' parameter to be an array of Resource type classes in 'apply' method of SearchRequest");
        
        // Build the common request template
        const request = {
            ...(!!this.filter ? {filter: this.filter} : {}),
            ...(!!this.excludedAttributes ? {excludedAttributes: this.excludedAttributes.join(",")} : {}),
            ...(!!this.attributes ? {attributes: this.attributes.join(",")} : {})
        };
        
        // If only one resource type, just read from it
        if (resourceTypes.length === 1) {
            const [Resource] = resourceTypes;
            return new Resource({...this, ...request}).read(ctx);
        }
        // Otherwise, read from all resources and return collected results
        else {
            // Read from, and unwrap results for, supplied resource types
            const results = await Promise.all(resourceTypes.map((Resource) => new Resource(request).read(ctx)))
                .then((r) => r.map((l) => l.Resources));
            
            // Collect the results in a list response with specified constraints
            return new ListResponse(results.flat(Infinity), {
                sortBy: this.sortBy, sortOrder: this.sortOrder,
                ...(!!this.startIndex ? {startIndex: Number(this.startIndex)} : {}),
                ...(!!this.count ? {itemsPerPage: Number(this.count)} : {})
            });
        }
    }
}

/**
 * SCIMMY Messages Container Class
 * @namespace SCIMMY.Messages
 * @description
 * SCIMMY provides a singleton class, `SCIMMY.Messages`, that includes tools for constructing and
 * consuming SCIM-compliant data messages to be sent to, or received from, a SCIM service provider.
 */
class Messages {
    static Error = ErrorMessage;
    static ListResponse = ListResponse;
    static PatchOp = PatchOp;
    static BulkRequest = BulkRequest;
    static BulkResponse = BulkResponse;
    static SearchRequest = SearchRequest;
}

export { Messages };
