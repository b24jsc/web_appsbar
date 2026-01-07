# from odoo import models, fields, api


# class ResUsers(models.Model):
    
#     _inherit = 'res.users'
    
#     #----------------------------------------------------------
#     # Properties
#     #----------------------------------------------------------
    
#     @property
#     def SELF_READABLE_FIELDS(self):
#         return super().SELF_READABLE_FIELDS + [
#             'sidebar_type',
#             'sidebar_app_order'
#         ]

#     @property
#     def SELF_WRITEABLE_FIELDS(self):
#         return super().SELF_WRITEABLE_FIELDS + [
#             'sidebar_type',
#             'sidebar_app_order'
#         ]

#     #----------------------------------------------------------
#     # Fields
#     #----------------------------------------------------------
    
#     sidebar_type = fields.Selection(
#         selection=[('invisible', 'Invisible'),('small', 'Small'),('large', 'Large')], 
#         string="Sidebar Type",
#         default='large',
#         required=True,
#     )

#     # Stores IDs in a string seq e.g., "1,15,4,8"
#     sidebar_app_order = fields.Text(
#         string="Custom Sidebar Order",
#         default=""
#     )

#========= ODOO 18 SYNTAX ==========

from odoo import models, fields, api

class ResUsers(models.Model):
    _inherit = 'res.users'
    
    
    # --- Fields ---
    
    sidebar_type = fields.Selection(
        selection=[
            ('invisible', 'Invisible'),
            ('small', 'Small'),
            ('large', 'Large')
        ], 
        string="Sidebar Type",
        default='large',
        required=True,
    )

    # Stores the ID sequence as a string, e.g., "1,15,4,8"
    sidebar_app_order = fields.Text(string="Custom Sidebar Order")

    # --- Security Logic (Odoo 18 Style) ---
    
    # gets session info for loading in appsbar orderings
    def _compute_session_info(self):
        result = super()._compute_session_info()
        result['sidebar_app_order'] = self.sidebar_app_order or ''
        return result
    
    def action_reset_sidebar_order(self):
        """ Clears the custom sidebar order for the current user """
        self.write({'sidebar_app_order': ''})
        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }

    @api.model
    def _get_self_readable_fields(self):
        """ Allow the user to read these fields on their own record. """
        res = super()._get_self_readable_fields()
        res.add('sidebar_type')
        res.add('sidebar_app_order')
        return res

    @api.model
    def _get_self_writable_fields(self):
        """ Allow the user to update these fields (enables drag-and-drop saving). """
        res = super()._get_self_writable_fields()
        res.add('sidebar_type')
        res.add('sidebar_app_order')
        return res
    