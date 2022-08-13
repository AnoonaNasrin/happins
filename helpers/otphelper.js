
require('dotenv').config();

const accountId = process.env.TWILIO_ACCOUNT_SID;
const authId = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;

const client = require("twilio")(accountId, authId);
module.exports = {
    doSms: (number) => {

        return new Promise(async (res, rej) => {
            const otp = await client.verify.services(serviceId).verifications.create({
                to: `+91${number}`,
                channel: "sms"
  
            })
            res(otp);
            
        })

    },
    otpVerify: (number, otp) => {
        return new Promise(async (res, rej) => {
            const verify = await client.verify.services(serviceId).verificationChecks.create({
                to: `+91${number}`,
                code: otp
            })
            res(verify);

        })

    }
}


