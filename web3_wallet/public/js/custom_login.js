frappe.pages['login'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Login',
        single_column: true
    });

    $(frappe.render_template('login_ext')).appendTo(page.body);

    async function loginWithMetaMask() {
        const response = await fetch('/api/method/web3_wallet.api.get_wallet_login_status');
        const data = await response.json();
        if (!data.message.enable_wallet_login) {
            $('#login-status').html('<p>Wallet login is disabled.</p>');
            return;
        }

        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];
            
            const message = `Login to Frappe at ${new Date().toISOString()}`;
            const signature = await web3.eth.personal.sign(message, account);

            $.ajax({
                method: 'POST',
                url: '/api/method/web3_wallet.api.login_with_wallet',
                data: {
                    address: account,
                    signature: signature,
                    message: message
                },
                success: function(response) {
                    $('#login-status').html('<p>Login successful! Welcome, ' + response.message.user + '</p>');
                },
                error: function(error) {
                    $('#login-status').html('<p>Login failed. ' + error.responseJSON.message + '</p>');
                }
            });
        } else {
            $('#login-status').html('<p>MetaMask not detected. Please install MetaMask and try again.</p>');
        }
    };
    // Handle Web3 Wallet login button click event
    $('#web3-login-btn').on('click', async function() {
        // Redirect or perform Web3 Wallet login action
        await loginWithMetaMask();
    });
};
