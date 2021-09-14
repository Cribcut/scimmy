import {Schema, SchemaDefinition, Attribute} from "../types.js";

/**
 * SCIM Group Schema
 * @implements {Schema}
 */
export class Group extends Schema {
    /** @implements {Schema~definition} */
    static get definition() {
        return Group.#definition;
    }
    
    /** @implements {Schema~#definition} */
    static #definition = new SchemaDefinition("Group", "urn:ietf:params:scim:schemas:core:2.0:Group", "Group", [
        new Attribute("string", "displayName", {required: true}),
        new Attribute("complex", "members", {multiValued: true, uniqueness: false}, [
            new Attribute("string", "value", {mutable: "immutable"}),
            new Attribute("reference", "$ref", {mutable: "immutable", referenceTypes: ["User", "Group"]}),
            new Attribute("string", "type", {mutable: "immutable", canonicalValues: ["User", "Group"]})
        ])
    ]);
    
    /**
     * Instantiates a new group that conforms to the SCIM Group schema definition
     * @param {Object} resource - the source data to feed through the schema definition
     * @param {String} [direction="both"] - whether the resource is inbound from a request or outbound for a response
     * @param {String} [basepath] - the base path for resolution of a resource's location
     */
    constructor(resource, direction = "both", basepath) {
        super();
        Object.assign(this, Group.#definition.coerce(resource, direction, basepath));
    }
}