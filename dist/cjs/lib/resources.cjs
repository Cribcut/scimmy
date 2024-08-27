'use strict';

const lib_types = require('./types.cjs');
const lib_messages = require('./messages.cjs');
const lib_schemas = require('./schemas.cjs');
const lib_config = require('./config.cjs');

/**
 * SCIM User Resource
 * @alias SCIMMY.Resources.User
 * @summary
 * *   Handles read/write/patch/dispose operations for SCIM User resources with specified ingress/egress/degress methods.
 * *   Formats SCIM User resources for transmission/consumption using the `{@link SCIMMY.Schemas.User}` schema class.
 */
class User extends lib_types.Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/Users";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return User.#basepath;
        else User.#basepath = (path.endsWith(User.endpoint) ? path : `${path}${User.endpoint}`);
        
        return User;
    }
    
    /** @implements {SCIMMY.Types.Resource.schema} */
    static get schema() {
        return lib_schemas.Schemas.User;
    }
    
    /** @private */
    static #ingress = () => {
        throw new lib_types.Types.Error(501, null, "Method 'ingress' not implemented by resource 'User'");
    };
    
    /** @implements {SCIMMY.Types.Resource.ingress} */
    static ingress(handler) {
        User.#ingress = handler;
        return User;
    }
    
    /** @private */
    static #egress = () => {
        throw new lib_types.Types.Error(501, null, "Method 'egress' not implemented by resource 'User'");
    };
    
    /** @implements {SCIMMY.Types.Resource.egress} */
    static egress(handler) {
        User.#egress = handler;
        return User;
    }
    
    /** @private */
    static #degress = () => {
        throw new lib_types.Types.Error(501, null, "Method 'degress' not implemented by resource 'User'");
    };
    
    /** @implements {SCIMMY.Types.Resource.degress} */
    static degress(handler) {
        User.#degress = handler;
        return User;
    }
    
    /**
     * Instantiate a new SCIM User resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(...params) {
        super(...params);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Schemas.User}
     * @example
     * // Retrieve user with ID "1234"
     * await new SCIMMY.Resources.User("1234").read();
     * @example
     * // Retrieve users with an email ending in "@example.com"
     * await new SCIMMY.Resources.User({filter: 'email.value ew "@example.com"'}).read();
     */
    async read(ctx) {
        if (!this.id) {
            return new lib_messages.Messages.ListResponse((await User.#egress(this, ctx) ?? [])
                .map(u => new lib_schemas.Schemas.User(u, "out", User.basepath(), this.attributes)), this.constraints);
        } else {
            try {
                const source = [await User.#egress(this, ctx)].flat().shift();
                if (!(source instanceof Object)) throw new lib_types.Types.Error(500, null, `Unexpected ${source === undefined ? "empty" : "invalid"} value returned by handler`);
                else return new lib_schemas.Schemas.User(source, "out", User.basepath(), this.attributes);
            } catch (ex) {
                if (ex instanceof lib_types.Types.Error) throw ex;
                else if (ex instanceof TypeError) throw new lib_types.Types.Error(400, "invalidValue", ex.message);
                else throw new lib_types.Types.Error(404, null, `Resource ${this.id} not found`);
            }
        }
    }
    
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
    async write(instance, ctx) {
        if (instance === undefined)
            throw new lib_types.Types.Error(400, "invalidSyntax", `Missing request body payload for ${!!this.id ? "PUT" : "POST"} operation`);
        if (Object(instance) !== instance || Array.isArray(instance))
            throw new lib_types.Types.Error(400, "invalidSyntax", `Operation ${!!this.id ? "PUT" : "POST"} expected request body payload to be single complex value`);
        
        try {
            const target = await User.#ingress(this, new lib_schemas.Schemas.User(instance, "in"), ctx);
            if (!(target instanceof Object)) throw new lib_types.Types.Error(500, null, `Unexpected ${target === undefined ? "empty" : "invalid"} value returned by handler`);
            else return new lib_schemas.Schemas.User(target, "out", User.basepath(), this.attributes);
        } catch (ex) {
            if (ex instanceof lib_types.Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new lib_types.Types.Error(400, "invalidValue", ex.message);
            else throw new lib_types.Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#patch}
     * @see SCIMMY.Messages.PatchOp
     * @returns {SCIMMY.Schemas.User}
     * @example
     * // Set userName to "someGuy" for user with ID "1234" with a patch operation (see SCIMMY.Messages.PatchOp)
     * await new SCIMMY.Resources.User("1234").patch({Operations: [{op: "add", value: {userName: "someGuy"}}]});
     */
    async patch(message, ctx) {
        if (!this.id)
            throw new lib_types.Types.Error(404, null, "PATCH operation must target a specific resource");
        if (message === undefined)
            throw new lib_types.Types.Error(400, "invalidSyntax", "Missing message body from PatchOp request");
        if (Object(message) !== message || Array.isArray(message))
            throw new lib_types.Types.Error(400, "invalidSyntax", "PatchOp request expected message body to be single complex value");
        
        return await new lib_messages.Messages.PatchOp(message)
            .apply(await this.read(ctx), async (instance) => await this.write(instance, ctx))
            .then(instance => !instance ? undefined : new lib_schemas.Schemas.User(instance, "out", User.basepath(), this.attributes));
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#dispose}
     * @example
     * // Delete user with ID "1234"
     * await new SCIMMY.Resources.User("1234").dispose();
     */
    async dispose(ctx) {
        if (!this.id)
            throw new lib_types.Types.Error(404, null, "DELETE operation must target a specific resource");
        
        try {
            await User.#degress(this, ctx);
        } catch (ex) {
            if (ex instanceof lib_types.Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new lib_types.Types.Error(500, null, ex.message);
            else throw new lib_types.Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
}

/**
 * SCIM Group Resource
 * @alias SCIMMY.Resources.Group
 * @summary
 * *   Handles read/write/patch/dispose operations for SCIM Group resources with specified ingress/egress/degress methods.
 * *   Formats SCIM Group resources for transmission/consumption using the `{@link SCIMMY.Schemas.Group}` schema class.
 */
class Group extends lib_types.Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/Groups";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return Group.#basepath;
        else Group.#basepath = (path.endsWith(Group.endpoint) ? path : `${path}${Group.endpoint}`);
        
        return Group;
    }
    
    /** @implements {SCIMMY.Types.Resource.schema} */
    static get schema() {
        return lib_schemas.Schemas.Group;
    }
    
    /** @private */
    static #ingress = () => {
        throw new lib_types.Types.Error(501, null, "Method 'ingress' not implemented by resource 'Group'");
    };
    
    /** @implements {SCIMMY.Types.Resource.ingress} */
    static ingress(handler) {
        Group.#ingress = handler;
        return Group;
    }
    
    /** @private */
    static #egress = () => {
        throw new lib_types.Types.Error(501, null, "Method 'egress' not implemented by resource 'Group'");
    };
    
    /** @implements {SCIMMY.Types.Resource.egress} */
    static egress(handler) {
        Group.#egress = handler;
        return Group;
    }
    
    /** @private */
    static #degress = () => {
        throw new lib_types.Types.Error(501, null, "Method 'degress' not implemented by resource 'Group'");
    };
    
    /** @implements {SCIMMY.Types.Resource.degress} */
    static degress(handler) {
        Group.#degress = handler;
        return Group;
    }
    
    /**
     * Instantiate a new SCIM Group resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(...params) {
        super(...params);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Schemas.Group}
     * @example
     * // Retrieve group with ID "1234"
     * await new SCIMMY.Resources.Group("1234").read();
     * @example
     * // Retrieve groups with a group name starting with "A"
     * await new SCIMMY.Resources.Group({filter: 'displayName sw "A"'}).read();
     */
    async read(ctx) {
        if (!this.id) {
            return new lib_messages.Messages.ListResponse((await Group.#egress(this, ctx) ?? [])
                .map(u => new lib_schemas.Schemas.Group(u, "out", Group.basepath(), this.attributes)), this.constraints);
        } else {
            try {
                const source = [await Group.#egress(this, ctx)].flat().shift();
                if (!(source instanceof Object)) throw new lib_types.Types.Error(500, null, `Unexpected ${source === undefined ? "empty" : "invalid"} value returned by handler`);
                else return new lib_schemas.Schemas.Group(source, "out", Group.basepath(), this.attributes);
            } catch (ex) {
                if (ex instanceof lib_types.Types.Error) throw ex;
                else if (ex instanceof TypeError) throw new lib_types.Types.Error(400, "invalidValue", ex.message);
                else throw new lib_types.Types.Error(404, null, `Resource ${this.id} not found`);
            }
        }
    }
    
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
    async write(instance, ctx) {
        if (instance === undefined)
            throw new lib_types.Types.Error(400, "invalidSyntax", `Missing request body payload for ${!!this.id ? "PUT" : "POST"} operation`);
        if (Object(instance) !== instance || Array.isArray(instance))
            throw new lib_types.Types.Error(400, "invalidSyntax", `Operation ${!!this.id ? "PUT" : "POST"} expected request body payload to be single complex value`);
        
        try {
            const target = await Group.#ingress(this, new lib_schemas.Schemas.Group(instance, "in"), ctx);
            if (!(target instanceof Object)) throw new lib_types.Types.Error(500, null, `Unexpected ${target === undefined ? "empty" : "invalid"} value returned by handler`);
            else return new lib_schemas.Schemas.Group(target, "out", Group.basepath(), this.attributes);
        } catch (ex) {
            if (ex instanceof lib_types.Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new lib_types.Types.Error(400, "invalidValue", ex.message);
            else throw new lib_types.Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#patch}
     * @see SCIMMY.Messages.PatchOp
     * @returns {SCIMMY.Schemas.Group}
     * @example
     * // Add member to group with ID "1234" with a patch operation (see SCIMMY.Messages.PatchOp)
     * await new SCIMMY.Resources.Group("1234").patch({Operations: [{op: "add", path: "members", value: {value: "5678"}}]});
     */
    async patch(message, ctx) {
        if (!this.id)
            throw new lib_types.Types.Error(404, null, "PATCH operation must target a specific resource");
        if (message === undefined)
            throw new lib_types.Types.Error(400, "invalidSyntax", "Missing message body from PatchOp request");
        if (Object(message) !== message || Array.isArray(message))
            throw new lib_types.Types.Error(400, "invalidSyntax", "PatchOp request expected message body to be single complex value");
        
        return await new lib_messages.Messages.PatchOp(message)
            .apply(await this.read(ctx), async (instance) => await this.write(instance, ctx))
            .then(instance => !instance ? undefined : new lib_schemas.Schemas.Group(instance, "out", Group.basepath(), this.attributes));
    }
    
    /** 
     * @implements {SCIMMY.Types.Resource#dispose}
     * @example
     * // Delete group with ID "1234"
     * await new SCIMMY.Resources.Group("1234").dispose();
     */
    async dispose(ctx) {
        if (!this.id)
            throw new lib_types.Types.Error(404, null, "DELETE operation must target a specific resource");
        
        try {
            await Group.#degress(this, ctx);
        } catch (ex) {
            if (ex instanceof lib_types.Types.Error) throw ex;
            else if (ex instanceof TypeError) throw new lib_types.Types.Error(500, null, ex.message);
            else throw new lib_types.Types.Error(404, null, `Resource ${this.id} not found`);
        }
    }
}

/**
 * SCIM Schema Resource
 * @alias SCIMMY.Resources.Schema
 * @summary
 * *   Formats SCIM schema definition implementations declared in `{@link SCIMMY.Schemas}` for transmission/consumption according to the Schema Definition schema set out in [RFC7643§7](https://datatracker.ietf.org/doc/html/rfc7643#section-7).
 */
class Schema extends lib_types.Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/Schemas";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return Schema.#basepath;
        else Schema.#basepath = (path.endsWith(Schema.endpoint) ? path : `${path}${Schema.endpoint}`);
        
        return Schema;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.extend}
     * @throws {TypeError} SCIM 'Schema' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'Schema' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM Schema resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(id, config) {
        // Bail out if a resource is requested by filter
        if (!!((typeof id === "string" ? config : id) ?? {})?.filter)
            throw new lib_types.Types.Error(403, null, "Schema does not support retrieval by filter");
        
        super(id, config);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|Object}
     */
    async read() {
        if (!this.id) {
            return new lib_messages.Messages.ListResponse(lib_schemas.Schemas.declared().map((S) => S.describe(Schema.basepath())));
        } else {
            try {
                return lib_schemas.Schemas.declared(this.id).describe(Schema.basepath());
            } catch (ex) {
                throw new lib_types.Types.Error(404, null, `Schema ${this.id} not found`);
            }
        }
    }
}

/**
 * SCIM ResourceType Resource
 * @alias SCIMMY.Resources.ResourceType
 * @summary
 * *   Formats SCIM Resource Type implementations declared in `{@link SCIMMY.Resources}` for transmission/consumption according to the ResourceType schema set out in [RFC7643§6](https://datatracker.ietf.org/doc/html/rfc7643#section-6).
 */
class ResourceType extends lib_types.Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/ResourceTypes";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return ResourceType.#basepath;
        else ResourceType.#basepath = (path.endsWith(ResourceType.endpoint) ? path : `${path}${ResourceType.endpoint}`);
        
        return ResourceType;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.extend}
     * @throws {TypeError} SCIM 'ResourceType' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'ResourceType' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM ResourceType resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(id, config) {
        // Bail out if a resource is requested by filter
        if (!!((typeof id === "string" ? config : id) ?? {})?.filter)
            throw new lib_types.Types.Error(403, null, "ResourceType does not support retrieval by filter");
        
        super(id, config);
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Messages.ListResponse|SCIMMY.Schemas.ResourceType}
     */
    async read() {
        if (!this.id) {
            return new lib_messages.Messages.ListResponse(Object.entries(Resources.declared())
                .map(([,R]) => new lib_schemas.Schemas.ResourceType(R.describe(), ResourceType.basepath())));
        } else {
            try {
                return new lib_schemas.Schemas.ResourceType(Resources.declared(this.id).describe(), ResourceType.basepath());
            } catch {
                throw new lib_types.Types.Error(404, null, `ResourceType ${this.id} not found`);
            }
        }
    }
}

/**
 * SCIM ServiceProviderConfig Resource
 * @alias SCIMMY.Resources.ServiceProviderConfig
 * @summary
 * *   Formats SCIM Service Provider Configuration set in `{@link SCIMMY.Config}` for transmission/consumption according to the Service Provider Configuration schema set out in [RFC7643§5](https://datatracker.ietf.org/doc/html/rfc7643#section-5).
 */
class ServiceProviderConfig extends lib_types.Types.Resource {
    /** @implements {SCIMMY.Types.Resource.endpoint} */
    static get endpoint() {
        return "/ServiceProviderConfig";
    }
    
    /** @private */
    static #basepath;
    /** @implements {SCIMMY.Types.Resource.basepath} */
    static basepath(path) {
        if (path === undefined) return ServiceProviderConfig.#basepath;
        else ServiceProviderConfig.#basepath = (path.endsWith(ServiceProviderConfig.endpoint) ? path : `${path}${ServiceProviderConfig.endpoint}`);
        
        return ServiceProviderConfig;
    }
    
    /**
     * @implements {SCIMMY.Types.Resource.extend}
     * @throws {TypeError} SCIM 'ServiceProviderConfig' resource does not support extension
     */
    static extend() {
        throw new TypeError("SCIM 'ServiceProviderConfig' resource does not support extension");
    }
    
    /**
     * Instantiate a new SCIM ServiceProviderConfig resource and parse any supplied parameters
     * @extends SCIMMY.Types.Resource
     */
    constructor(...params) {
        super(...params);
        
        // Bail out if a resource is requested with filter or attribute properties
        if (!!Object.keys(this).length)
            throw new lib_types.Types.Error(403, null, "ServiceProviderConfig does not support retrieval by filter");
    }
    
    /**
     * @implements {SCIMMY.Types.Resource#read}
     * @returns {SCIMMY.Schemas.ServiceProviderConfig}
     */
    async read() {
        return new lib_schemas.Schemas.ServiceProviderConfig(lib_config.Config.get(), ServiceProviderConfig.basepath());
    }
}

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
class Resources {
    /**
     * Store internal resources to prevent declaration
     * @private
     */
    static #internals = [Schema, ResourceType, ServiceProviderConfig];
    /**
     * Store declared resources for later retrieval 
     * @private 
     */
    static #declared = {};
    
    // Expose built-in resources without "declaring" them
    static Schema = Schema;
    static ResourceType = ResourceType;
    static ServiceProviderConfig = ServiceProviderConfig;
    static User = User;
    static Group = Group;
    
    /**
     * Register a resource implementation for exposure as a ResourceType
     * @param {typeof SCIMMY.Types.Resource} resource - the resource type implementation to register
     * @param {Object|String} [config] - the configuration to feed to the resource being registered, or the name of the resource type implementation if different to the class name
     * @returns {typeof SCIMMY.Resources|typeof SCIMMY.Types.Resource} the Resources class or registered resource type class for chaining
     */
    static declare(resource, config) {
        // Make sure the registering resource is valid
        if (!resource || !(resource.prototype instanceof lib_types.Types.Resource))
            throw new TypeError("Registering resource must be of type 'Resource'");
        // Make sure config is valid, if supplied
        if (config !== undefined && (typeof config !== "string" && (typeof config !== "object" || Array.isArray(config))))
            throw new TypeError("Resource declaration expected 'config' parameter to be either a name string or configuration object");
        // Refuse to declare internal resources
        if (Resources.#internals.includes(resource))
            throw new TypeError(`Refusing to declare internal resource implementation '${resource.name}'`);
        
        // Source name from resource if config is an object
        let name = (typeof config === "string" ? config : resource?.name);
        if (typeof config === "object") name = config.name ?? name;
        
        // Prevent registering a resource implementation under a name that already exists
        if (!!Resources.#declared[name] && Resources.#declared[name] !== resource)
            throw new TypeError(`Resource '${name}' already declared`);
        // Prevent registering an existing resource implementation under a different name
        else if (Object.values(Resources.#declared).some(r => r === resource) && Resources.#declared[name] !== resource)
            throw new TypeError(`Resource '${name}' already declared with name '${Object.entries(Resources.#declared).find(([n, r]) => r === resource).shift()}'`);
        // All good, register the resource implementation
        else if (!Resources.#declared[name])
            Resources.#declared[name] = resource;
        
        // Set up the resource if a config object was supplied
        if (typeof config === "object") {
            // Register supplied basepath
            if (typeof config.basepath === "string")
                Resources.#declared[name].basepath(config.basepath);
            
            // Register supplied ingress, egress, and degress methods
            if (typeof config.ingress === "function")
                Resources.#declared[name].ingress(async (...r) => await config.ingress(...r));
            if (typeof config.egress === "function")
                Resources.#declared[name].egress(async (...r) => await config.egress(...r));
            if (typeof config.degress === "function")
                Resources.#declared[name].degress(async (...r) => await config.degress(...r));
            
            // Register any supplied schema extensions
            if (Array.isArray(config.extensions)) {
                for (let {schema, attributes, required} of config.extensions) {
                    Resources.#declared[name].extend(schema ?? attributes, required);
                }
            }
        }
        
        // Declare the resource type implementation's schema!
        lib_schemas.Schemas.declare(resource.schema.definition);
        
        // If config was supplied, return Resources, otherwise return the registered resource
        return (typeof config === "object" ? Resources : resource);
    }
    
    /**
     * Get registration status of specific resource implementation, or get all registered resource implementations
     * @param {typeof SCIMMY.Types.Resource|String} [resource] - the resource implementation or name to query registration status for
     * @returns {Object|typeof SCIMMY.Types.Resource|Boolean}
     * *   A containing object with registered resource implementations for exposure as ResourceTypes, if no arguments are supplied.
     * *   The registered resource type implementation with matching name, or undefined, if a string argument is supplied.
     * *   The registration status of the specified resource implementation, if a class extending `SCIMMY.Types.Resource` is supplied.
     */
    static declared(resource) {
        // If no resource specified, return declared resources
        if (!resource) return {...Resources.#declared};
        // If resource is a string, find and return the matching resource type
        else if (typeof resource === "string") return Resources.#declared[resource];
        // If the resource is an instance of Resource, see if it is already registered
        else if (resource.prototype instanceof lib_types.Types.Resource) return Resources.#declared[resource.name] === resource;
        // Otherwise, the resource isn't registered...
        else return false;
    }
}

exports.Resources = Resources;
