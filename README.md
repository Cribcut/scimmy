###### [![SCIMMY](https://raw.githubusercontent.com/sleelin/scimmy/main/src/scimmy.png)](https://github.com/sleelin/scimmy)

# SCIMMY - SCIM m(ade eas)y
SCIM 2.0 (System for Cross-domain Identity Management) is a set of standards ([RFC7643](https://datatracker.ietf.org/doc/html/rfc7643) and [RFC7644](https://datatracker.ietf.org/doc/html/rfc7644)) 
designed to simplify resource provisioning and identity management in cloud-based applications and services.
SCIMMY aims to make it easier to rapidly implement code that sends and receives data conforming to these standards.
It does this by providing a set of tools that can be used to parse incoming, and format outgoing data according to these standards.

##### Requirements
*   [Node.js](https://nodejs.org) v16+ with NPM 7+ 

## Installation and Usage

Through NPM:
```
$ npm install scimmy
```

In your code:
```js
import SCIMMY from "scimmy";

// Basic usage with provided resource type implementations
SCIMMY.Resources.declare(SCIMMY.Resources.User)
    .ingress((resource, data) => {/* Your handler for creating or modifying user resources */})
    .egress((resource) => {/* Your handler for retrieving user resources */})
    .degress((resource) => {/* Your handler for deleting user resources */});

// Advanced usage with custom resource type implementations
SCIMMY.Resources.declare(class MyResourceType extends SCIMMY.Types.Resource {
    read() {/* Your handler for retrieving resources */})
    write(data) {/* Your handler for creating or modifying resources */}
    dispose() {/* Your handler for deleting resources */})
    /* ...the rest of your resource type implementation */
});
```

## API

SCIMMY provides the following interfaces:
*   ```SCIMMY.Config```
    *   SCIM Service Provider Configuration container store.
*   ```SCIMMY.Types```
    *   SCIMMY classes for implementing schemas and resource types.
*   ```SCIMMY.Messages```
    *   Implementations of non-resource SCIM "message" schemas, such as ListResponse and PatchOp.
*   ```SCIMMY.Schemas```
    *   Container store for declaring and retrieving schemas implemented by a service provider.
    *   Also provides access to bundled schema implementations of [SCIM Core Resource Schemas](https://datatracker.ietf.org/doc/html/rfc7643#section-4).
*   ```SCIMMY.Resources```
    *   Container store for declaring and retrieving resource types implemented by a service provider.
    *   Also provides access to bundled resource type implementations of [SCIM Core Resource Types](https://datatracker.ietf.org/doc/html/rfc7643#section-4).
