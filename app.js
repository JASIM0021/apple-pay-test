const express = require('express');
const app = express();

app.get('/verify/:productId', (req, res) => {
    const productId = req.params.productId;
    const userAgent = req.headers['user-agent'];
    
    // Detect platform
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    if (isAndroid) {
        // Android deep linking with fallback to Play Store
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecting to App</title>
                <meta http-equiv="refresh" content="0; url=intent://apple-pay-test-ucxp.onrender.com/verify/${productId}#Intent;scheme=https;package=com.hashcash.paybito;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end">
                <script>
                    setTimeout(function() {
                        window.location = "https://play.google.com/store/apps/details?id=com.hashcash.paybito";
                    }, 250);
                </script>
            </head>
            <body>
                <p>Redirecting to Paybito app...</p>
            </body>
            </html>
        `);
    } else if (isIOS) {
        // iOS Universal Link with fallback to App Store
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecting to App</title>
                <meta property="al:ios:url" content="paybito://verify/${productId}">
                <meta property="al:ios:app_store_id" content="1492071529">
                <meta property="al:ios:app_name" content="Paybito">
                <meta property="al:web:should_fallback" content="false">
                <script>
                    window.location.href = "https://apple-pay-test-ucxp.onrender.com/verify/${productId}";
                    setTimeout(function() {
                        window.location.href = "https://apps.apple.com/us/app/paybitopro/id1492071529";
                    }, 500);
                </script>
            </head>
            <body>
                <p>Redirecting to Paybito app...</p>
            </body>
            </html>
        `);
    } else {
        res.status(400).send("This link is for mobile users only.");
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));