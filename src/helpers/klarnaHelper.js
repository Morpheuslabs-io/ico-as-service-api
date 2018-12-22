const request = require('request-promise');
const dotenv = require('dotenv');
dotenv.config();

class KlarnaHelper {
    constructor() {
        const authHeader = Buffer.from(process.env.KLARNA_USERNAME + ':' + process.env.KLARNA_PASSWORD).toString('base64');
        this.defaultOptions = {
            url: process.env.KLARNA_API_URI,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'json'
            }

        }
    }
}

exports.Klarna = KlarnaHelper;
