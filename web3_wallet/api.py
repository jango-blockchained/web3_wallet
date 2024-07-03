import frappe
from web3 import Web3 # type: ignore

@frappe.whitelist(allow_guest=True)
def login_with_wallet(address, signature, message):
    # Connect to Ethereum node
    web3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/acc9fa0a813b40119656cde443e7391d'))

    # Recover the address from the signature
    recovered_address = web3.eth.account.recover_message(message, signature=signature)
    
    if recovered_address.lower() == address.lower():
        # Find or create a Frappe user with the given wallet address
        user = frappe.get_value("User", {"email": address})
        if not user:
            # Create a new Frappe user if one doesn't exist
            user = frappe.get_doc({
                "doctype": "User",
                "email": address,
                "first_name": address,
                "enabled": 1,
                "user_type": "Website User"
            })
            user.insert(ignore_permissions=True)
        
        # Log the user in
        frappe.local.login_manager.user = address
        frappe.local.login_manager.post_login()
        return {"status": "success", "user": address}
    else:
        frappe.throw("Signature verification failed")

    return {"status": "failed"}
