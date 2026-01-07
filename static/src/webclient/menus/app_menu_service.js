/** @odoo-module **/

import { registry } from "@web/core/registry";
import { user } from "@web/core/user";
import { computeAppsAndMenuItems} from "@web/webclient/menus/menu_helpers";

export const appMenuService = {
    dependencies: ["menu", "orm"],
    async start(env, { menu, orm }) {

        //prefetch apps order
        let appsOrder = ""

        if (user.userId) {
            const result = await orm.silent.read("res.users", [user.userId], ["sidebar_app_order"]);
            appsOrder = result[0]?.sidebar_app_order || "";
        }
        return {
            // Getters

            // user import to replace user dependency
            getAppsOrder(){
                if (appsOrder !== "") return appsOrder;
            },
            getUserId() {
                return user.userId;
            },
            getCurrentApp() {
                return menu.getCurrentApp();
            },            
            getAppsMenuItems() {
                const { apps } = computeAppsAndMenuItems(menu.getMenuAsTree('root'));
                return apps;
            },
            getMenuAsTree(appId) {
                return menu.getMenuAsTree(appId);
            },

            // Functions

            /**
             * Persists the app ID sequence to the database.
            */
           async saveAppOrder(newIds) {
               if (!user.userId) return false;
               const orderString = newIds.join(',');
               try {
                    const success = await orm.write("res.users", [user.userId], {
                        sidebar_app_order: orderString,
                    });
                    if (success) appsOrder = orderString; // Update the local cache
                    return success;
                } catch (err) {
                    console.error("Failed to save sidebar order:", err);
                    return false;
                }
            },
            
            /**
             * Logic to sort apps based on a comma-separated ID string.
            */
           sortApps(apps, orderString) {
               if (!orderString) return apps;
               const orderIds = orderString.split(',')
               .map(id => parseInt(id, 10))
               .filter(id => !isNaN(id));
               
               return [...apps].sort((a, b) => {
                   let indexA = orderIds.indexOf(a.id);
                   let indexB = orderIds.indexOf(b.id);
                   
                   // New apps not in the saved order go to the end
                   if (indexA === -1) indexA = 999;
                   if (indexB === -1) indexB = 999;
                   
                   return indexA - indexB;
                });
            },
            
            selectApp(app) {
                menu.selectMenu(app);
            },

        };
    },
};

registry.category("services").add("app_menu", appMenuService);