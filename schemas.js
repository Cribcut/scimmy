import {User} from "./schemas/user.js";
import {Group} from "./schemas/group.js";
import {EnterpriseUser} from "./schemas/enterpriseuser.js";
export {User, Group, EnterpriseUser};
export {ResourceType} from "./schemas/resourcetype.js";

export default class Schemas {
    static User = User;
    static Group = Group;
    static EnterpriseUser = EnterpriseUser;
}