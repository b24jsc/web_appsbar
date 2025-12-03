import { url } from '@web/core/utils/urls';
import { useService } from '@web/core/utils/hooks';
import { Component, onWillUnmount, useState, onMounted } from '@odoo/owl';

export class AppsBar extends Component {
	static template = 'b24_web_appsbar.AppsBar';
    static props = {};

	setup() {
		this.companyService = useService('company');
        this.menuService = useService("menu");
        this.appMenuService = useService('app_menu');
        this.actionService = useService('action');
        this.defaultCompanyImage = "/b24_web_appsbar/static/description/company_icon.png";
        this.sidebarImageUrl = "";
        document.body.classList.add("b24_sidebar_type_large");

        if (this.companyService.currentCompany.has_appsbar_image) {
            this.sidebarImageUrl = url('/web/image', {
                model: 'res.company',
                field: 'appbar_image',
                id: this.companyService.currentCompany.id,
            });
        }
        this.state = useState({
            openMenuIds: new Set(),
            currentMenu: null,
        });
        
        onMounted(() => {
            this._updateCurrentMenu();
        });
        
        // Re-render khi menu thay đổi
        const renderAfterMenuChange = () => {
            this._updateCurrentMenu();
            this.render();
        };

        this.env.bus.addEventListener('MENUS:APP-CHANGED', renderAfterMenuChange);
        this.env.bus.addEventListener("ACTION_MANAGER:UI-UPDATED", () => {
            this._updateCurrentMenu();
        });

        onWillUnmount(() => {
            this.env.bus.removeEventListener('MENUS:APP-CHANGED', renderAfterMenuChange);
            this.env.bus.removeEventListener("ACTION_MANAGER:UI-UPDATED", renderAfterMenuChange);
        });

    }
    get companyName() {
        return this.companyService.currentCompany?.name || "B24 - ERP";
    }

    //menu active
    _updateCurrentMenu() {
        const currentActionID = this.actionService.currentController?.action?.id;

        if (!currentActionID) return;

        const menuTree = this.appMenuService.getAppsMenuItems();

        for (const app of menuTree) {
            const tree = this.appMenuService.getMenuAsTree(app.id);
            if (tree.childrenTree?.length) {
                for( const item of tree.childrenTree) {
                    const match = this._findMenuByActionID(item, currentActionID);
                    if (match) {
                        this.state.currentMenu = match;
                        return;
                    }
                } 
            } else if (tree.actionID == currentActionID) {
                this.state.currentMenu = tree;
            }
        }

        this.state.currentMenu = null;
    }

    _findMenuByActionID(menu, actionID) {
        if (menu.actionID == actionID) {
            return menu;
        }
        if (menu.childrenTree) {
            for (const child of menu.childrenTree) {
                const found = this._findMenuByActionID(child, actionID);
                if (found) return found;
            }
        }
        return null;
    }

    toggleSidebar() {
        try {
            const body = document.body;

            // Xóa inline style để CSS class có hiệu lực
            const sidebar = document.querySelector('.b24_apps_sidebar_panel');
            if (sidebar) {
                sidebar.style.removeProperty('--b24-sidebar-width');
            }

            if (body.classList.contains('b24_sidebar_type_large')) {
                body.classList.remove('b24_sidebar_type_large');
                body.classList.add('b24_sidebar_type_small');
            } else {
                body.classList.remove('b24_sidebar_type_small');
                body.classList.add('b24_sidebar_type_large');
            }
        } catch (error) {
            console.error('Toggle Sidebar Error:', error);
        }
    }

    openSearch() {
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            code: 'KeyK',
            ctrlKey: true,
            bubbles: true
        });
        window.dispatchEvent(event);
    }

    _onAppClick(app) {
        this.state.currentMenu = null;
        return this.appMenuService.selectApp(app);
    }

    toJson(obj) {
        return JSON.stringify(obj, null, 2);
    }

    getCssVarPx(varName) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return parseInt(value, 10) || 0;
    }

    _menuClicked(menu) {
        if (menu.actionID) {
            this.env.services.menu.selectMenu(menu.id);
            this._updateCurrentMenu();
        }
    }

    toggleMenu(menuId) {
        const openSet = this.state.openMenuIds;
        if (openSet.has(menuId)) {
            openSet.delete(menuId);
        } else {
            openSet.add(menuId);
        }
    }

    isMenuOpen(menuId) {
        return this.state.openMenuIds.has(menuId);
    }

    toggleAppMenu(appId) {
        const rootMenu = this.appMenuService.getMenuAsTree(appId);
        if (!rootMenu || !rootMenu.childrenTree) return;

        const openSet = new Set(this.state.openMenuIds);

        const isOpen = openSet.has(appId)
        const shouldOpen = !isOpen;
        // Hàm đệ quy để xoá toàn bộ menu con (mọi cấp)
        const removeAllChildren = (menus) => {
            for (const menu of menus) {
                openSet.delete(menu.id);
                if (menu.childrenTree?.length) {
                    removeAllChildren(menu.childrenTree);
                }
            }
        };

        // Xoá toàn bộ menu con và chính app nếu đang đóng app
        removeAllChildren(rootMenu.childrenTree);
        openSet.delete(rootMenu.id);

        if (shouldOpen) {
            openSet.add(appId);
        }

        // Cập nhật state
        this.state.openMenuIds = new Set(openSet);
    }


    // startResizing(ev) {
    //     this._startX = ev.clientX;
    //     this._sidebar = document.querySelector('.b24_apps_sidebar_panel');
    //     if (!this._sidebar) return;

    //     this._startWidth = parseInt(getComputedStyle(this._sidebar).width, 10);

    //     this._onMouseMove = this.onMouseMove.bind(this);
    //     this._onMouseUp = this.onMouseUp.bind(this);

    //     document.addEventListener('mousemove', this._onMouseMove);
    //     document.addEventListener('mouseup', this._onMouseUp);
    // }

    // onMouseMove(ev) {
    //     const dx = ev.clientX - this._startX;
    //     const smallWidth = this.getCssVarPx('--b24-sidebar-small-width');
        
    //     const newWidth = Math.max(smallWidth, this._startWidth + dx); // giới hạn min width

    //     this._sidebar.style.setProperty('--b24-sidebar-width', `${newWidth}px`);
        
    // }

    // onMouseUp() {
    //     document.removeEventListener('mousemove', this._onMouseMove);
    //     document.removeEventListener('mouseup', this._onMouseUp);

    //     this._onMouseMove = null;
    //     this._onMouseUp = null;
        
    //     const currentWidth = parseInt(getComputedStyle(this._sidebar).width, 10);
    //     const smallWidth = this.getCssVarPx('--b24-sidebar-small-width');
    //     // const largeWidth = this.getCssVarPx('--b24-sidebar-large-width'); // nếu bạn muốn kiểm tra để mở lại

    //     const body = document.body;
        
    //     if (currentWidth <= smallWidth + 50) {
    //         // Nếu width gần bằng smallWidth → chuyển sang thu gọn
    //         body.classList.remove('b24_sidebar_type_large');
    //         body.classList.add('b24_sidebar_type_small');
    //     } else {
    //         // Ngược lại → chuyển về rộng
    //         body.classList.remove('b24_sidebar_type_small');
    //         body.classList.add('b24_sidebar_type_large');
    //     }
    // }
}
