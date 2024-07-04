// Ensure jQuery and Web3 are loaded
frappe.ready(function() {
    // Add the custom button to the footer of the web form
    frappe.web_form.add_button_to_footer("Link Web3 Wallet", "submit", async () => {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            try {
                // Request account access if needed
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                const accounts = await web3.eth.getAccounts();
                const account = accounts[0];
                console.log(account);

                // Generate a random message for the user to sign
                const message = `Link this wallet to your Frappe account: ${frappe.session.user}`;

                // Hash the message
                const hashed_message = web3.utils.sha3(message);

                // Sign the message
                const signature = await web3.eth.personal.sign(hashed_message, account);

                // Send the address, signature, and message to the server for verification
                frappe.call({
                    method: 'web3_wallet.api.link_wallet_to_user',
                    args: {
                        wallet_address: account,
                        signature: signature,
                        message: message
                    },
                    callback: function(response) {
                        if (response.message.status === 'success') {
                            frappe.msgprint('Wallet linked successfully!');
                        } else {
                            frappe.msgprint('Failed to link wallet. ' + response.message.message);
                        }
                    },
                    error: function(error) {
                        frappe.msgprint('An error occurred: ' + error.message);
                        console.error(error);
                    }
                });
            } catch (error) {
                frappe.msgprint('User denied account access or error occurred: ' + error.message);
            }
        } else {
            frappe.msgprint('MetaMask not detected. Please install MetaMask and try again.');
        }
    });
});
