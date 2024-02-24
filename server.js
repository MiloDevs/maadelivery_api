const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
const port = process.env.PORT || 3000;
require('dotenv').config();


// Twilio Credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

const client = require("twilio")(accountSid, authToken);


// Routes
app.post('/user', (req, res) => {
    const { phoneNumber } = req.body;
    fetch(
      "https://my-json-server.typicode.com/milodevs/maadelivery_api/users?phoneNumber=" +
        phoneNumber
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          res.send({
            message: "User Found",
            status: 1,
          });
        } else {
          res.send({
            message: "User Not Found",
            status: 0,
          });
        }
      });
});

app.get('/api/send-otp', (req, res) => {
    client.verify.v2
    .services(verifySid)
    .verifications.create({ to: "+254793616321", channel: "sms" });
    res.send({
        message: "OTP Sent",
        status: 1
    });
});

app.post('/api/verify-otp', (req, res) => {
    const { otp } = req.body;
    client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: "+254793616321", code: otp })
      .then((verification_check) => {
        console.log(verification_check.status);
        if(verification_check.status === "approved") {
          res.send({
            message: "OTP Verified",
            status: 1
          });
        }else{
            res.send({
                message: "OTP Not Verified",
                status: 0
            });
        }
      })
      .catch((error) => {
        console.log(error);
        res.send({
            message: error.message,
            status: 0
        });
      });
});



app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});