import {Resource, Error as SCIMError} from "../types.js";
import {ListResponse} from "../messages.js";
import Schemas from "../schemas.js";

/**
 * SCIM Schema Resource
 * @extends {Resource}
 */
export class Schema extends Resource {
    /** @implements {Resource~#basepath} */
    static #basepath;
    /** @implements {Resource~basepath} */
    static basepath(path) {
        if (path === undefined) return Schema.#basepath;
        else if (Schema.#basepath === undefined)
            Schema.#basepath = (path.endsWith("/Schemas") ? path : `${path}/Schemas`);
        
        return Schema;
    }
    
    /**
     * Instantiate a new SCIM Schema resource and parse any supplied parameters
     * @implements {Resource#constructor}
     */
    constructor(params, ...rest) {
        super(params, ...rest);
    }
    
    /** @implements {Resource#read} */
    async read() {
        if (!this.id) {
            return new ListResponse(Object.entries(Schemas).map(([,S]) => S.schema.definition(Schema.basepath())));
        } else {
            try {
                return Object.entries(Schemas).map(([,S]) => S.schema)
                    .find((s) => [s.id, s.name].includes(this.id))
                    .definition(Schema.basepath());
            } catch {
                throw new SCIMError(404, null, `Schema ${this.id} not found`);
            }
        }
    }
}