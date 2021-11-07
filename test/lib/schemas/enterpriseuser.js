import {promises as fs} from "fs";
import path from "path";
import url from "url";
import assert from "assert";

export let EnterpriseUserSuite = (SCIMMY, SchemasHooks) => {
    const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));
    const fixtures = fs.readFile(path.join(basepath, "./enterpriseuser.json"), "utf8").then((f) => JSON.parse(f));
    
    it("should include static class 'EnterpriseUser'", () => 
        assert.ok(!!SCIMMY.Schemas.EnterpriseUser, "Static class 'EnterpriseUser' not defined"));
    
    describe("SCIMMY.Schemas.EnterpriseUser", () => {
        describe("#constructor", SchemasHooks.construct(SCIMMY.Schemas.EnterpriseUser, fixtures));
        describe(".definition", SchemasHooks.definition(SCIMMY.Schemas.EnterpriseUser, fixtures));
    });
}