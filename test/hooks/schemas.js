import assert from "assert";
import {Attribute} from "#@/lib/types/attribute.js";
import {SchemaDefinition} from "#@/lib/types/definition.js";
import {Schema} from "#@/lib/types/schema.js";

/**
 * Create a class that extends SCIMMY.Types.Schema, for use in tests
 * @param {Object} [params] - parameters to pass through to the SchemaDefinition instance
 * @param {String} [params.name] - the name to pass through to the SchemaDefinition instance
 * @param {String} [params.id] - the ID to pass through to the SchemaDefinition instance
 * @param {String} [params.description] - the description to pass through to the SchemaDefinition instance
 * @param {String} [params.attributes] - the attributes to pass through to the SchemaDefinition instance
 * @returns {typeof Schema} a class that extends SCIMMY.Types.Schema for use in tests
 */
export const createSchemaClass = ({name = "Test", id = "urn:ietf:params:scim:schemas:Test", description = "A Test", attributes} = {}) => (
    class Test extends Schema {
        static #definition = new SchemaDefinition(name, id, description, attributes);
        static get definition() { return Test.#definition; }
        constructor(resource, direction = "both", basepath, filters) {
            super(resource, direction);
            Object.assign(this, Test.#definition.coerce(resource, direction, basepath, filters));
        }
    }
);

export default {
    construct: (TargetSchema, fixtures) => (() => {
        it("should require 'resource' parameter to be an object at instantiation", () => {
            assert.throws(() => new TargetSchema(),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Schema instance did not expect 'resource' parameter to be defined");
            assert.throws(() => new TargetSchema("a string"),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Schema instantiation did not fail with 'resource' parameter string value 'a string'");
            assert.throws(() => new TargetSchema([]),
                {name: "TypeError", message: "Expected 'data' parameter to be an object in SchemaDefinition instance"},
                "Schema instantiation did not fail with 'resource' parameter array value");
        });
        
        it("should validate 'schemas' property of 'resource' parameter if it is defined", () => {
            try {
                // Add an empty required extension
                TargetSchema.extend(new SchemaDefinition("Test", "urn:ietf:params:scim:schemas:Test"), true);
                
                assert.throws(() => new TargetSchema({schemas: ["a string"]}),
                    {name: "SCIMError", status: 400, scimType: "invalidSyntax",
                        message: "The request body supplied a schema type that is incompatible with this resource"},
                    "Schema instance did not validate 'schemas' property of 'resource' parameter");
                assert.throws(() => new TargetSchema({schemas: [TargetSchema.definition.id]}),
                    {name: "SCIMError", status: 400, scimType: "invalidValue",
                        message: "The request body is missing schema extension 'urn:ietf:params:scim:schemas:Test' required by this resource type"},
                    "Schema instance did not validate required extensions in 'schemas' property of 'resource' parameter");
            } finally {
                // Remove the extension so it doesn't interfere later
                TargetSchema.truncate("urn:ietf:params:scim:schemas:Test");
            }
        });
        
        it("should define getters and setters for all attributes in the schema definition", async () => {
            const {definition, constructor = {}} = await fixtures;
            const attributes = definition.attributes.map(a => a.name);
            const instance = new TargetSchema(constructor);
            
            for (let attrib of attributes) {
                assert.ok(attrib in instance,
                    `Schema instance did not define member '${attrib}'`);
                assert.ok(typeof Object.getOwnPropertyDescriptor(instance, attrib).get === "function",
                    `Schema instance member '${attrib}' was not defined with a 'get' method`);
                assert.ok(typeof Object.getOwnPropertyDescriptor(instance, attrib).set === "function",
                    `Schema instance member '${attrib}' was not defined with a 'set' method`);
            }
        });
        
        it("should include lower-case attribute name property accessor aliases", async () => {
            const {constructor = {}} = await fixtures;
            const instance = new TargetSchema(constructor);
            const [key, value] = Object.entries(constructor).shift();
            
            try {
                instance[key.toLowerCase()] = value.toUpperCase();
                assert.strictEqual(instance[key], value.toUpperCase(),
                    "Schema instance did not include lower-case attribute aliases");
            } catch (ex) {
                if (ex.scimType !== "mutability") throw ex;
            }
        });
        
        it("should include extension schema attribute property accessor aliases", async () => {
            try {
                // Add an extension with one attribute
                TargetSchema.extend(new SchemaDefinition("Test", "urn:ietf:params:scim:schemas:Test", "", [new Attribute("string", "testValue")]));
                
                // Construct an instance to test against
                const {constructor = {}} = await fixtures;
                const target = "urn:ietf:params:scim:schemas:Test:testValue";
                const instance = new TargetSchema(constructor);
                
                instance[target] = "a string";
                assert.strictEqual(instance[target], "a string",
                    "Schema instance did not include schema extension attribute aliases");
                instance[target.toLowerCase()] = "another string";
                assert.strictEqual(instance[target], "another string",
                    "Schema instance did not include lower-case schema extension attribute aliases");
            } finally {
                // Remove the extension so it doesn't interfere later
                TargetSchema.truncate("urn:ietf:params:scim:schemas:Test");
            }
        });
        
        it("should be frozen after instantiation", async () => {
            const {constructor = {}} = await fixtures;
            const instance = new TargetSchema(constructor);
            
            assert.throws(() => instance.test = true,
                {name: "TypeError", message: "Cannot add property test, object is not extensible"},
                "Schema was extensible after instantiation");
            assert.throws(() => delete instance.meta,
                {name: "TypeError", message: `Cannot delete property 'meta' of #<${instance.constructor.name}>`},
                "Schema was not sealed after instantiation");
        });
    }),
    definition: (TargetSchema, fixtures) => (() => {
        it("should have static member 'definition' that is an instance of SchemaDefinition", () => {
            assert.ok("definition" in TargetSchema,
                "Static member 'definition' not defined");
            assert.ok(TargetSchema.definition instanceof SchemaDefinition,
                "Static member 'definition' was not an instance of SchemaDefinition");
        });
        
        it("should produce definition object that matches sample schemas defined in RFC7643", async () => {
            const {definition} = await fixtures;
            
            assert.deepStrictEqual(JSON.parse(JSON.stringify(TargetSchema.definition.describe("/Schemas"))), definition,
                "Definition did not match sample schema defined in RFC7643");
        });
    })
};