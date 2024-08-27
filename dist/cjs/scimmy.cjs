'use strict';

const lib_types = require('./lib/types.cjs');
const lib_messages = require('./lib/messages.cjs');
const lib_resources = require('./lib/resources.cjs');
const lib_schemas = require('./lib/schemas.cjs');
const lib_config = require('./lib/config.cjs');

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
class SCIMMY {
    static Config = lib_config.Config;
    static Types = lib_types.Types;
    static Messages = lib_messages.Messages;
    static Schemas = lib_schemas.Schemas;
    static Resources = lib_resources.Resources;
}

module.exports = SCIMMY;
