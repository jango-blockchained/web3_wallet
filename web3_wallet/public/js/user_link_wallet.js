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
    if (typeof Web3 === 'undefined') {
        // Dynamically load the Web3 library
        await loadWeb3Library();
    }
    if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const message = `Link this wallet to your Frappe account: ${email}`;
        const signature = await web3.eth.personal.sign(message, account);

        frappe.call({
            method: 'web3_wallet.api.link_wallet_to_user',
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

async function loadWeb3Library() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/web3/1.3.6/web3.min.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Web3 library"));
        document.head.appendChild(script);
    });
}