declare module "lib/types/attribute" {
    /**
     * SCIM Attribute Type
     * @alias SCIMMY.Types.Attribute
     * @summary
     * *   Defines a SCIM schema attribute, and is used to ensure a given resource's value conforms to the attribute definition.
     */
    export class Attribute {
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
        constructor(type: string, name: string, config?: {}, subAttributes?: SCIMMY.Types.Attribute[]);
        type: string;
        name: string;
        config: any;
        subAttributes: SCIMMY.Types.Attribute[];
        /**
         * Remove a subAttribute from a complex attribute definition
         * @param {String|SCIMMY.Types.Attribute} subAttributes - the child attributes to remove from the complex attribute definition
         * @returns {SCIMMY.Types.Attribute} this attribute instance for chaining
         */
        truncate(subAttributes: string | SCIMMY.Types.Attribute): SCIMMY.Types.Attribute;
        /**
         * Parse this Attribute instance into a valid SCIM attribute definition object
         * @returns {SCIMMY.Types.Attribute~AttributeDefinition} an object representing a valid SCIM attribute definition
         */
        toJSON(): any;
        /**
         * Coerce a given value by making sure it conforms to attribute's characteristics
         * @param {any|any[]} source - value to coerce and confirm conformity with attribute's characteristics
         * @param {String} [direction] - whether to check for inbound, outbound, or bidirectional attributes
         * @param {Boolean} [isComplexMultiValue=false] - indicates whether a coercion is for a single complex value in a collection of complex values
         * @returns {String|String[]|Number|Boolean|Object|Object[]} the coerced value, conforming to attribute's characteristics
         */
        coerce(source: any | any[], direction?: string, isComplexMultiValue?: boolean): string | string[] | number | boolean | any | any[];
    }
}
declare module "lib/types/error" {
    /**
     * SCIM Error Type
     * @alias SCIMMY.Types.Error
     * @see SCIMMY.Messages.Error
     * @summary
     * *   Extends the native Error class and provides a way to express errors caused by SCIM protocol, schema conformity, filter expression,
     *     or other exceptions with details required by the SCIM protocol in [RFC7644§3.12](https://datatracker.ietf.org/doc/html/rfc7644#section-3.12).
     */
    export class SCIMError extends Error {
        /**
         * Instantiate a new error with SCIM error details
         * @param {Number} status - HTTP status code to be sent with the error
         * @param {String} scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
         * @param {String} message - a human-readable description of what caused the error to occur
         * @property {Number} status - HTTP status code to be sent with the error
         * @property {String} scimType - the SCIM detail error keyword as per [RFC7644§3.12]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.12}
         * @property {String} message - a human-readable description of what caused the error to occur
         */
        constructor(status: number, scimType: string, message: string);
        status: number;
        scimType: string;
    }
}
declare module "lib/types/filter" {
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
    export class Filter extends Array<any> {
        /**
         * Check an expression object or set of objects to make sure they are valid
         * @param {Object|Object[]} expression - the expression object or set of objects to validate
         * @param {Number} [originIndex] - the index of the original filter expression object for errors thrown while recursively validating
         * @param {String} [prefix] - the path to prepend to attribute names in thrown errors
         * @returns {Object[]} the original expression object or objects, wrapped in an array
         * @private
         */
        private static "__#1@#validate";
        /**
         * Turn a parsed filter expression object back into a string
         * @param {SCIMMY.Types.Filter} filter - the SCIMMY filter instance to stringify
         * @returns {String} the string representation of the given filter expression object
         * @private
         */
        private static "__#1@#stringify";
        /**
         * Extract a list of tokens representing the supplied expression
         * @param {String} query - the expression to generate the token list for
         * @returns {Object[]} a set of token objects representing the expression, with details on the token kinds
         * @private
         */
        private static "__#1@#tokenise";
        /**
         * Divide a list of tokens into sets split by a given logical operator for parsing
         * @param {Object[]} input - list of token objects in a query to divide by the given logical operation
         * @param {String} operator - the logical operator to divide the tokens by
         * @returns {Array<Object[]>} the supplied list of tokens split wherever the given operator occurred
         * @private
         */
        private static "__#1@#operations";
        /**
         * Translate a given set of expressions into their object representation
         * @param {Object|Object[]|Array<String[]>} expressions - list of expressions to translate into their object representation
         * @returns {Object} translated representation of the given set of expressions
         * @private
         */
        private static "__#1@#objectify";
        /**
         * Parse a SCIM filter string into an array of objects representing the query filter
         * @param {String|Object[]} [query=""] - the filter parameter of a request as per [RFC7644§3.4.2.2]{@link https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2}
         * @returns {Object[]} parsed object representation of the queried filter
         * @private
         */
        private static "__#1@#parse";
        /**
         * Instantiate and parse a new SCIM filter string or expression
         * @param {String|Object|Object[]} expression - the query string to parse, or an existing filter expression object or set of objects
         */
        constructor(expression: string | any | any[], definition: any);
        /**
         * The original string that was parsed by the filter, or the stringified representation of filter expression objects
         * @member {String}
         */
        expression: string;
        /**
         * Compare and filter a given set of values against this filter instance
         * @param {Object[]} values - values to evaluate filters against
         * @returns {Object[]} subset of values that match any expressions of this filter instance
         */
        match(values: any[]): any[];
        #private;
    }
}
declare module "lib/types/definition" {
    /**
     * SCIM Schema Definition Type
     * @alias SCIMMY.Types.SchemaDefinition
     * @summary
     * *   Defines an underlying SCIM schema definition, containing the schema's URN namespace, friendly name, description, and collection of attributes that make up the schema.
     * *   Provides a way to ensure all properties of a resource conform to their attribute definitions, as well as enabling JSON expression of schemas for consumption by other SCIM clients or service providers.
     */
    export class SchemaDefinition {
        /**
         * Filter out desired or undesired attributes from a coerced schema value
         * @param {SCIMMY.Types.SchemaDefinition} definition - the schema definition requesting the filtering
         * @param {Object} [filter] - the filter to apply to the coerced value
         * @param {Object|Object[]} [data={}] - the data to filter attributes from
         * @param {String} [prefix=""] - prefix to use when filtering on complex value subAttributes
         * @returns {Object} the coerced value with desired or undesired attributes filtered out
         * @private
         */
        private static "__#2@#filter";
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
        constructor(name: string, id: string, description?: string, attributes?: SCIMMY.Types.Attribute[]);
        name: string;
        id: string;
        description: string;
        attributes: Attribute[];
        /**
         * Get the SCIM schema definition for consumption by clients
         * @param {String} [basepath=""] - the base path for the schema's meta.location property
         * @returns {Object} the schema definition for consumption by clients
         */
        describe(basepath?: string): any;
        /**
         * Find an attribute or extension instance belonging to the schema definition by its name
         * @param {String} name - the name of the attribute to look for (namespaced or direct)
         * @returns {SCIMMY.Types.Attribute|SCIMMY.Types.SchemaDefinition} the Attribute or SchemaDefinition instance with matching name
         */
        attribute(name: string): SCIMMY.Types.Attribute | SCIMMY.Types.SchemaDefinition;
        /**
         * Extend a schema definition instance by mixing in other schemas or attributes
         * @param {SCIMMY.Types.SchemaDefinition|Array<SCIMMY.Types.Attribute>} extension - the schema extension or collection of attributes to register
         * @param {Boolean} [required=false] - if the extension is a schema, whether the extension is required
         * @returns {SCIMMY.Types.SchemaDefinition} this schema definition instance for chaining
         */
        extend(extension?: SCIMMY.Types.SchemaDefinition | Array<SCIMMY.Types.Attribute>, required?: boolean): SCIMMY.Types.SchemaDefinition;
        /**
         * Remove an attribute, extension schema, or subAttribute from a schema or attribute definition
         * @param {...String} target - the name, or names, of attributes to remove from the schema definition
         * @param {...SCIMMY.Types.Attribute} target - the attribute instance, or instances, to remove from the schema definition
         * @param {...SCIMMY.Types.SchemaDefinition} target - the extension schema, or schemas, to remove from the schema definition
         * @returns {SCIMMY.Types.SchemaDefinition} this schema definition instance for chaining
         */
        truncate(...target: string[]): SCIMMY.Types.SchemaDefinition;
        /**
         * Coerce a given value by making sure it conforms to all schema attributes' characteristics
         * @param {Object} data - value to coerce and confirm conformity of properties to schema attributes' characteristics
         * @param {String} [direction="both"] - whether to check for inbound, outbound, or bidirectional attributes
         * @param {String} [basepath] - the URI representing the resource type's location
         * @param {SCIMMY.Types.Filter} [filters] - the attribute filters to apply to the coerced value
         * @returns {Object} the coerced value, conforming to all schema attributes' characteristics
         */
        coerce(data: any, direction?: string, basepath?: string, filters?: SCIMMY.Types.Filter): any;
    }
    import { Attribute } from "lib/types/attribute";
}
declare module "lib/types/schema" {
    /**
     * SCIM Schema Type
     * @alias SCIMMY.Types.Schema
     * @summary
     * *   Extendable class which provides the ability to construct resource instances with automated validation of conformity to a resource's schema definition.
     * *   Once instantiated, any modifications will also be validated against the attached schema definition's matching attribute configuration (e.g. for mutability or canonical values).
     */
    export class Schema {
        /**
         * Retrieves a schema's definition instance
         * @type {SCIMMY.Types.SchemaDefinition}
         * @abstract
         */
        static get definition(): SCIMMY.Types.SchemaDefinition;
        /**
         * Stores a schema's definition instance
         * @type {SCIMMY.Types.SchemaDefinition}
         * @private
         * @abstract
         */
        private static "__#3@#definition";
        /**
         * Extend a schema by mixing in other schemas or attributes
         * @param {SCIMMY.Types.Schema|Array<SCIMMY.Types.Attribute>} extension - the schema extensions or collection of attributes to register
         * @param {Boolean} [required=false] - if the extension is a schema, whether the extension is required
         */
        static extend(extension: SCIMMY.Types.Schema | Array<SCIMMY.Types.Attribute>, required?: boolean): void;
        /**
         * Remove an attribute, schema extension, or subAttribute from the schema's definition
         * @param {SCIMMY.Types.Schema|String|SCIMMY.Types.Attribute|Array<String|SCIMMY.Types.Attribute>} attributes - the child attributes to remove from the schema definition
         */
        static truncate(attributes: SCIMMY.Types.Schema | string | SCIMMY.Types.Attribute | Array<string | SCIMMY.Types.Attribute>): void;
        /**
         * Construct a resource instance after verifying schema compatibility
         * @param {Object} data - the source data to feed through the schema definition
         * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
         */
        constructor(data?: any, direction?: string);
    }
}
declare module "lib/types/resource" {
    /**
     * SCIM Resource Type
     * @alias SCIMMY.Types.Resource
     * @summary
     * *   Extendable class representing a SCIM Resource Type, which acts as an interface between a SCIM resource type schema, and an app's internal data model.
     * *   Handles incoming requests to read/write/delete a resource, parses any attribute, filter, and sort parameters of a request, and formats responses for consumption by other SCIM clients and service providers.
     */
    export class Resource {
        /**
         * Retrieves a resource's endpoint relative to the service provider's base URL
         * @type {String}
         * @abstract
         */
        static get endpoint(): string;
        /**
         * Base path for resource's location
         * @type {String}
         * @private
         * @abstract
         */
        private static "__#4@#basepath";
        /**
         * Sets or retrieves the base path for resolution of a resource's location
         * @param {String} [path] - the path to use as the base of a resource's location
         * @returns {SCIMMY.Types.Resource|String} this resource type class for chaining if path is a string, or the resource's basepath
         * @abstract
         */
        static basepath(path?: string): SCIMMY.Types.Resource | string;
        /**
         * Retrieves a resource's core schema
         * @type {typeof SCIMMY.Types.Schema}
         * @abstract
         */
        static get schema(): any;
        /**
         * Register an extension to the resource's core schema
         * @param {typeof SCIMMY.Types.Schema} extension - the schema extension to register
         * @param {Boolean} [required] - whether the extension is required
         * @returns {SCIMMY.Types.Resource|void} this resource type implementation for chaining
         */
        static extend(extension: typeof SCIMMY.Types.Schema, required?: boolean): SCIMMY.Types.Resource | void;
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
        private static "__#4@#ingress";
        /**
         * Sets the method to be called to consume a resource on create
         * @param {SCIMMY.Types.Resource~IngressHandler} handler - function to invoke to consume a resource on create
         * @returns {SCIMMY.Types.Resource} this resource type class for chaining
         * @abstract
         */
        static ingress(handler: any): SCIMMY.Types.Resource;
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
        private static "__#4@#egress";
        /**
         * Sets the method to be called to retrieve a resource on read
         * @param {SCIMMY.Types.Resource~EgressHandler} handler - function to invoke to retrieve a resource on read
         * @returns {SCIMMY.Types.Resource} this resource type class for chaining
         * @abstract
         */
        static egress(handler: any): SCIMMY.Types.Resource;
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
        private static "__#4@#degress";
        /**
         * Sets the method to be called to dispose of a resource on delete
         * @param {SCIMMY.Types.Resource~DegressHandler} handler - function to invoke to dispose of a resource on delete
         * @returns {SCIMMY.Types.Resource} this resource type class for chaining
         * @abstract
         */
        static degress(handler: any): SCIMMY.Types.Resource;
        /**
         * Describe this resource type implementation
         * @returns {SCIMMY.Types.Resource~ResourceType} object describing the resource type implementation
         */
        static describe(): any;
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
        constructor(id?: string, config?: {
            filter?: string;
            excludedAttributes?: string;
            attributes?: string;
            sortBy?: string;
            sortOrder?: string;
            startIndex?: number;
            count?: number;
        });
        id: string;
        filter: Filter;
        attributes: Filter;
        constraints: {
            count?: number;
            startIndex?: number;
            sortOrder?: string;
            sortBy?: string;
        };
        /**
         * Calls resource's egress method for data retrieval.
         * Wraps the results in valid SCIM list response or single resource syntax.
         * @param {*} [ctx] - any additional context information to pass to the egress handler
         * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Types.Schema}
         * *   A collection of resources matching instance's configured filter, if no ID was supplied to resource constructor.
         * *   The specifically requested resource instance, if an ID was supplied to resource constructor.
         * @abstract
         */
        read(ctx?: any): SCIMMY.Messages.ListResponse | SCIMMY.Types.Schema;
        /**
         * Calls resource's ingress method for consumption after unwrapping the SCIM resource
         * @param {Object} instance - the raw resource type instance for consumption by ingress method
         * @param {*} [ctx] - any additional context information to pass to the ingress handler
         * @returns {SCIMMY.Types.Schema} the consumed resource type instance
         * @abstract
         */
        write(instance: any, ctx?: any): SCIMMY.Types.Schema;
        /**
         * Retrieves resources via egress method, and applies specified patch operations.
         * Emits patched resources for consumption with resource's ingress method.
         * @param {Object} message - the PatchOp message to apply to the received resource
         * @param {*} [ctx] - any additional context information to pass to the ingress/egress handlers
         * @returns {SCIMMY.Types.Schema} the resource type instance after patching and consumption by ingress method
         * @abstract
         */
        patch(message: any, ctx?: any): SCIMMY.Types.Schema;
        /**
         * Calls resource's degress method for disposal of the SCIM resource
         * @param {*} [ctx] - any additional context information to pass to the degress handler
         * @abstract
         */
        dispose(ctx?: any): void;
    }
    import { Filter } from "lib/types/filter";
}
declare module "lib/types" {
    /**
     * SCIMMY Types Container Class
     * @namespace SCIMMY.Types
     * @description
     * SCIMMY provides a singleton class, `SCIMMY.Types`, that exposes the building blocks used to create SCIM schemas and resource types, and handle SCIM schema and protocol errors.
     * These can be used to construct custom resource types and handle errors encountered when invoking supplied read/write/delete handlers of built-in resources.
     */
    export default class Types {
        static Attribute: typeof Attribute;
        static SchemaDefinition: typeof SchemaDefinition;
        static Schema: typeof Schema;
        static Resource: typeof Resource;
        static Filter: typeof Filter;
        static Error: typeof Error;
    }
    import { Attribute } from "lib/types/attribute";
    import { SchemaDefinition } from "lib/types/definition";
    import { Schema } from "lib/types/schema";
    import { Resource } from "lib/types/resource";
    import { Filter } from "lib/types/filter";
    import { SCIMError as Error } from "lib/types/error";
}
declare module "lib/messages/error" {
    /**
     * SCIM Error Message
     * @alias SCIMMY.Messages.Error
     * @summary
     * *   Formats exceptions to conform to the [HTTP Status and Error Response Handling](https://datatracker.ietf.org/doc/html/rfc7644#section-3.12) section of the SCIM protocol, ensuring HTTP status codes and scimType error detail keyword pairs are valid.
     * *   When used to parse service provider responses, throws a new instance of `SCIMMY.Types.Error` with details sourced from the message.
     */
    export class ErrorMessage extends Error {
        /**
         * SCIM Error Message Schema ID
         * @type {String}
         * @private
         */
        private static "__#5@#id";
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
        constructor(ex?: any);
        schemas: string[];
        status: string;
        scimType: string;
        detail: any;
    }
}
declare module "lib/messages/listresponse" {
    /**
     * SCIM List Response Message
     * @alias SCIMMY.Messages.ListResponse
     * @summary
     * *   Formats supplied service provider resources as [ListResponse messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2), handling pagination and sort when required.
     */
    export class ListResponse {
        /**
         * SCIM List Response Message Schema ID
         * @type {String}
         * @private
         */
        private static "__#6@#id";
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
        constructor(request?: any | SCIMMY.Types.Schema[], params?: {
            sortBy?: string;
            sortOrder?: string;
            startIndex?: number;
            count?: number;
            itemsPerPage?: number;
        });
        schemas: string[];
        totalResults: any;
        Resources: any;
        startIndex: number;
        itemsPerPage: number;
    }
}
declare module "lib/messages/patchop" {
    /**
     * SCIM Patch Operation Message
     * @alias SCIMMY.Messages.PatchOp
     * @summary
     * *   Parses [PatchOp messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.5.2), making sure all specified "Operations" are valid and conform with the SCIM protocol.
     * *   Provides a method to atomically apply PatchOp operations to a resource instance, handling any exceptions that occur along the way.
     */
    export class PatchOp {
        /**
         * SCIM Patch Operation Message Schema ID
         * @type {String}
         * @private
         */
        private static "__#7@#id";
        /**
         * Instantiate a new SCIM Patch Operation Message with relevant details
         * @param {Object} request - contents of the patch operation request being performed
         * @property {Object[]} Operations - list of SCIM-compliant patch operations to apply to the given resource
         */
        constructor(request: any);
        schemas: string[];
        Operations: any[];
        /**
         * Apply patch operations to a resource as defined by the PatchOp instance
         * @param {SCIMMY.Types.Schema} resource - the schema instance the patch operation will be performed on
         * @param {Function} [finalise] - method to call when all operations are complete, to feed target back through model
         * @returns {Promise<SCIMMY.Types.Schema>} an instance of the resource modified as per the included patch operations
         */
        apply(resource: SCIMMY.Types.Schema, finalise?: Function): Promise<SCIMMY.Types.Schema>;
        #private;
    }
}
declare module "lib/messages/bulkresponse" {
    /**
     * SCIM Bulk Response Message
     * @alias SCIMMY.Messages.BulkResponse
     * @since 1.0.0
     * @summary
     * *   Encapsulates bulk operation results as [BulkResponse messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.7) for consumption by a client.
     * *   Provides a method to unwrap BulkResponse results into operation success status, and map newly created resource IDs to their BulkRequest bulkIds.
     */
    export class BulkResponse {
        /**
         * SCIM BulkResponse Message Schema ID
         * @type {String}
         * @private
         */
        private static "__#8@#id";
        /**
         * Instantiate a new SCIM BulkResponse message from the supplied Operations
         * @param {Object|Object[]} request - contents of the BulkResponse if object, or results of performed operations if array
         * @param {Object[]} [request.Operations] - list of applied SCIM-compliant bulk operation results, if request is an object
         * @property {Object[]} Operations - list of BulkResponse operation results
         */
        constructor(request?: any | any[]);
        schemas: string[];
        Operations: any[];
        /**
         * Resolve bulkIds of POST operations into new resource IDs
         * @returns {Map<String, String|Boolean>} map of bulkIds to resource IDs if operation was successful, or false if not
         */
        resolve(): Map<string, string | boolean>;
    }
}
declare module "lib/schemas/user" {
    const User_base: typeof import("lib/types/schema").Schema;
    /**
     * SCIM User Schema
     * @alias SCIMMY.Schemas.User
     * @summary
     * *   Ensures a User instance conforms to the User schema set out in [RFC7643§4.1](https://datatracker.ietf.org/doc/html/rfc7643#section-4.1).
     */
    export class User extends User_base {
        /** @implements {SCIMMY.Types.Schema.definition} */
        static get definition(): import("lib/types/definition").SchemaDefinition;
        /** @private */
        private static "__#9@#definition";
        /**
         * Instantiates a new user that conforms to the SCIM User schema definition
         * @extends SCIMMY.Types.Schema
         * @param {Object} resource - the source data to feed through the schema definition
         * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
         * @param {String} [basepath] - the base path for resolution of a resource's location
         * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
         */
        constructor(resource: any, direction?: string, basepath?: string, filters?: SCIMMY.Types.Filter);
    }
    export {};
}
declare module "lib/schemas/group" {
    const Group_base: typeof import("lib/types/schema").Schema;
    /**
     * SCIM Group Schema
     * @alias SCIMMY.Schemas.Group
     * @summary
     * *   Ensures a Group instance conforms to the Group schema set out in [RFC7643§4.2](https://datatracker.ietf.org/doc/html/rfc7643#section-4.2).
     */
    export class Group extends Group_base {
        /** @implements {SCIMMY.Types.Schema.definition} */
        static get definition(): import("lib/types/definition").SchemaDefinition;
        /** @private */
        private static "__#10@#definition";
        /**
         * Instantiates a new group that conforms to the SCIM Group schema definition
         * @extends SCIMMY.Types.Schema
         * @param {Object} resource - the source data to feed through the schema definition
         * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
         * @param {String} [basepath] - the base path for resolution of a resource's location
         * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
         */
        constructor(resource: any, direction?: string, basepath?: string, filters?: SCIMMY.Types.Filter);
    }
    export {};
}
declare module "lib/schemas/enterpriseuser" {
    const EnterpriseUser_base: typeof import("lib/types/schema").Schema;
    /**
     * SCIM EnterpriseUser Schema
     * @alias SCIMMY.Schemas.EnterpriseUser
     * @summary
     * *   Ensures an EnterpriseUser instance conforms to the EnterpriseUser schema extension set out in [RFC7643§4.3](https://datatracker.ietf.org/doc/html/rfc7643#section-4.3).
     * *   Can be used directly, but is typically used to extend the `SCIMMY.Schemas.User` schema definition.
     */
    export class EnterpriseUser extends EnterpriseUser_base {
        /** @implements {SCIMMY.Types.Schema.definition} */
        static get definition(): import("lib/types/definition").SchemaDefinition;
        /** @private */
        private static "__#11@#definition";
        /**
         * Instantiates a new enterprise user that conforms to the SCIM EnterpriseUser schema definition
         * @extends SCIMMY.Types.Schema
         * @param {Object} resource - the source data to feed through the schema definition
         * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
         * @param {String} [basepath] - the base path for resolution of a resource's location
         * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
         */
        constructor(resource: any, direction?: string, basepath?: string, filters?: SCIMMY.Types.Filter);
    }
    export {};
}
declare module "lib/schemas/resourcetype" {
    const ResourceType_base: typeof import("lib/types/schema").Schema;
    /**
     * SCIM ResourceType Schema
     * @alias SCIMMY.Schemas.ResourceType
     * @summary
     * *   Ensures a ResourceType instance conforms to the ResourceType schema set out in [RFC7643§6](https://datatracker.ietf.org/doc/html/rfc7643#section-6).
     */
    export class ResourceType extends ResourceType_base {
        /** @implements {SCIMMY.Types.Schema.definition} */
        static get definition(): import("lib/types/definition").SchemaDefinition;
        /** @private */
        private static "__#12@#definition";
        /**
         * Instantiates a new resource type that conforms to the SCIM ResourceType schema definition
         * @extends SCIMMY.Types.Schema
         * @param {Object} resource - the source data to feed through the schema definition
         * @param {String} [basepath] - the base path for resolution of a resource's location
         */
        constructor(resource: any, basepath?: string);
    }
    export {};
}
declare module "lib/schemas/spconfig" {
    const ServiceProviderConfig_base: typeof import("lib/types/schema").Schema;
    /**
     * SCIM Service Provider Configuration Schema
     * @alias SCIMMY.Schemas.ServiceProviderConfig
     * @summary
     * *   Ensures a ServiceProviderConfig instance conforms to the Service Provider Configuration schema set out in [RFC7643§5](https://datatracker.ietf.org/doc/html/rfc7643#section-5).
     */
    export class ServiceProviderConfig extends ServiceProviderConfig_base {
        /** @private */
        private static "__#13@#definition";
        /**
         * Instantiates a new service provider configuration that conforms to the SCIM ServiceProviderConfig schema definition
         * @extends SCIMMY.Types.Schema
         * @param {Object} resource - the source data to feed through the schema definition
         * @param {String} [basepath] - the base path for resolution of a resource's location
         */
        constructor(resource: any, basepath?: string);
    }
    export {};
}
declare module "lib/schemas" {
    /**
     * SCIMMY Schemas Container Class
     * @namespace SCIMMY.Schemas
     * @description
     * SCIMMY provides a singleton class, `SCIMMY.Schemas`, that is used to declare schema definitions implemented by a SCIM Service Provider.
     * It also provides access to supplied implementations of core resource type schema definitions.
     * It is also used to retrieve a service provider's declared schema definitions to be sent via the Schemas HTTP endpoint.
     *
     * > **Note:**
     * > The `SCIMMY.Schemas` class is a singleton, which means that declared schema definitions
     * > will remain the same, regardless of where the class is accessed from within your code.
     *
     * ## Declaring Definitions
     * Schema definitions are typically declared automatically at the same time as resource type instances are declared in `{@link SCIMMY.Resources}`.
     * If necessary, schema definitions can be declared manually with the `{@link SCIMMY.Schemas.declare}` method.
     * Nested definitions that extend declared schema definitions are also automatically declared to the `SCIMMY.Schemas` class.
     * ```
     * // Manually declare the EnterpriseUser schema definition
     * SCIMMY.Schemas.declare(SCIMMY.Schemas.EnterpriseUser.definition);
     * ```
     *
     * Once declared, schema definitions are made available to the `{@link SCIMMY.Resources.Schema}`
     * resource type, which handles formatting them for transmission/consumption according to the Schema Definition schema
     * set out in [RFC7643§7](https://datatracker.ietf.org/doc/html/rfc7643#section-7).
     *
     * Each schema definition must be declared with a unique name, and each name can only be declared once.
     * Attempting to declare a new schema definition with a name that has already been declared will throw a TypeError with the
     * message `"Schema definition '<name>' already declared with id '<id>'"`, where `<name>` and `<id>` are the name and id,
     * respectively, of the existing schema definition.
     *
     * Similarly, each schema definition can only be declared under one name.
     * Attempting to declare an existing schema definition under a new name will throw a TypeError with the message
     * `"Schema definition '<id>' already declared with name '<name>'"`, where `<id>` and `<name>` are the id and name,
     * respectively, of the existing schema definition.
     *
     * ```
     * // Declaring a schema definition under a different name
     * let definition = new SCIMMY.Types.SchemaDefinition("User", "urn:ietf:params:scim:schemas:MyOrg:CustomUser", "MyOrg Custom User");
     * SCIMMY.Schemas.declare(definition, "CustomUser");
     * ```
     *
     * ## Modifying Definitions
     * Not all SCIM clients and service providers support every attribute defined in the SCIM core schemas,
     * and conversely, some custom attributes may not be defined in the core schemas. In such situations,
     * it is possible to modify schema definitions using their `{@link SCIMMY.Types.SchemaDefinition#extend extend}`
     * and `{@link SCIMMY.Types.SchemaDefinition#truncate truncate}` instance methods.
     *
     * > **Note:**
     * > Like the `SCIMMY.Schemas` class, the schema implementations included in this class are all singletons,
     * > and any changes to their schema definitions will persist across any location they are accessed.
     *
     * ```
     * // Remove unsupported "name" sub-attributes from the User schema definition
     * SCIMMY.Schemas.User.definition.truncate(["name.middleName", "name.honorificPrefix", "name.honorificSuffix"]);
     *
     * // Remove unsupported "ims" attribute and its sub-attributes from the User schema
     * SCIMMY.Schemas.User.definition.truncate(["ims"]);
     *
     * // Add custom "mail" attribute to the Group schema definition
     * SCIMMY.Schemas.Group.definition.extend([new SCIMMY.Types.Attribute("string", "mail", {required: true})]);
     *
     * // Extend the User schema definition with the EnterpriseUser schema definition, and make it required
     * SCIMMY.Schemas.User.definition.extend(SCIMMY.Schemas.EnterpriseUser.definition, true);
     *
     * // Remove the EnterpriseUser extension schema definition from the User schema definition
     * SCIMMY.Schemas.User.definition.truncate(SCIMMY.Schemas.EnterpriseUser.definition);
     * ```
     */
    export default class Schemas {
        static "__#14@#definitions": Map<any, any>;
        static "__#14@#idsToNames": Map<any, any>;
        static User: typeof User;
        static Group: typeof Group;
        static EnterpriseUser: typeof EnterpriseUser;
        static ResourceType: typeof ResourceType;
        static ServiceProviderConfig: typeof ServiceProviderConfig;
        /**
         * Register a SchemaDefinition implementation for exposure via Schemas HTTP endpoint
         * @param {SCIMMY.Types.SchemaDefinition} definition - the schema definition to register
         * @param {String} [name] - the name of the definition being declared, if different from definition's name property
         * @returns {SCIMMY.Schemas} the Schemas class for chaining
         */
        static declare(definition: SCIMMY.Types.SchemaDefinition, name?: string): SCIMMY.Schemas;
        /**
         * Get registration status of specific schema definition, or get all registered schema definitions
         * @param {SCIMMY.Types.SchemaDefinition|String} [definition] - the schema definition or name to query registration status for
         * @returns {SCIMMY.Types.SchemaDefinition[]|SCIMMY.Types.SchemaDefinition|Boolean}
         * *   Array containing declared schema definitions for exposure via Schemas HTTP endpoint, if no arguments are supplied.
         * *   The registered schema definition with matching name or ID, or undefined, if a string argument is supplied.
         * *   The registration status of the specified schema definition, if a class extending `SCIMMY.Types.SchemaDefinition` was supplied.
         */
        static declared(definition?: SCIMMY.Types.SchemaDefinition | string): SCIMMY.Types.SchemaDefinition[] | SCIMMY.Types.SchemaDefinition | boolean;
    }
    import { User } from "lib/schemas/user";
    import { Group } from "lib/schemas/group";
    import { EnterpriseUser } from "lib/schemas/enterpriseuser";
    import { ResourceType } from "lib/schemas/resourcetype";
    import { ServiceProviderConfig } from "lib/schemas/spconfig";
}
declare module "lib/resources/user" {
    const User_base: typeof import("lib/types/resource").Resource;
    /**
     * SCIM User Resource
     * @alias SCIMMY.Resources.User
     * @summary
     * *   Handles read/write/patch/dispose operations for SCIM User resources with specified ingress/egress/degress methods.
     * *   Formats SCIM User resources for transmission/consumption using the `{@link SCIMMY.Schemas.User}` schema class.
     */
    export class User extends User_base {
        /** @private */
        private static "__#15@#basepath";
        /** @implements {SCIMMY.Types.Resource.basepath} */
        static basepath(path: any): any;
        /** @implements {SCIMMY.Types.Resource.schema} */
        static get schema(): typeof import("lib/schemas/user").User;
        /** @private */
        private static "__#15@#ingress";
        /** @implements {SCIMMY.Types.Resource.ingress} */
        static ingress(handler: any): typeof User;
        /** @private */
        private static "__#15@#egress";
        /** @implements {SCIMMY.Types.Resource.egress} */
        static egress(handler: any): typeof User;
        /** @private */
        private static "__#15@#degress";
        /** @implements {SCIMMY.Types.Resource.degress} */
        static degress(handler: any): typeof User;
        /**
         * Instantiate a new SCIM User resource and parse any supplied parameters
         * @extends SCIMMY.Types.Resource
         */
        constructor(...params: any[]);
        /**
         * @implements {SCIMMY.Types.Resource#write}
         * @returns {SCIMMY.Schemas.User}
         * @example
         * // Create a new user with userName "someGuy"
         * await new SCIMMY.Resources.User().write({userName: "someGuy"});
         * @example
         * // Set userName attribute to "someGuy" for user with ID "1234"
         * await new SCIMMY.Resources.User("1234").write({userName: "someGuy"});
         */
        write(instance: any, ctx: any): SCIMMY.Schemas.User;
        /**
         * @implements {SCIMMY.Types.Resource#patch}
         * @see SCIMMY.Messages.PatchOp
         * @returns {SCIMMY.Schemas.User}
         * @example
         * // Set userName to "someGuy" for user with ID "1234" with a patch operation (see SCIMMY.Messages.PatchOp)
         * await new SCIMMY.Resources.User("1234").patch({Operations: [{op: "add", value: {userName: "someGuy"}}]});
         */
        patch(message: any, ctx: any): SCIMMY.Schemas.User;
        /**
         * @implements {SCIMMY.Types.Resource#dispose}
         * @example
         * // Delete user with ID "1234"
         * await new SCIMMY.Resources.User("1234").dispose();
         */
        dispose(ctx: any): Promise<void>;
    }
    export {};
}
declare module "lib/resources/group" {
    const Group_base: typeof import("lib/types/resource").Resource;
    /**
     * SCIM Group Resource
     * @alias SCIMMY.Resources.Group
     * @summary
     * *   Handles read/write/patch/dispose operations for SCIM Group resources with specified ingress/egress/degress methods.
     * *   Formats SCIM Group resources for transmission/consumption using the `{@link SCIMMY.Schemas.Group}` schema class.
     */
    export class Group extends Group_base {
        /** @private */
        private static "__#16@#basepath";
        /** @implements {SCIMMY.Types.Resource.basepath} */
        static basepath(path: any): any;
        /** @implements {SCIMMY.Types.Resource.schema} */
        static get schema(): typeof import("lib/schemas/group").Group;
        /** @private */
        private static "__#16@#ingress";
        /** @implements {SCIMMY.Types.Resource.ingress} */
        static ingress(handler: any): typeof Group;
        /** @private */
        private static "__#16@#egress";
        /** @implements {SCIMMY.Types.Resource.egress} */
        static egress(handler: any): typeof Group;
        /** @private */
        private static "__#16@#degress";
        /** @implements {SCIMMY.Types.Resource.degress} */
        static degress(handler: any): typeof Group;
        /**
         * Instantiate a new SCIM Group resource and parse any supplied parameters
         * @extends SCIMMY.Types.Resource
         */
        constructor(...params: any[]);
        /**
         * @implements {SCIMMY.Types.Resource#write}
         * @returns {SCIMMY.Schemas.Group}
         * @example
         * // Create a new group with displayName "A Group"
         * await new SCIMMY.Resources.Group().write({displayName: "A Group"});
         * @example
         * // Set members attribute for group with ID "1234"
         * await new SCIMMY.Resources.Group("1234").write({members: [{value: "5678"}]});
         */
        write(instance: any, ctx: any): SCIMMY.Schemas.Group;
        /**
         * @implements {SCIMMY.Types.Resource#patch}
         * @see SCIMMY.Messages.PatchOp
         * @returns {SCIMMY.Schemas.Group}
         * @example
         * // Add member to group with ID "1234" with a patch operation (see SCIMMY.Messages.PatchOp)
         * await new SCIMMY.Resources.Group("1234").patch({Operations: [{op: "add", path: "members", value: {value: "5678"}}]});
         */
        patch(message: any, ctx: any): SCIMMY.Schemas.Group;
        /**
         * @implements {SCIMMY.Types.Resource#dispose}
         * @example
         * // Delete group with ID "1234"
         * await new SCIMMY.Resources.Group("1234").dispose();
         */
        dispose(ctx: any): Promise<void>;
    }
    export {};
}
declare module "lib/resources/schema" {
    const Schema_base: typeof import("lib/types/resource").Resource;
    /**
     * SCIM Schema Resource
     * @alias SCIMMY.Resources.Schema
     * @summary
     * *   Formats SCIM schema definition implementations declared in `{@link SCIMMY.Schemas}` for transmission/consumption according to the Schema Definition schema set out in [RFC7643§7](https://datatracker.ietf.org/doc/html/rfc7643#section-7).
     */
    export class Schema extends Schema_base {
        /** @private */
        private static "__#17@#basepath";
        /** @implements {SCIMMY.Types.Resource.basepath} */
        static basepath(path: any): any;
        /**
         * @implements {SCIMMY.Types.Resource.extend}
         * @throws {TypeError} SCIM 'Schema' resource does not support extension
         */
        static extend(): void;
        /**
         * Instantiate a new SCIM Schema resource and parse any supplied parameters
         * @extends SCIMMY.Types.Resource
         */
        constructor(id: any, config: any);
        /**
         * @implements {SCIMMY.Types.Resource#read}
         * @returns {SCIMMY.Messages.ListResponse|Object}
         */
        read(): SCIMMY.Messages.ListResponse | any;
    }
    export {};
}
declare module "lib/resources/resourcetype" {
    const ResourceType_base: typeof import("lib/types/resource").Resource;
    /**
     * SCIM ResourceType Resource
     * @alias SCIMMY.Resources.ResourceType
     * @summary
     * *   Formats SCIM Resource Type implementations declared in `{@link SCIMMY.Resources}` for transmission/consumption according to the ResourceType schema set out in [RFC7643§6](https://datatracker.ietf.org/doc/html/rfc7643#section-6).
     */
    export class ResourceType extends ResourceType_base {
        /** @private */
        private static "__#18@#basepath";
        /** @implements {SCIMMY.Types.Resource.basepath} */
        static basepath(path: any): any;
        /**
         * @implements {SCIMMY.Types.Resource.extend}
         * @throws {TypeError} SCIM 'ResourceType' resource does not support extension
         */
        static extend(): void;
        /**
         * Instantiate a new SCIM ResourceType resource and parse any supplied parameters
         * @extends SCIMMY.Types.Resource
         */
        constructor(id: any, config: any);
        /**
         * @implements {SCIMMY.Types.Resource#read}
         * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Schemas.ResourceType}
         */
        read(): SCIMMY.Messages.ListResponse | SCIMMY.Schemas.ResourceType;
    }
    export {};
}
declare module "lib/config" {
    /**
     * SCIMMY Service Provider Configuration Class
     * @namespace SCIMMY.Config
     * @description
     * SCIMMY provides a singleton class, `SCIMMY.Config`, that acts as a central store for a SCIM Service Provider's configuration.
     * It is used for defining SCIM specification features supported (e.g. PATCH, sort, filter, etc).
     * This can be either directly by an implementing service provider, or retrieved by a client (identity provider) from a remote service provider.
     * By default, all specification features are marked as disabled, as your implementation may not support them.
     *
     * ## Retrieving Configuration
     * The stored configuration can be retrieved by calling `{@link SCIMMY.Config.get}()`, which returns a cloned object
     * representing the configuration _at the time of retrieval_.
     *
     * > **Note:**
     * > To prevent accidental configuration changes, the returned object has been trapped, and attempting to change a configuration
     * > value directly on this object will throw a TypeError with the message `"SCIM Configuration can only be changed via the 'set' method"`
     *
     * The structure of the object reflects the example provided in [RFC7643§8.5](https://datatracker.ietf.org/doc/html/rfc7643#section-8.5):
     * ```json
     * {
     *    "documentationUri": "/path/to/documentation.html",
     *    "patch": {
     *        "supported": false
     *    },
     *    "bulk": {
     *        "supported": false,
     *        "maxOperations": 1000,
     *        "maxPayloadSize": 1048576
     *    },
     *    "filter": {
     *        "supported": false,
     *        "maxResults": 200
     *    },
     *    "changePassword": {
     *        "supported": false
     *    },
     *    "sort": {
     *        "supported": false
     *    },
     *    "etag": {
     *        "supported": false
     *    },
     *    "authenticationSchemes": []
     * }
     * ```
     *
     * ## Setting Configuration
     * The stored configuration can be changed via the `{@link SCIMMY.Config.set}` method. This method can be called either with an object representing the new configuration, or with a configuration property name string and value pair.
     * *   Where the only child property of a top-level configuration property is "supported", a boolean can be supplied as the value, which will be used as the value of the "supported" property.
     *     ```js
     *     // This will set patch.supported to true
     *     SCIMMY.Config.set("patch", true);
     *     ```
     * *   The "filter" and "bulk" properties also accept a number value, which will be interpreted as being the value of the "maxResults" and "maxOperations" child properties respectively, and will automatically set "supported" to true.
     *     ```js
     *     // This will set filter.maxResults to 20, and filter.supported to true
     *     SCIMMY.Config.set("filter", 20);
     *     ```
     *
     * > **Note:**
     * > Supplied values are validated against SCIMMY's ServiceProviderConfig schema definition.
     * > Providing values with incompatible types (e.g. the string "100" instead of the number 100) will throw a TypeError.
     * > This ensures configuration values always conform to the standard. See [RFC7643§5](https://datatracker.ietf.org/doc/html/rfc7643#section-5) for more information.
     *
     * Multiple values can also be set at the same time, and changes are cumulative, so omitted properties will not be unset:
     * ```js
     * // With both shorthand and full syntax
     * SCIMMY.Config.set({
     *    documentationUri: "https://example.com/docs/scim.html",
     *    patch: true,
     *    filter: 100,
     *    bulk: {
     *        supported: true,
     *        maxPayloadSize: 2097152
     *    },
     *    authenticationSchemes: [
     *        {/ Your authentication scheme details /}
     *    ]
     * });
     * ```
     *
     * ### Authentication Schemes
     * Service provider authentication schemes can be set in the same way as other configuration properties, and are cumulative.
     * The authenticationSchemes collection can be reset by providing an empty array as the value for the authenticationSchemes property.
     * ```js
     * // Both of these will append the supplied values to the authenticationSchemes property
     * SCIMMY.Config.set("authenticationSchemes", {/ Your authentication scheme details /});
     * SCIMMY.Config.set("authenticationSchemes", [
     *      {/ Your primary authentication scheme details /},
     *      {/ Your secondary authentication scheme details /}
     * ]);
     *
     * // Reset the authenticationSchemes collection
     * SCIMMY.Config.set("authenticationSchemes", []);
     * ```
     */
    export default class Config {
        /**
         * Store the configuration
         * @private
         */
        private static "__#19@#config";
        /**
         * Get SCIM service provider configuration
         * @returns {Object} the service provider configuration, proxied for protection
         */
        static get(): any;
        /**
         * Set SCIM service provider configuration
         * @param {Array<Object|String>} args - the configuration key name or value to apply
         * @param {Object} args - the new configuration to apply to the service provider config instance
         * @param {String} args - the name of the configuration property to set
         * @param {Object|Boolean} args - the new value of the configuration property to set
         * @returns {Object|typeof SCIMMY.Config} the updated configuration instance, or the config container class for chaining
         */
        static set(...args: Array<any | string>): any | typeof SCIMMY.Config;
    }
}
declare module "lib/resources/spconfig" {
    const ServiceProviderConfig_base: typeof import("lib/types/resource").Resource;
    /**
     * SCIM ServiceProviderConfig Resource
     * @alias SCIMMY.Resources.ServiceProviderConfig
     * @summary
     * *   Formats SCIM Service Provider Configuration set in `{@link SCIMMY.Config}` for transmission/consumption according to the Service Provider Configuration schema set out in [RFC7643§5](https://datatracker.ietf.org/doc/html/rfc7643#section-5).
     */
    export class ServiceProviderConfig extends ServiceProviderConfig_base {
        /** @private */
        private static "__#20@#basepath";
        /** @implements {SCIMMY.Types.Resource.basepath} */
        static basepath(path: any): any;
        /**
         * @implements {SCIMMY.Types.Resource.extend}
         * @throws {TypeError} SCIM 'ServiceProviderConfig' resource does not support extension
         */
        static extend(): void;
        /**
         * Instantiate a new SCIM ServiceProviderConfig resource and parse any supplied parameters
         * @extends SCIMMY.Types.Resource
         */
        constructor(...params: any[]);
        /**
         * @implements {SCIMMY.Types.Resource#read}
         * @returns {SCIMMY.Schemas.ServiceProviderConfig}
         */
        read(): SCIMMY.Schemas.ServiceProviderConfig;
    }
    export {};
}
declare module "lib/resources" {
    /**
     * SCIMMY Resources Container Class
     * @namespace SCIMMY.Resources
     * @description
     * SCIMMY provides a singleton class, `SCIMMY.Resources`, that is used to declare resource types implemented by a SCIM Service Provider.
     * It also provides access to supplied implementations of core resource types that can be used to easily support well-known resource types.
     * It is also used to retrieve a service provider's declared resource types to be sent via the ResourceTypes HTTP endpoint.
     *
     * > **Note:**
     * > The `SCIMMY.Resources` class is a singleton, which means that declared resource types
     * > will remain the same, regardless of where the class is accessed from within your code.
     *
     * ## Declaring Resource Types
     * Resource type implementations can be declared by calling `{@link SCIMMY.Resources.declare}`.
     * This method will add the given resource type implementation to the list of declared resource types, and automatically
     * declare the resource type's schema, and any schema extensions it may have, to the `{@link SCIMMY.Schemas}` class.
     * ```
     * // Declare several resource types at once
     * SCIMMY.Resources.declare(SCIMMY.Resources.User, {}).declare(SCIMMY.Resources.Group, {});
     * ```
     *
     * Once declared, resource type implementations are made available to the `{@link SCIMMY.Resources.ResourceType}`
     * resource type, which handles formatting them for transmission/consumption according to the ResourceType schema
     * set out in [RFC7643§6](https://datatracker.ietf.org/doc/html/rfc7643#section-6).
     *
     * Each resource type implementation must be declared with a unique name, and each name can only be declared once.
     * Attempting to declare a resource type with a name that has already been declared will throw a TypeError with the
     * message `"Resource '<name>' already declared"`, where `<name>` is the name of the resource type.
     *
     * Similarly, each resource type implementation can only be declared under one name.
     * Attempting to declare an existing resource type under a new name will throw a TypeError with the message
     * `"Resource '<name>' already declared with name '<existing>'"`, where `<name>` and `<existing>` are the targeted name
     * and existing name, respectively, of the resource type.
     *
     * ```
     * // Declaring a resource type under a different name
     * class User extends SCIMMY.Types.Resource {/ Your resource type implementation /}
     * SCIMMY.Resources.declare(User, "CustomUser");
     * ```
     *
     * ### Extending Resource Types
     * With the exception of the `ResourceType`, `Schema`, and `ServiceProviderConfig` resources, resource type implementations
     * can have schema extensions attached to them via the `{@link SCIMMY.Types.Resource.extend extend}` method inherited from
     * the `{@link SCIMMY.Types.Resource}` class. Schema extensions added to resource type implementations will automatically
     * be included in the `schemaExtensions` attribute when formatted by the `ResourceType` resource, and the extension's
     * schema definition declared to the `{@link SCIMMY.Schemas}` class.
     *
     * Resource type implementations can be extended:
     * *   At the time of declaration via the declaration config object:
     *     ```
     *     // Add the EnterpriseUser schema as a required extension at declaration
     *     SCIMMY.Resources.declare(SCIMMY.Resources.User, {
     *          extensions: [{schema: SCIMMY.Schemas.EnterpriseUser, required: true}]
     *     });
     *     ```
     * *   Immediately after declaration via the resource's `{@link SCIMMY.Types.Resource.extend extend}` method:
     *     ```
     *     // Add the EnterpriseUser schema as a required extension after declaration
     *     SCIMMY.Resources.declare(SCIMMY.Resources.User).extend(SCIMMY.Schemas.EnterpriseUser, true);
     *     ```
     * *   Before or during declaration, directly on the resource, via the resource's `{@link SCIMMY.Types.Resource.extend extend}` method:
     *     ```
     *     // Add the EnterpriseUser schema as an optional extension before declaration
     *     SCIMMY.Resources.User.extend(SCIMMY.Schemas.EnterpriseUser, false);
     *     SCIMMY.Resources.declare(SCIMMY.Resources.User);
     *
     *     // Add the EnterpriseUser schema as a required extension during declaration
     *     SCIMMY.Resources.declare(SCIMMY.Resources.User.extend(SCIMMY.Schemas.EnterpriseUser, true));
     *     ```
     * *   Any time after declaration, directly on the retrieved resource, via the resource's `{@link SCIMMY.Types.Resource.extend extend}` method:
     *     ```
     *     // Add the EnterpriseUser schema as a required extension after declaration
     *     SCIMMY.Resources.declared("User").extend(SCIMMY.Schemas.EnterpriseUser, true);
     *     ```
     *
     * ## Retrieving Declared Types
     * Declared resource type implementations can be retrieved via the `{@link SCIMMY.Resources.declared}` method.
     * *   All currently declared resource types can be retrieved by calling the method with no arguments.
     *     ```
     *     // Returns a cloned object with resource type names as keys, and resource type implementation classes as values
     *     SCIMMY.Resources.declared();
     *     ```
     * *   Specific declared implementations can be retrieved by calling the method with the resource type name string.
     *     This will return the same resource type implementation class that was previously declared.
     *     ```
     *     // Returns the declared resource matching the specified name, or undefined if no resource matched the name
     *     SCIMMY.Resources.declared("MyResourceType");
     *     ```
     *
     * @example <caption>Basic usage with provided resource type implementations</caption>
     * SCIMMY.Resources.declare(SCIMMY.Resources.User)
     *      .ingress((resource, data) => {/ Your handler for creating or modifying user resources /})
     *      .egress((resource) => {/ Your handler for retrieving user resources /})
     *      .degress((resource) => {/ Your handler for deleting user resources /});
     * @example <caption>Advanced usage with custom resource type implementations</caption>
     * SCIMMY.Resources.declare(class MyResourceType extends SCIMMY.Types.Resource {
     *      read() {/ Your handler for retrieving resources /})
     *      write(data) {/ Your handler for creating or modifying resources /}
     *      dispose() {/ Your handler for deleting resources /})
     *      // ...the rest of your resource type implementation //
     * });
    */
    export default class Resources {
        /**
         * Store internal resources to prevent declaration
         * @private
         */
        private static "__#21@#internals";
        /**
         * Store declared resources for later retrieval
         * @private
         */
        private static "__#21@#declared";
        static Schema: typeof Schema;
        static ResourceType: typeof ResourceType;
        static ServiceProviderConfig: typeof ServiceProviderConfig;
        static User: typeof User;
        static Group: typeof Group;
        /**
         * Register a resource implementation for exposure as a ResourceType
         * @param {typeof SCIMMY.Types.Resource} resource - the resource type implementation to register
         * @param {Object|String} [config] - the configuration to feed to the resource being registered, or the name of the resource type implementation if different to the class name
         * @returns {typeof SCIMMY.Resources|typeof SCIMMY.Types.Resource} the Resources class or registered resource type class for chaining
         */
        static declare(resource: typeof SCIMMY.Types.Resource, config?: any | string): typeof SCIMMY.Resources | typeof SCIMMY.Types.Resource;
        /**
         * Get registration status of specific resource implementation, or get all registered resource implementations
         * @param {typeof SCIMMY.Types.Resource|String} [resource] - the resource implementation or name to query registration status for
         * @returns {Object|typeof SCIMMY.Types.Resource|Boolean}
         * *   A containing object with registered resource implementations for exposure as ResourceTypes, if no arguments are supplied.
         * *   The registered resource type implementation with matching name, or undefined, if a string argument is supplied.
         * *   The registration status of the specified resource implementation, if a class extending `SCIMMY.Types.Resource` is supplied.
         */
        static declared(resource?: typeof SCIMMY.Types.Resource | string): any | typeof SCIMMY.Types.Resource | boolean;
    }
    import { Schema } from "lib/resources/schema";
    import { ResourceType } from "lib/resources/resourcetype";
    import { ServiceProviderConfig } from "lib/resources/spconfig";
    import { User } from "lib/resources/user";
    import { Group } from "lib/resources/group";
}
declare module "lib/messages/bulkrequest" {
    /**
     * SCIM Bulk Request Message
     * @alias SCIMMY.Messages.BulkRequest
     * @since 1.0.0
     * @summary
     * *   Parses [BulkRequest messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.7), making sure "Operations" have been specified, and conform with the SCIM protocol.
     * *   Provides a method to apply BulkRequest operations and return the results as a BulkResponse.
     */
    export class BulkRequest {
        /**
         * SCIM BulkRequest Message Schema ID
         * @type {String}
         * @private
         */
        private static "__#22@#id";
        /**
         * Instantiate a new SCIM BulkResponse message from the supplied BulkRequest
         * @param {Object} request - contents of the BulkRequest operation being performed
         * @param {Object[]} request.Operations - list of SCIM-compliant bulk operations to apply
         * @param {Number} [request.failOnErrors] - number of error results to encounter before aborting any following operations
         * @param {Number} [maxOperations] - maximum number of operations supported in the request, as specified by the service provider
         * @property {Object[]} Operations - list of operations in this BulkRequest instance
         * @property {Number} [failOnErrors] - number of error results a service provider should tolerate before aborting any following operations
         */
        constructor(request: {
            Operations: any[];
            failOnErrors?: number;
        }, maxOperations?: number);
        schemas: string[];
        Operations: any[];
        failOnErrors: number;
        /**
         * Apply the operations specified by the supplied BulkRequest
         * @param {typeof SCIMMY.Types.Resource[]} [resourceTypes] - resource type classes to be used while processing bulk operations, defaults to declared resources
         * @param {*} [ctx] - any additional context information to pass to the ingress, egress, and degress handlers
         * @returns {SCIMMY.Messages.BulkResponse} a new BulkResponse Message instance with results of the requested operations
         */
        apply(resourceTypes?: (typeof SCIMMY.Types.Resource)[], ctx?: any): SCIMMY.Messages.BulkResponse;
        #private;
    }
}
declare module "lib/messages/searchrequest" {
    /**
     * SCIM Search Request Message
     * @alias SCIMMY.Messages.SearchRequest
     * @since 1.0.0
     * @summary
     * *   Encapsulates HTTP POST data as [SCIM SearchRequest messages](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.3).
     * *   Provides a method to perform the search request against the declared or specified resource types.
     */
    export class SearchRequest {
        /**
         * SCIM SearchRequest Message Schema ID
         * @type {String}
         * @private
         */
        private static "__#23@#id";
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
        constructor(request?: {
            filter?: string;
            excludedAttributes?: string[];
            attributes?: string[];
            sortBy?: string;
            sortOrder?: string;
            startIndex?: number;
            count?: number;
        });
        schemas: string[];
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
        prepare(params?: {
            filter?: string;
            excludedAttributes?: string[];
            attributes?: string[];
            sortBy?: string;
            sortOrder?: string;
            startIndex?: number;
            count?: number;
        }): SCIMMY.Messages.SearchRequest;
        filter: string;
        excludedAttributes: string[];
        attributes: string[];
        sortBy: string;
        sortOrder: string;
        startIndex: number;
        count: number;
        /**
         * Apply a search request operation, retrieving results from specified resource types
         * @param {typeof SCIMMY.Types.Resource[]} [resourceTypes] - resource type classes to be used while processing the search request, defaults to declared resources
         * @param {*} [ctx] - any additional context information to pass to the egress handler
         * @returns {SCIMMY.Messages.ListResponse} a ListResponse message with results of the search request
         */
        apply(resourceTypes?: (typeof SCIMMY.Types.Resource)[], ctx?: any): SCIMMY.Messages.ListResponse;
    }
}
declare module "lib/messages" {
    /**
     * SCIMMY Messages Container Class
     * @namespace SCIMMY.Messages
     * @description
     * SCIMMY provides a singleton class, `SCIMMY.Messages`, that includes tools for constructing and
     * consuming SCIM-compliant data messages to be sent to, or received from, a SCIM service provider.
     */
    export default class Messages {
        static Error: typeof ErrorMessage;
        static ListResponse: typeof ListResponse;
        static PatchOp: typeof PatchOp;
        static BulkRequest: typeof BulkRequest;
        static BulkResponse: typeof BulkResponse;
        static SearchRequest: typeof SearchRequest;
    }
    import { ErrorMessage } from "lib/messages/error";
    import { ListResponse } from "lib/messages/listresponse";
    import { PatchOp } from "lib/messages/patchop";
    import { BulkRequest } from "lib/messages/bulkrequest";
    import { BulkResponse } from "lib/messages/bulkresponse";
    import { SearchRequest } from "lib/messages/searchrequest";
}
declare module "scimmy" {
    /**
     * SCIMMY Container Class
     * @namespace SCIMMY
     * @description
     * SCIMMY exports a singleton class which provides the following interfaces:
     * *    `{@link SCIMMY.Config}`
     *      *   SCIM Service Provider Configuration container store.
     * *    `{@link SCIMMY.Types}`
     *      *   SCIMMY classes for implementing schemas and resource types.
     * *    `{@link SCIMMY.Messages}`
     *      *   Implementations of non-resource SCIM "message" schemas, such as ListResponse and PatchOp.
     * *    `{@link SCIMMY.Schemas}`
     *      *   Container store for declaring and retrieving schemas implemented by a service provider.
     *      *   Also provides access to bundled schema implementations of [SCIM Core Resource Schemas](https://datatracker.ietf.org/doc/html/rfc7643#section-4).
     * *    `{@link SCIMMY.Resources}`
     *      *   Container store for declaring and retrieving resource types implemented by a service provider.
     *      *   Also provides access to bundled resource type implementations of [SCIM Core Resource Types](https://datatracker.ietf.org/doc/html/rfc7643#section-4).
     */
    export default class SCIMMY {
        static Config: typeof Config;
        static Types: typeof Types;
        static Messages: typeof Messages;
        static Schemas: typeof Schemas;
        static Resources: typeof Resources;
    }
    import Config from "lib/config";
    import Types from "lib/types";
    import Messages from "lib/messages";
    import Schemas from "lib/schemas";
    import Resources from "lib/resources";
}
