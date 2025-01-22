// Initialize required variables
let current_customer_id, order_id, apple_pay_email, hostedFieldsInstance, applePayInstance;
let reset_purchase_button = () => {
    document.querySelector("#card-form").querySelector("input[type='submit']").removeAttribute("disabled");
    document.querySelector("#card-form").querySelector("input[type='submit']").value = "Purchase";
};

// Helper function to add a script to the document head
let script_to_head = (attributes_object) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        for (const name of Object.keys(attributes_object)) {
            script.setAttribute(name, attributes_object[name]);
        }
        document.head.appendChild(script);
        script.addEventListener('load', resolve);
        script.addEventListener('error', reject);
    });
};

// Get client token for Braintree
const get_client_token = async () => {
    const response = await fetch("https://api.paybito.com:9443/ApplePay/api/braintree/client-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ customer_id: current_customer_id }),
    });
    const data = await response.json()
    return data.btToken;
};

// Display success and error messages
let display_error_alert = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("alerts").innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>An Error Occurred! (View console for more info)</p></div>`;
};

let display_success_message = (transaction) => {
    document.getElementById("alerts").innerHTML = `<div class="ms-alert ms-action">Payment Successful! Transaction ID: ${transaction.id}</div>`;
};

// Initialize Braintree
get_client_token().then((clientToken) => {
    return script_to_head({ src: "https://js.braintreegateway.com/web/3.91.0/js/client.min.js" })
        .then(() => script_to_head({ src: "https://js.braintreegateway.com/web/3.91.0/js/hosted-fields.min.js" }))
        .then(() => script_to_head({ src: "https://js.braintreegateway.com/web/3.91.0/js/apple-pay.min.js" }))
        .then(() => braintree.client.create({ authorization: clientToken }));
}).then((clientInstance) => {
    // Hosted Fields for card payments
    return braintree.hostedFields.create({
        client: clientInstance,
        styles: {
            'input': { 'font-size': '16pt', 'color': '#333' },
            '.valid': { 'color': 'green' },
            '.invalid': { 'color': 'red' },
        },
        fields: {
            number: { selector: "#card-number", placeholder: "4111 1111 1111 1111" },
            cvv: { selector: "#cvv", placeholder: "123" },
            expirationDate: { selector: "#expiration-date", placeholder: "MM/YY" },
        },
    });
}).then((hostedFields) => {
    hostedFieldsInstance = hostedFields;

    document.querySelector("#card-form").addEventListener("submit", (event) => {
        event.preventDefault();
        document.querySelector("#card-form").querySelector("input[type='submit']").setAttribute("disabled", "");
        document.querySelector("#card-form").querySelector("input[type='submit']").value = "Loading...";

        hostedFieldsInstance.tokenize()
            .then((payload) => {
                return fetch("/process_payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nonce: payload.nonce,
                        email: document.getElementById("email").value,
                    }),
                });
            })
            .then((response) => response.json())
            .then((transaction) => {
                if (transaction.success) {
                    display_success_message(transaction);
                } else {
                    throw new Error(transaction.message || "Payment failed");
                }
            })
            .catch((err) => {
                console.error(err);
                reset_purchase_button();
                display_error_alert();
            });
    });
}).catch(console.error);

// Apple Pay integration
get_client_token().then((clientToken) => {
    return braintree.client.create({ authorization: clientToken });
}).then((clientInstance) => {
    return braintree.applePay.create({ client: clientInstance });
}).then((applePay) => {
    applePayInstance = applePay;
    if (applePayInstance.isApplePaySupported()) {
        document.getElementById("applepay-container").innerHTML = '<apple-pay-button id="applepay_button" type="plain" locale="en"></apple-pay-button>';
        document.getElementById("applepay_button").addEventListener("click", () => {
            const applePaySession = applePayInstance.createPaymentRequest({
                countryCode: "US",
                currencyCode: "USD",
                total: { label: "Demo Store", amount: "100.00" },
            });

            const session = new ApplePaySession(3, applePaySession);

            session.onvalidatemerchant = (event) => {
                applePayInstance.performValidation({ validationURL: event.validationURL })
                    .then((validationData) => session.completeMerchantValidation(validationData))
                    .catch(console.error);
            };

            session.onpaymentauthorized = (event) => {
                const payment = event.payment;
                applePayInstance.tokenize({ token: payment.token })
                    .then((payload) => {
                        return fetch("/process_payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ nonce: payload.nonce, email: payment.billingContact.emailAddress }),
                        });
                    })
                    .then((response) => response.json())
                    .then((transaction) => {
                        if (transaction.success) {
                            session.completePayment(ApplePaySession.STATUS_SUCCESS);
                            display_success_message(transaction);
                        } else {
                            session.completePayment(ApplePaySession.STATUS_FAILURE);
                            throw new Error(transaction.message || "Payment failed");
                        }
                    })
                    .catch(console.error);
            };

            session.begin();
        });
    }
}).catch(console.error);
