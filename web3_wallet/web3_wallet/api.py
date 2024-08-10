
import frappe
from frappe.auth import LoginManager

@frappe.whitelist(allow_guest=True)
def authenticate(wallet_address, network=None):
    user = frappe.db.get_value("User", {"wallet_address": wallet_address}, "name")
    if user:
        # Create a session for the user
        login_manager = LoginManager()
        login_manager.user = user
        login_manager.post_login()
        frappe.local.response['message'] = 'authenticated'
    else:
        frappe.local.response['message'] = 'user_not_found'

@frappe.whitelist(allow_guest=True)
def check_user_role(wallet_address):
    user = frappe.db.get_value("User", {"wallet_address": wallet_address}, "name")
    if user:
        roles = frappe.get_roles(user)
        return {"roles": roles}
    return {"roles": []}
