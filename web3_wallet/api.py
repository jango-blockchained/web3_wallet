import frappe
from web3 import Web3

@frappe.whitelist()
def link_wallet_to_user(user_email, wallet_address, signature, message):
    settings = frappe.get_single("Web3 Wallet Settings")
    # Check if the user exists
    user = frappe.get_doc("User", {"email": user_email})
    if not user:
        frappe.throw("User not found")

    # Check if the wallet is already linked to a user
    existing_wallet = frappe.get_value("Web3 Wallet Account Link", {"address": wallet_address})
    if existing_wallet:
        frappe.throw("This wallet is already linked to a user")

    # Connect to Ethereum node
    web3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'))

    # Recover the address from the signature
    recovered_address = web3.eth.account.recover_message(message, signature=signature)
    
    if recovered_address.lower() == wallet_address.lower():
        # Link the wallet to the user
        wallet = frappe.get_doc({
            "doctype": "Web3 Wallet",
            "user": user_email,
            "address": wallet_address
        })
        wallet.insert()

        return {"status": "success", "message": "Wallet linked successfully"}
    else:
        frappe.throw("Signature verification failed")

    return {"status": "success", "message": "Wallet linked successfully"}

@frappe.whitelist(allow_guest=True)
def login_with_wallet(address, signature, message):
    # Check if wallet login is enabled
    settings = frappe.get_single("Web3 Settings")
    if not settings.enable_wallet_login:
        frappe.throw("Wallet login is disabled")

    # Connect to Ethereum node
    web3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/' + settings.infura_api_key))

    # Recover the address from the signature
    recovered_address = web3.eth.account.recover_message(message, signature=signature)
    
    if recovered_address.lower() == address.lower():
        # Find the user linked to the wallet address
        user_email = frappe.get_value("Web3 Wallet Account Link", {"address": address}, "user")
        if not user_email:
            frappe.throw("No user linked to this wallet")

        # Log the user in
        frappe.local.login_manager.user = user_email
        frappe.local.login_manager.post_login()
        return {"status": "success", "user": user_email}
    else:
        frappe.throw("Signature verification failed")

    return {"status": "failed"}

@frappe.whitelist(allow_guest=True)
def get_wallet_login_status():
    settings = frappe.get_single("Web3 Wallet Settings")
    return {"enable_wallet_login": settings.enable_wallet_login}
