import assert from "assert";
import {BulkResponse} from "#@/lib/messages/bulkresponse.js";

const params = {id: "urn:ietf:params:scim:api:messages:2.0:BulkResponse"};
const template = {schemas: [params.id], Operations: []};

describe("SCIMMY.Messages.BulkResponse", () => {
    describe("@constructor", () => {
        it("should not require arguments at instantiation", () => {
            assert.deepStrictEqual({...(new BulkResponse())}, template,
                "BulkResponse did not instantiate with correct default properties");
        });
        
        it("should not instantiate requests with invalid schemas", () => {
            assert.throws(() => new BulkResponse({schemas: ["nonsense"]}),
                {name: "TypeError", message: `BulkResponse request body messages must exclusively specify schema as '${params.id}'`},
                "BulkResponse instantiated with invalid 'schemas' property");
            assert.throws(() => new BulkResponse({schemas: [params.id, "nonsense"]}),
                {name: "TypeError", message: `BulkResponse request body messages must exclusively specify schema as '${params.id}'`},
                "BulkResponse instantiated with invalid 'schemas' property");
        });
        
        it("should expect 'Operations' attribute of 'request' argument to be an array", () => {
            assert.throws(() => new BulkResponse({schemas: template.schemas, Operations: "a string"}),
                {name: "TypeError", message: "BulkResponse constructor expected 'Operations' property of 'request' parameter to be an array"},
                "BulkResponse instantiated with invalid 'Operations' attribute value 'a string' of 'request' parameter");
        });
    });
    
    describe("#resolve()", () => {
        it("should have instance method 'resolve'", () => {
            assert.ok(typeof (new BulkResponse()).resolve === "function",
                "Instance method 'resolve' not defined");
        });
        
        it("should return an instance of native Map class", () => {
            assert.ok((new BulkResponse().resolve()) instanceof Map,
                "Instance method 'resolve' did not return a map");
        });
    });
});