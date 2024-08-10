# web3_login/web3_login/custom_fields.py

import frappe

def add_custom_fields():
    custom_fields = {
        "User": [
            {
                "fieldname": "wallet_address",
                "label": "Wallet Address",
                "fieldtype": "Data",
                "insert_after": "email",
                "unique": 1,
                "reqd": 1
            }
        ]
    }

    for doctype, fields in custom_fields.items():
        if not frappe.db.exists("Custom Field", {"dt": doctype, "fieldname": fields[0]["fieldname"]}):
            for field in fields:
                frappe.get_doc({
                    "doctype": "Custom Field",
                    "dt": doctype,
                    **field
                }).insert()


def remove_custom_fields():
    custom_fields = ["wallet_address"]
    for fieldname in custom_fields:
        if frappe.db.exists("Custom Field", {"dt": "User", "fieldname": fieldname}):
            frappe.db.sql(f"DELETE FROM `tabCustom Field` WHERE `dt` = 'User' AND `fieldname` = '{fieldname}'")
            frappe.clear_cache(doctype="User")
