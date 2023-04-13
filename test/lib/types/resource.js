import assert from "assert";
import {Resource} from "#@/lib/types/resource.js";
import {createSchemaClass} from "./schema.js";

// Default values to use when creating a resource class in tests
const params = {name: "Test", id: "urn:ietf:params:scim:schemas:Test", description: "A Test"};
const extension = ["Extension", "urn:ietf:params:scim:schemas:Extension", "An Extension"];

/**
 * Create a class that extends SCIMMY.Types.Resource, for use in tests
 * @param {String} name - the name of the Resource to create a class for
 * @param {*[]} params - arguments to pass through to the Schema class
 * @returns {typeof Resource} a class that extends SCIMMY.Types.Resource for use in tests
 */
export const createResourceClass = (name, ...params) => (
    class Test extends Resource {
        static #endpoint = `/${name}`
        static get endpoint() { return Test.#endpoint; }
        static #schema = createSchemaClass(name, ...params);
        static get schema() { return Test.#schema; }
    }
);

describe("SCIMMY.Types.Resource", () => {
    it("should have abstract static member 'endpoint'", () => {
        assert.ok(typeof Object.getOwnPropertyDescriptor(Resource, "endpoint").get === "function",
            "Abstract static member 'endpoint' not defined");
        assert.throws(() => Resource.endpoint,
            {name: "TypeError", message: "Method 'get' for property 'endpoint' not implemented by resource 'Resource'"},
            "Static member 'endpoint' not abstract");
    });
    
    it("should have abstract static member 'schema'", () => {
        assert.ok(typeof Object.getOwnPropertyDescriptor(Resource, "schema").get === "function",
            "Abstract static member 'schema' not defined");
        assert.throws(() => Resource.schema,
            {name: "TypeError", message: "Method 'get' for property 'schema' not implemented by resource 'Resource'"},
            "Static member 'schema' not abstract");
    });
    
    it("should have abstract static method 'basepath'", () => {
        assert.ok(typeof Resource.basepath === "function",
            "Abstract static method 'basepath' not defined");
        assert.throws(() => Resource.basepath(),
            {name: "TypeError", message: "Method 'basepath' not implemented by resource 'Resource'"},
            "Static method 'basepath' not abstract");
    });
    
    it("should have abstract static method 'ingress'", () => {
        assert.ok(typeof Resource.ingress === "function",
            "Abstract static method 'ingress' not defined");
        assert.throws(() => Resource.ingress(),
            {name: "TypeError", message: "Method 'ingress' not implemented by resource 'Resource'"},
            "Static method 'ingress' not abstract");
    });
    
    it("should have abstract static method 'egress'", () => {
        assert.ok(typeof Resource.egress === "function",
            "Abstract static method 'egress' not defined");
        assert.throws(() => Resource.egress(),
            {name: "TypeError", message: "Method 'egress' not implemented by resource 'Resource'"},
            "Static method 'egress' not abstract");
    });
    
    it("should have abstract static method 'degress'", () => {
        assert.ok(typeof Resource.degress === "function",
            "Abstract static method 'degress' not defined");
        assert.throws(() => Resource.degress(),
            {name: "TypeError", message: "Method 'degress' not implemented by resource 'Resource'"},
            "Static method 'degress' not abstract");
    });
    
    it("should have abstract instance method 'read'", () => {
        assert.ok(typeof (new Resource()).read === "function",
            "Abstract instance method 'read' not defined");
        assert.throws(() => new Resource().read(),
            {name: "TypeError", message: "Method 'read' not implemented by resource 'Resource'"},
            "Instance method 'read' not abstract");
    });
    
    it("should have abstract instance method 'write'", () => {
        assert.ok(typeof (new Resource()).write === "function",
            "Abstract instance method 'write' not defined");
        assert.throws(() => new Resource().write(),
            {name: "TypeError", message: "Method 'write' not implemented by resource 'Resource'"},
            "Instance method 'write' not abstract");
    });
    
    it("should have abstract instance method 'patch'", () => {
        assert.ok(typeof (new Resource()).patch === "function",
            "Abstract instance method 'patch' not defined");
        assert.throws(() => new Resource().patch(),
            {name: "TypeError", message: "Method 'patch' not implemented by resource 'Resource'"},
            "Instance method 'patch' not abstract");
    });
    
    it("should have abstract instance method 'dispose'", () => {
        assert.ok(typeof (new Resource()).dispose === "function",
            "Abstract instance method 'dispose' not defined");
        assert.throws(() => new Resource().dispose(),
            {name: "TypeError", message: "Method 'dispose' not implemented by resource 'Resource'"},
            "Instance method 'dispose' not abstract");
    });
    
    describe(".extend()", () => {
        it("should have static method 'extend'", () => {
            assert.ok(typeof Resource.extend === "function",
                "Static method 'extend' not defined");
        });
    });
    
    describe(".describe()", () => {
        it("should have static method 'describe'", () => {
            assert.ok(typeof Resource.describe === "function",
                "Static method 'describe' not defined");
        });
        
        const TestResource = createResourceClass(...Object.values(params));
        const properties = [
            ["name"], ["description"], ["id", "name"], ["schema", "id"],
            ["endpoint", "name", `/${params.name}`, ", with leading forward-slash"]
        ];
        
        for (let [prop, target = prop, expected = params[target], suffix = ""] of properties) {
            it(`should expect '${prop}' property of description to equal '${target}' property of resource's schema definition${suffix}`, () => {
                assert.strictEqual(TestResource.describe()[prop], expected, 
                    `Resource 'describe' method returned '${prop}' property with unexpected value`);
            });
        }
        
        it("should expect 'schemaExtensions' property to be excluded in description when resource is not extended", () => {
            assert.strictEqual(TestResource.describe().schemaExtensions, undefined,
                "Resource 'describe' method unexpectedly included 'schemaExtensions' property in description");
        });
        
        it("should expect 'schemaExtensions' property to be included in description when resource is extended", function () {
            try {
                TestResource.extend(createSchemaClass(...extension));
            } catch {
                this.skip();
            }
            
            assert.ok(!!TestResource.describe().schemaExtensions,
                "Resource 'describe' method did not include 'schemaExtensions' property in description");
            assert.deepStrictEqual(TestResource.describe().schemaExtensions, [{schema: "urn:ietf:params:scim:schemas:Extension", required: false}],
                "Resource 'describe' method included 'schemaExtensions' property with unexpected value in description");
        });
    });
});