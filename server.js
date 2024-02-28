const express = require("express");
const cors = require("cors");
const connectDB = require("./connect.js");
const User = require("./userModels.js");
const app = express();
const port = process.env.PORT || 5000;
const crypto = require("crypto");
const axios = require("axios");
app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/api/login", async (req, res) => {
  const phoneNumber = req.body.phoneNumber;

  try {
    const user = await User.findOne({ phoneNumber });

    if (user) {
      // User exists
      const lastLoginDate = new Date(user.lastLogin);
      const currentDate = new Date();

      if (
        currentDate - lastLoginDate > 7 * 24 * 60 * 60 * 1000
      ) {
        // If new device or last login is more than a week ago
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        // Store the OTP and updated deviceIds in the database
        await User.updateOne(
          { phoneNumber },
          { otp, otpExpiry, otpStatus: "pending"}
        );
        
        // Send the OTP via SMS
        await sendOTPSMS(phoneNumber, otp);
        
        res.json({
          message: "OTP sent. Redirecting to OTP page.",
          redirectTo: "/otp-page",
          status: 1,
        });
      } else {
        // If last login was less than a week ago
        res.json({
          message: "Redirecting to main page.",
          redirectTo: "/home",
          status: 2,
        });
      }
    } else {
      // User doesn't exist, redirect to create account page
      res.json({
        message: "Redirecting to create account page.",
        redirectTo: "/create-account",
        status: 3,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
    message: "Internal Server Error" , 
    status: 0
  });
  }
});

function generateOTP() {
  // Generate a 4-digit OTP
  return Math.floor(1000 + Math.random() * 9000).toString();
}

app.post("/api/create-account", async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;

  try {
    const user = await User.findOne({ phoneNumber });

    if (user) {
      return res.json({
        message: "User already exists",
        status: 0,
      });
    }

    const newUser = new User({
      id: generateUserId(),
      phoneNumber,
      firstName,
      lastName,
      email,
      verified: false,
      lastLogin: new Date(),
      createdAt: new Date(),
    });

    await newUser.save();

    res.json({
      message: "Account created",
      status: 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
      status: 0,
    });
  }
});

function generateUserId() {
  return crypto.randomBytes(16).toString("hex");
}

async function sendOTPSMS(phoneNumber, otp) {
  const url = "https://2vznj6.api.infobip.com/sms/2/text/advanced";

  const headers = {
    Authorization:
      "App" + " " + process.env.INFOBIP_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const postData = {
    messages: [
      {
        destinations: [{ to: phoneNumber }],
        from: "ServiceSMS",
        text: `Your OTP is: ${otp}. Have a nice day!`,
      },
    ],
  };

  try {
    const response = await axios.post(url, postData, { headers });
    console.log(`SMS sent to ${phoneNumber}: ${response.data}`);
  } catch (error) {
    console.error("Error:", error.message);
    // You can handle the error as needed (e.g., retrying, logging, etc.)
  }
}




app.post("/api/verify-otp", async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const otp = req.body.otp;

  try {
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.json({
        message: "User not found",
        status: 0,
      });
    }

    if (user.otpStatus === "approved") {
      return res.json({
        message: "User already verified",
        status: 0,
      });
    }

    if (user.otpStatus === "expired") {
      return res.json({
        message: "OTP expired",
        status: 0,
      });
    }

    if (user.otp !== otp) {
      return res.json({
        message: "Invalid OTP",
        status: 0,
      });
    }

    if (new Date() > user.otpExpiry) {
      await User.updateOne({ phoneNumber }, { otpStatus: "expired" });
      return res.json({
        message: "OTP expired",
        status: 0,
      });
    }

    await User.updateOne({ phoneNumber }, { otpStatus: "approved" });

    res.json({
      message: "OTP verified",
      status: 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
      status: 0,
    });
  }
});



app.get("/api/users", async (req, res) => {
    await User.find({ phoneNumber: "0712345678" })
      .then((users) => res.json(users))
      .catch((err) => res.status(400).json({
        message: "Error: " + err,
        status: 0,
      }));
    
});

app.post("/api/users", async (req, res) => {
    // get the data from the requests
    const id = req.body.id;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;

    // create a new user
    const newUser = new User({
      id,
      firstName,
      lastName,
      email,
      phoneNumber,
      verified: false,
      lastLogin: new Date(),
      createdAt: new Date(),
    });
    
    // save the user
    await newUser
      .save()
      .then(() => res.json({
        message: "User added",
        status: 1,
      }))
      .catch((err) => res.status(400).json({
        message: "Error: " + err,
        status: 0,
      })); 
});

app.get("/api/user/:id", async (req, res) => {
    try{
        const id = req.params.id;
        const user = await User.findOne({ userId: id });

        if(!user){
            return res.status(404).json({
                message: "User not found",
                status: 0,
            });
        }

        res.json(user);

      }
      catch(err){
        res.status(400).json({
            message: "Error: " + err,
            status: 0,
        });
      }
});

app.put("/api/verify-user/:id", async (req, res) => {
    try{
        const id = 1;
        const user = await User.findOne({ userId: id });

        if(!user){
            return res.status(404).json({
                message: "User not found",
                status: 0,
            });
        }

        if(user.verified){
            return res.status(400).json({
                message: "User already verified",
                status: 0,
            });
        }


        await User.updateOne({ userId: id }, { verified: true });

        res.json({
            message: "User verified",
            status: 1,
        });
    }
    catch(err){
        res.status(400).json({
            message: "Error: " + err,
            status: 0,
        });
    }
});







app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});