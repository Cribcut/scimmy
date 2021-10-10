import Types from "../types.js";

/**
 * SCIM Group Schema
 * @alias SCIMMY.Schemas.Group
 */
export class Group extends Types.Schema {
    /**
     * @static
     * @alias definition
     * @memberOf SCIMMY.Schemas.Group
     * @implements {SCIMMY.Types.Schema.definition}
     */
    static get definition() {
        return Group.#definition;
    }
    
    /** @private */
    static #definition = new Types.SchemaDefinition("Group", "urn:ietf:params:scim:schemas:core:2.0:Group", "Group", [
        new Types.Attribute("string", "displayName", {required: true}),
        new Types.Attribute("complex", "members", {multiValued: true, uniqueness: false}, [
            new Types.Attribute("string", "value", {mutable: "immutable"}),
            new Types.Attribute("reference", "$ref", {mutable: "immutable", referenceTypes: ["User", "Group"]}),
            new Types.Attribute("string", "type", {mutable: "immutable", canonicalValues: ["User", "Group"]})
        ])
    ]);
    
    /**
     * Instantiates a new group that conforms to the SCIM Group schema definition
     * @constructs SCIMMY.Schemas.Group
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