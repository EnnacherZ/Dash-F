import type { TFunction } from "i18next";

export const usersRoles = (t: TFunction) =>{
    return [
        {roleName:t('admin.users.admin_role'), roleValue: "admin"},
        {roleName:t('admin.users.manager_role'), roleValue: "manager"},
        {roleName:t('admin.users.deliveryMan'), roleValue: "delivery"},
    ]
}
