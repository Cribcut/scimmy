'use strict';

const lib_types = require('./types.cjs');

/**
 * SCIM User Schema
 * @alias SCIMMY.Schemas.User
 * @summary
 * *   Ensures a User instance conforms to the User schema set out in [RFC7643§4.1](https://datatracker.ietf.org/doc/html/rfc7643#section-4.1).
 */
class User extends lib_types.Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return User.#definition;
    }
    
    /** @private */
    static #definition = new lib_types.Types.SchemaDefinition("User", "urn:ietf:params:scim:schemas:core:2.0:User", "User Account", [
        new lib_types.Types.Attribute("string", "userName", {required: true, caseExact: false, uniqueness: "server", description: "Unique identifier for the User, typically used by the user to directly authenticate to the service provider. Each User MUST include a non-empty userName value. This identifier MUST be unique across the service provider's entire set of Users. REQUIRED."}),
        new lib_types.Types.Attribute("complex", "name", {description: "The components of the user's real name. Providers MAY return just the full name as a single string in the formatted sub-attribute, or they MAY return just the individual component attributes using the other sub-attributes, or they MAY return both. If both variants are returned, they SHOULD be describing the same name, with the formatted name indicating how the component attributes should be combined."}, [
            new lib_types.Types.Attribute("string", "formatted", {description: "The full name, including all middle names, titles, and suffixes as appropriate, formatted for display (e.g. 'Ms. Barbara J Jensen, III')."}),
            new lib_types.Types.Attribute("string", "familyName", {description: "The family name of the User, or last name in most Western languages (e.g. 'Jensen' given the full name 'Ms. Barbara J Jensen, III')."}),
            new lib_types.Types.Attribute("string", "givenName", {description: "The given name of the User, or first name in most Western languages (e.g. 'Barbara' given the full name 'Ms. Barbara J Jensen, III')."}),
            new lib_types.Types.Attribute("string", "middleName", {description: "The middle name(s) of the User (e.g. 'Jane' given the full name 'Ms. Barbara J Jensen, III')."}),
            new lib_types.Types.Attribute("string", "honorificPrefix", {description: "The honorific prefix(es) of the User, or title in most Western languages (e.g. 'Ms.' given the full name 'Ms. Barbara J Jensen, III')."}),
            new lib_types.Types.Attribute("string", "honorificSuffix", {description: "The honorific suffix(es) of the User, or suffix in most Western languages (e.g. 'III' given the full name 'Ms. Barbara J Jensen, III')."})
        ]),
        new lib_types.Types.Attribute("string", "displayName", {description: "The name of the User, suitable for display to end-users. The name SHOULD be the full name of the User being described, if known."}),
        new lib_types.Types.Attribute("string", "nickName", {description: "The casual way to address the user in real life, e.g. 'Bob' or 'Bobby' instead of 'Robert'. This attribute SHOULD NOT be used to represent a User's username (e.g. 'bjensen' or 'mpepperidge')."}),
        new lib_types.Types.Attribute("reference", "profileUrl", {referenceTypes: ["external"], description: "A fully qualified URL pointing to a page representing the User's online profile."}),
        new lib_types.Types.Attribute("string", "title", {description: "The user's title, such as 'Vice President'."}),
        new lib_types.Types.Attribute("string", "userType", {description: "Used to identify the relationship between the organization and the user. Typical values used might be 'Contractor', 'Employee', 'Intern', 'Temp', 'External', and 'Unknown', but any value may be used."}),
        new lib_types.Types.Attribute("string", "preferredLanguage", {description: "Indicates the User's preferred written or spoken language. Generally used for selecting a localized user interface; e.g. 'en_US' specifies the language English and country US."}),
        new lib_types.Types.Attribute("string", "locale", {description: "Used to indicate the User's default location for purposes of localizing items such as currency, date time format, or numerical representations."}),
        new lib_types.Types.Attribute("string", "timezone", {description: "The User's time zone in the 'Olson' time zone database format, e.g. 'America/Los_Angeles'."}),
        new lib_types.Types.Attribute("boolean", "active", {description: "A Boolean value indicating the User's administrative status."}),
        new lib_types.Types.Attribute("string", "password", {direction: "in", returned: false, description: "The User's cleartext password. This attribute is intended to be used as a means to specify an initial password when creating a new User or to reset an existing User's password."}),
        new lib_types.Types.Attribute("complex", "emails", {multiValued: true, description: "Email addresses for the user. The value SHOULD be canonicalized by the service provider, e.g. 'bjensen@example.com' instead of 'bjensen@EXAMPLE.COM'. Canonical type values of 'work', 'home', and 'other'."}, [
            new lib_types.Types.Attribute("string", "value", {description: "Email addresses for the user. The value SHOULD be canonicalized by the service provider, e.g. 'bjensen@example.com' instead of 'bjensen@EXAMPLE.COM'. Canonical type values of 'work', 'home', and 'other'."}),
            new lib_types.Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new lib_types.Types.Attribute("string", "type", {canonicalValues: ["work", "home", "other"], description: "A label indicating the attribute's function, e.g. 'work' or 'home'."}),
            new lib_types.Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred mailing address or primary email address. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new lib_types.Types.Attribute("complex", "phoneNumbers", {multiValued: true, uniqueness: false, description: "Phone numbers for the User. The value SHOULD be canonicalized by the service provider according to the format specified in RFC 3966, e.g. 'tel:+1-201-555-0123'. Canonical type values of 'work', 'home', 'mobile', 'fax', 'pager', and 'other'."}, [
            new lib_types.Types.Attribute("string", "value", {description: "Phone number of the User."}),
            new lib_types.Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new lib_types.Types.Attribute("string", "type", {canonicalValues: ["work", "home", "mobile", "fax", "pager", "other"], description: "A label indicating the attribute's function, e.g. 'work', 'home', 'mobile'."}),
            new lib_types.Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred phone number or primary phone number. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new lib_types.Types.Attribute("complex", "ims", {multiValued: true, uniqueness: false, description: "Instant messaging addresses for the User."}, [
            new lib_types.Types.Attribute("string", "value", {description: "Instant messaging address for the User."}),
            new lib_types.Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new lib_types.Types.Attribute("string", "type", {canonicalValues: ["aim", "gtalk", "icq", "xmpp", "msn", "skype", "qq", "yahoo"], description: "A label indicating the attribute's function, e.g. 'aim', 'gtalk', 'xmpp'."}),
            new lib_types.Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred messenger or primary messenger. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new lib_types.Types.Attribute("complex", "photos", {multiValued: true, uniqueness: false, description: "URLs of photos of the User."}, [
            new lib_types.Types.Attribute("reference", "value", {referenceTypes: ["external"], description: "URL of a photo of the User."}),
            new lib_types.Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new lib_types.Types.Attribute("string", "type", {canonicalValues: ["photo", "thumbnail"], description: "A label indicating the attribute's function, i.e., 'photo' or 'thumbnail'."}),
            new lib_types.Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred photo or thumbnail. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new lib_types.Types.Attribute("complex", "addresses", {multiValued: true, description: "A physical mailing address for this User. Canonical type values of 'work', 'home', and 'other'. This attribute is a complex type with the following sub-attributes."}, [
            new lib_types.Types.Attribute("string", "formatted", {description: "The full mailing address, formatted for display or use with a mailing label. This attribute MAY contain newlines."}),
            new lib_types.Types.Attribute("string", "streetAddress", {description: "The full street address component, which may include house number, street name, P.O. box, and multi-line extended street address information. This attribute MAY contain newlines."}),
            new lib_types.Types.Attribute("string", "locality", {description: "The city or locality component."}),
            new lib_types.Types.Attribute("string", "region", {description: "The state or region component."}),
            new lib_types.Types.Attribute("string", "postalCode", {description: "The zip code or postal code component."}),
            new lib_types.Types.Attribute("string", "country", {description: "The country name component."}),
            new lib_types.Types.Attribute("string", "type", {canonicalValues: ["work", "home", "other"], description: "A label indicating the attribute's function, e.g. 'work' or 'home'."}),
            new lib_types.Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute, e.g. the preferred mailing address or primary email address. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new lib_types.Types.Attribute("complex", "groups", {direction: "out", mutable: false, multiValued: true, uniqueness: false, description: "A list of groups to which the user belongs, either through direct membership, through nested groups, or dynamically calculated."}, [
            new lib_types.Types.Attribute("string", "value", {direction: "out", mutable: false, description: "The identifier of the User's group."}),
            new lib_types.Types.Attribute("reference", "$ref", {direction: "out", mutable: false, referenceTypes: ["User", "Group"], description: "The URI of the corresponding 'Group' resource to which the user belongs."}),
            new lib_types.Types.Attribute("string", "display", {direction: "out", mutable: false, description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new lib_types.Types.Attribute("string", "type", {direction: "out", mutable: false, canonicalValues: ["direct", "indirect"], description: "A label indicating the attribute's function, e.g. 'direct' or 'indirect'."})
        ]),
        new lib_types.Types.Attribute("complex", "entitlements", {multiValued: true, uniqueness: false, description: "A list of entitlements for the User that represent a thing the User has."}, [
            new lib_types.Types.Attribute("string", "value", {description: "The value of an entitlement."}),
            new lib_types.Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new lib_types.Types.Attribute("string", "type", {description: "A label indicating the attribute's function."}),
            new lib_types.Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new lib_types.Types.Attribute("complex", "roles", {multiValued: true, uniqueness: false, description: "A list of roles for the User that collectively represent who the User is, e.g. 'Student', 'Faculty'."}, [
            new lib_types.Types.Attribute("string", "value", {description: "The value of a role."}),
            new lib_types.Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new lib_types.Types.Attribute("string", "type", {canonicalValues: [], description: "A label indicating the attribute's function."}),
            new lib_types.Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute. The primary attribute value 'true' MUST appear no more than once."})
        ]),
        new lib_types.Types.Attribute("complex", "x509Certificates", {multiValued: true, uniqueness: false, description: "A list of certificates issued to the User."}, [
            new lib_types.Types.Attribute("binary", "value", {description: "The value of an X.509 certificate."}),
            new lib_types.Types.Attribute("string", "display", {description: "A human-readable name, primarily used for display purposes. READ-ONLY."}),
            new lib_types.Types.Attribute("string", "type", {canonicalValues: [], description: "A label indicating the attribute's function."}),
            new lib_types.Types.Attribute("boolean", "primary", {description: "A Boolean value indicating the 'primary' or preferred attribute value for this attribute. The primary attribute value 'true' MUST appear no more than once."})
        ])
    ]);
    
    /**
     * Instantiates a new user that conforms to the SCIM User schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
     */
    constructor(resource, direction = "both", basepath, filters) {
        super(resource, direction);
        Object.assign(this, User.#definition.coerce(resource, direction, basepath, filters));
    }
}

/**
 * SCIM Group Schema
 * @alias SCIMMY.Schemas.Group
 * @summary
 * *   Ensures a Group instance conforms to the Group schema set out in [RFC7643§4.2](https://datatracker.ietf.org/doc/html/rfc7643#section-4.2).
 */
class Group extends lib_types.Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return Group.#definition;
    }
    
    /** @private */
    static #definition = new lib_types.Types.SchemaDefinition("Group", "urn:ietf:params:scim:schemas:core:2.0:Group", "Group", [
        new lib_types.Types.Attribute("string", "displayName", {required: true, description: "A human-readable name for the Group. REQUIRED."}),
        new lib_types.Types.Attribute("complex", "members", {multiValued: true, uniqueness: false, description: "A list of members of the Group."}, [
            new lib_types.Types.Attribute("string", "value", {mutable: "immutable", description: "Identifier of the member of this Group."}),
            new lib_types.Types.Attribute("string", "display", {mutable: "immutable", description: "Human-readable name of the member of this Group."}),
            new lib_types.Types.Attribute("reference", "$ref", {mutable: "immutable", referenceTypes: ["User", "Group"], description: "The URI corresponding to a SCIM resource that is a member of this Group."}),
            new lib_types.Types.Attribute("string", "type", {mutable: "immutable", canonicalValues: ["User", "Group"], description: "A label indicating the type of resource, e.g., 'User' or 'Group'."})
        ])
    ]);
    
    /**
     * Instantiates a new group that conforms to the SCIM Group schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
     */
    constructor(resource, direction = "both", basepath, filters) {
        super(resource, direction);
        Object.assign(this, Group.#definition.coerce(resource, direction, basepath, filters));
    }
}

/**
 * SCIM EnterpriseUser Schema
 * @alias SCIMMY.Schemas.EnterpriseUser
 * @summary
 * *   Ensures an EnterpriseUser instance conforms to the EnterpriseUser schema extension set out in [RFC7643§4.3](https://datatracker.ietf.org/doc/html/rfc7643#section-4.3).
 * *   Can be used directly, but is typically used to extend the `SCIMMY.Schemas.User` schema definition.
 */
class EnterpriseUser extends lib_types.Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return EnterpriseUser.#definition;
    }
    
    /** @private */
    static #definition = new lib_types.Types.SchemaDefinition("EnterpriseUser", "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User", "Enterprise User", [
        new lib_types.Types.Attribute("string", "employeeNumber", {description: "Numeric or alphanumeric identifier assigned to a person, typically based on order of hire or association with an organization."}),
        new lib_types.Types.Attribute("string", "costCenter", {description: "Identifies the name of a cost center."}),
        new lib_types.Types.Attribute("string", "organization", {description: "Identifies the name of an organization."}),
        new lib_types.Types.Attribute("string", "division", {description: "Identifies the name of a division."}),
        new lib_types.Types.Attribute("string", "department", {description: "Identifies the name of a department."}),
        new lib_types.Types.Attribute("complex", "manager", {uniqueness: false, description: "The User's manager.  A complex type that optionally allows service providers to represent organizational hierarchy by referencing the 'id' attribute of another User."}, [
            new lib_types.Types.Attribute("string", "value", {description: "The id of the SCIM resource representing the User's manager."}),
            new lib_types.Types.Attribute("reference", "$ref", {referenceTypes: ["User"], description: "The URI of the SCIM resource representing the User's manager."}),
            new lib_types.Types.Attribute("string", "displayName", {mutable: false, description: "The displayName of the User's manager."})
        ])
    ]);
    
    /**
     * Instantiates a new enterprise user that conforms to the SCIM EnterpriseUser schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     * @param {SCIMMY.Types.Filter} [filters] - attribute filters to apply to the coerced value
     */
    constructor(resource, direction = "both", basepath, filters) {
        super(resource, direction);
        Object.assign(this, EnterpriseUser.#definition.coerce(resource, direction, basepath, filters));
    }
}

/**
 * SCIM ResourceType Schema
 * @alias SCIMMY.Schemas.ResourceType
 * @summary
 * *   Ensures a ResourceType instance conforms to the ResourceType schema set out in [RFC7643§6](https://datatracker.ietf.org/doc/html/rfc7643#section-6).
 */
class ResourceType extends lib_types.Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return ResourceType.#definition;
    }
    
    /** @private */
    static #definition = (() => {
        let definition = new lib_types.Types.SchemaDefinition("ResourceType", "urn:ietf:params:scim:schemas:core:2.0:ResourceType", "Specifies the schema that describes a SCIM resource type", [
            new lib_types.Types.Attribute("string", "name", {direction: "out", required: true, mutable: false, description: "The resource type name. When applicable, service providers MUST specify the name, e.g., 'User'."}),
            new lib_types.Types.Attribute("string", "description", {direction: "out", mutable: false, description: "The resource type's human-readable description. When applicable, service providers MUST specify the description."}),
            new lib_types.Types.Attribute("reference", "endpoint", {direction: "out", required: true, mutable: false, referenceTypes: ["uri"], description: "The resource type's HTTP-addressable endpoint relative to the Base URL, e.g., '/Users'."}),
            new lib_types.Types.Attribute("reference", "schema", {direction: "out", required: true, mutable: false, caseExact: true, referenceTypes: ["uri"], description: "The resource type's primary/base schema URI."}),
            new lib_types.Types.Attribute("complex", "schemaExtensions", {direction: "out", mutable: false, multiValued: true, uniqueness: false, description: "A list of URIs of the resource type's schema extensions."}, [
                new lib_types.Types.Attribute("reference", "schema", {direction: "out", required: true, mutable: false, caseExact: true, referenceTypes: ["uri"], description: "The URI of a schema extension."}),
                new lib_types.Types.Attribute("boolean", "required", {direction: "out", required: true, mutable: false, description: "A Boolean value that specifies whether or not the schema extension is required for the resource type. If true, a resource of this type MUST include this schema extension and also include any attributes declared as required in this schema extension. If false, a resource of this type MAY omit this schema extension."})
            ])
        ]);
        
        // Make the ID attribute visible!
        Object.assign(definition.attribute("id").config, {
            shadow: false, required: false, returned: true, caseExact: false, uniqueness: "none",
            description: "The resource type's server unique id. May be the same as the 'name' attribute."
        });
        
        return definition;
    })();
    
    /**
     * Instantiates a new resource type that conforms to the SCIM ResourceType schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, basepath) {
        super(resource, "out");
        Object.assign(this, ResourceType.#definition.coerce(resource, "out", basepath));
    }
}

/**
 * SCIM Service Provider Configuration Schema
 * @alias SCIMMY.Schemas.ServiceProviderConfig
 * @summary
 * *   Ensures a ServiceProviderConfig instance conforms to the Service Provider Configuration schema set out in [RFC7643§5](https://datatracker.ietf.org/doc/html/rfc7643#section-5).
 */
class ServiceProviderConfig extends lib_types.Types.Schema {
    /** @implements {SCIMMY.Types.Schema.definition} */
    static get definition() {
        return ServiceProviderConfig.#definition;
    }
    
    /** @private */
    static #definition = new lib_types.Types.SchemaDefinition(
        "ServiceProviderConfig", "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig",
        "Schema for representing the service provider's configuration", [
            new lib_types.Types.Attribute("reference", "documentationUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the service provider's human-consumable help documentation."}),
            new lib_types.Types.Attribute("complex", "patch", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies PATCH configuration options."}, [
                new lib_types.Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new lib_types.Types.Attribute("complex", "bulk", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies bulk configuration options."}, [
                new lib_types.Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."}),
                new lib_types.Types.Attribute("integer", "maxOperations", {required: true, mutable: false, description: "An integer value specifying the maximum number of operations."}),
                new lib_types.Types.Attribute("integer", "maxPayloadSize", {required: true, mutable: false, description: "An integer value specifying the maximum payload size in bytes."})
            ]),
            new lib_types.Types.Attribute("complex", "filter", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies FILTER options."}, [
                new lib_types.Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."}),
                new lib_types.Types.Attribute("integer", "maxResults", {required: true, mutable: false, description: "An integer value specifying the maximum number of resources returned in a response."})
            ]),
            new lib_types.Types.Attribute("complex", "changePassword", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies configuration options related to changing a password."}, [
                new lib_types.Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new lib_types.Types.Attribute("complex", "sort", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies sort result options."}, [
                new lib_types.Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new lib_types.Types.Attribute("complex", "etag", {required: true, mutable: false, uniqueness: false, description: "A complex type that specifies ETag configuration options."}, [
                new lib_types.Types.Attribute("boolean", "supported", {required: true, mutable: false, description: "A Boolean value specifying whether or not the operation is supported."})
            ]),
            new lib_types.Types.Attribute("complex", "authenticationSchemes", {required: true, mutable: false, multiValued: true, uniqueness: false, description: "A complex type that specifies supported authentication scheme properties."}, [
                new lib_types.Types.Attribute("string", "type", {required: true, mutable: false, canonicalValues: ["oauth", "oauth2", "oauthbearertoken", "httpbasic", "httpdigest"], description: "The authentication scheme."}),
                new lib_types.Types.Attribute("string", "name", {required: true, mutable: false, description: "The common authentication scheme name, e.g., HTTP Basic."}),
                new lib_types.Types.Attribute("string", "description", {required: true, mutable: false, description: "A description of the authentication scheme."}),
                new lib_types.Types.Attribute("reference", "specUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the authentication scheme's specification."}),
                new lib_types.Types.Attribute("reference", "documentationUri", {mutable: false, referenceTypes: ["external"], description: "An HTTP-addressable URL pointing to the authentication scheme's usage documentation."})
            ])
        ]
    // Remove ID attribute
    ).truncate("id");
    
    /**
     * Instantiates a new service provider configuration that conforms to the SCIM ServiceProviderConfig schema definition
     * @extends SCIMMY.Types.Schema
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, basepath) {
        super(resource, "out");
        Object.assign(this, ServiceProviderConfig.#definition.coerce(resource, "out", basepath));
    }
}

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
class Schemas {
    // Store declared schema definitions for later retrieval
    static #definitions = new Map();
    static #idsToNames = new Map();
    
    // Expose built-in schemas without "declaring" them
    static User = User;
    static Group = Group;
    static EnterpriseUser = EnterpriseUser;
    static ResourceType = ResourceType;
    static ServiceProviderConfig = ServiceProviderConfig;
    
    /**
     * Register a SchemaDefinition implementation for exposure via Schemas HTTP endpoint
     * @param {SCIMMY.Types.SchemaDefinition} definition - the schema definition to register
     * @param {String} [name] - the name of the definition being declared, if different from definition's name property 
     * @returns {SCIMMY.Schemas} the Schemas class for chaining
     */
    static declare(definition, name) {
        // Make sure the registering schema definition is valid
        if (!definition || !(definition instanceof lib_types.Types.SchemaDefinition))
            throw new TypeError("Registering schema definition must be of type 'SchemaDefinition'");
        
        // Source name from schema definition if config is an object
        name = (typeof name === "string" ? name : (definition?.name ?? "")).replace(/\s+/g, "");
        
        // Prevent registering a schema definition under a name that already exists
        if (Schemas.#definitions.has(name) && Schemas.#definitions.get(name) !== definition)
            throw new TypeError(`Schema definition '${name}' already declared with id '${Schemas.#definitions.get(name).id}'`);
        // Prevent registering an existing schema definition under a different name
        else if (Schemas.declared(definition) && Schemas.#definitions.get(name) !== definition)
            throw new TypeError(`Schema definition '${definition.id}' already declared with name '${Schemas.#idsToNames.get(definition.id)}'`);
        // All good, register the schema definition
        else if (!Schemas.#definitions.has(name)) {
            Schemas.#definitions.set(name, definition);
            Schemas.#idsToNames.set(definition.id, name);
        }
        
        // Always return self for chaining
        return Schemas;
    }
    
    /**
     * Get registration status of specific schema definition, or get all registered schema definitions
     * @param {SCIMMY.Types.SchemaDefinition|String} [definition] - the schema definition or name to query registration status for
     * @returns {SCIMMY.Types.SchemaDefinition[]|SCIMMY.Types.SchemaDefinition|Boolean}
     * *   Array containing declared schema definitions for exposure via Schemas HTTP endpoint, if no arguments are supplied.
     * *   The registered schema definition with matching name or ID, or undefined, if a string argument is supplied.
     * *   The registration status of the specified schema definition, if a class extending `SCIMMY.Types.SchemaDefinition` was supplied.
     */
    static declared(definition) {
        // If no definition specified, return declared schema definitions
        if (!definition) {
            // Check for any schema definition extensions
            let extensions = [
                ...new Set([...Schemas.#definitions.values()].map(function find(d) {
                    let extensions = d.attributes.filter(a => a instanceof lib_types.Types.SchemaDefinition);
                    return [...extensions, ...extensions.map(find)];
                })
                .flat(Infinity).map(e => Object.getPrototypeOf(e)))
            ];
            
            return [...new Set([...Schemas.#definitions.values(), ...extensions])];
        }
        // If definition is a string, find and return the matching schema definition
        else if (typeof definition === "string")
            // Try definition as declaration name, then try definition as declaration id or declared instance name
            return Schemas.#definitions.get(definition) ?? Schemas.declared().find((d) => [d?.id, d?.name].includes(definition));
        // If the definition is an instance of SchemaDefinition, see if it is already declared
        else if (definition instanceof lib_types.Types.SchemaDefinition)
            return Schemas.declared().some((d) => d === definition);
        // Otherwise, the schema definition isn't declared...
        else return false;
    }
}

exports.Schemas = Schemas;
