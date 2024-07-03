frappe.ui.form.on('User', {
    refresh: function(frm) {
        if (frm.doc.email) {
            frm.add_custom_button('Link Wallet', () => {
                linkWallet(frm.doc.email);
            });
        }
    }
});

async function linkWallet(email) {
    if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const message = `Link this wallet to your Frappe account: ${email}`;
        const signature = await web3.eth.personal.sign(message, account);

        frappe.call({
            method: 'web3_wallet_app.api.link_wallet_to_user',
            args: {
                user_email: email,
                wallet_address: account,
                signature: signature,
                message: message
            },
            callback: function(response) {
                if (response.message.status === "success") {
                    frappe.msgprint("Wallet linked successfully!");
                } else {
                    frappe.msgprint("Failed to link wallet: " + response.message.message);
                }
            }
        });
    } else {
        frappe.msgprint("MetaMask not detected. Please install MetaMask and try again.");
    }
}
