const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer"); // NEW: For file uploads
const path = require("path");
const fs = require("fs"); // NEW: For checking/creating directories

dotenv.config();
const app = express();

// ---------------------------
// ENSURE UPLOADS DIRECTORY EXISTS
// ---------------------------
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Uploads folder created:", uploadsDir);
}

// Middleware
app.use(express.json());
app.use(express.static("public")); // Serve static files (including uploads)

// ---------------------------
// MULTER CONFIGURATION
// ---------------------------
// Files will be stored in public/uploads so they can be accessed via URL.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads"); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// ---------------------------
// MONGODB SETUP
// ---------------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database is ready..! "))
  .catch((err) => console.log("MongoDB connection error:", err));

// ---------------------------
// MONGODB SCHEMAS & MODELS
// ---------------------------

// Updated User Schema: Added name, username, photo, and phone.
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },       // NEW: User's full name
  username: { type: String },   // NEW: A separate username field
  photo: { type: String },      // NEW: File path for the profile photo
  phone: { type: String }       // NEW: Phone number
});
const User = mongoose.model("User", userSchema);

const counterSchema = new mongoose.Schema({
  modelName: { type: String, required: true },
  currentId: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

const requestSchema = new mongoose.Schema({
  request_id: { type: Number, required: true, unique: true },
  name: { type: String, required: false },
  contactInformation: { type: String, required: false },
  requestType: { type: String, required: false },
  description: { type: String, required: false },
  quantity: { type: Number, required: false },
  location: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, required: false },
});
const Request = mongoose.model("Request", requestSchema);

let otpStorage = {}; // Temporary storage for OTP

// ---------------------------
// NODEMAILER SETUP
// ---------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ---------------------------
// ROUTES (Existing Routes)
// ---------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/home.html"));
});
app.get("/stats", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/stats.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/index.html"));
});
app.get("/request", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/request.html"));
});
app.get("/firstPage", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/firstPage.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/manageRequest.html"));
});
app.get("/pandamic", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/pandamic.html"));
});
app.get("/map", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/map.html"));
});
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/updateProfile.html"));
});

const allowedEmails = [
  "sunilnp@acem.edu.in",
  "ofcsatyam007@gmail.com",
  "vanshajs11@gmail.com",
]; // Allowed emails

app.get("/check-email", (req, res) => {
  try {
    const userEmail = req.headers["x-user-email"]; // Get email from request headers
    console.log(userEmail);
    if (!userEmail) {
      return res.status(400).send("Email header is missing.");
    }
    if (allowedEmails.includes(userEmail)) {
      return res.status(200).send("Access granted.");
    } else {
      return res.status(403).send("Access denied.");
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).send("Server error");
  }
});

// ---------------------------
// REGISTRATION & OTP ROUTES
// ---------------------------

// Register Route (send OTP)
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const otp = generateOTP();

  // Store OTP temporarily in the otpStorage object
  otpStorage[email] = otp;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ error: "User already exists with this email" });
  }

  // Send OTP via email
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Registration OTP",
    html: `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign-Up OTP Email</title>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js">
    </script>
    <script type="text/javascript">
        (function () {
            emailjs.init({
                publicKey: "g8nFJKPj-NjQECO8y",
            });
        })();
    </script>
    <script src="email.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

        body {
            font-family: "Poppins", serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }

        .email-container {
            width: 400px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .email-header {
            background-color: #4caf50;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }

        .email-header img {
            width: 150px;
        }

        .email-header h1 {
            margin: 10px 0 0;
            font-size: 24px;
        }

        .email-body {
            padding: 20px;
            text-align: center;
        }

        .email-body h2 {
            font-size: 20px;
            color: #333;
        }

        .email-body .otp-box {
            background-color: #f4f4f4;
            font-size: 24px;
            color: #4caf50;
            padding: 15px;
            margin: 20px auto;
            width: fit-content;
            border-radius: 5px;
            border: 1px solid #ddd;
        }

        .email-body p {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
        }

        .email-footer {
            text-align: center;
            padding: 15px;
            font-size: 14px;
            color: #777;
            background-color: #f4f4f4;
        }

        .email-footer a {
            color: #4caf50;
            text-decoration: none;
        }

        @media (max-width:600px) {
            .email-container {
                width: 80%;
                /* height: 90%; */
                margin-top: 50px;
            }

            .email-body p {
                font-size: 10px;
            }

            .email-header img {
                width: 100px;
            }

            .email-header h1 {
                font-size: 18px;
            }

            .email-body h2 {
                font-size: 18px;
                color: #333;
            }

        }



        @media (min-height:800px) {
            .email-container {
                margin-top: 100px;
            }

        }
    </style>
</head>

<body>
    <div class="email-container">
        <div class="email-header">
            <img src="https://i.postimg.cc/pT69mFMB/logo.png" alt="Website Logo">
            <h1>Welcome to PIPH !</h1>
        </div>
        <div class="email-body">
            <h2>🎉 Hello!</h2>
            <p>Thank you for signing up with <strong>PIPH </strong>(PANDEMIC INSIGHTS AND PREPAREDNESS HUB). To complete
                your registration, please use the OTP below:</p>
            <div class="otp-box">${otp}</div>
            <p><em>(This OTP is valid for the next 10 minutes.)</em></p>
            <p>If you didn’t sign up for this account, please ignore this email or <a href="#">contact support</a>.</p>
        </div>
        <div class="email-footer">
            <p>Need help? <a href="#">Visit our support page</a> or reply to this email.</p>
            <p>Welcome aboard! <br>The <strong> PIPH Team </strong></p>
        </div>
    </div>

</body>

</html>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: "Failed to send OTP" });
    }
    res.json({ message: "OTP sent! Please verify." });
  });
});

// OTP Verification and Registration
app.post("/register/verify", async (req, res) => {
  const { email, otp, password } = req.body;

  // Check if OTP is valid
  if (otpStorage[email] !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user and save to MongoDB  
  // (Other profile fields like name, username, photo, phone can be updated later)
  const newUser = new User({ email, password: hashedPassword });
  await newUser.save();

  // Remove OTP from storage after successful verification
  delete otpStorage[email];

  res.json({ message: "Registration successful" });
});

// ---------------------------
// LOGIN ROUTE (UPDATED)
// ---------------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Verify password
  bcrypt.compare(password, user.password, (err, result) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    if (!result) return res.status(400).json({ error: "Invalid credentials" });

    // Create JWT token for session management; now include userId
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  });
});

// ---------------------------
// REQUEST & ADMIN ROUTES (UNCHANGED)
// ---------------------------
app.post("/send", async (req, res) => {
  try {
    const {
      name,
      contactInformation,
      requestType,
      description,
      quantity,
      location,
      email,
      status,
    } = req.body;
    console.log(req.body);

    // Check if all required fields are provided
    if (
      !name ||
      !contactInformation ||
      !requestType ||
      !description ||
      quantity === undefined ||
      !location
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Get the current value of the counter and increment it
    const counter = await Counter.findOneAndUpdate(
      { modelName: "Request" },
      { $inc: { currentId: 1 } },
      { new: true, upsert: true }
    );
    const requestId = counter.currentId;

    // Create a new Request document
    const newRequest = new Request({
      request_id: requestId,
      name,
      contactInformation,
      requestType,
      description,
      quantity,
      location,
      email,
      status: "Pending",
    });

    await newRequest.save();
    res.status(201).json({ message: "Request successfully stored." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/requests", async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching requests" });
  }
});

app.put("/requests/:id", async (req, res) => {
  try {
    const { status, email } = req.body;
    const requestId = parseInt(req.params.id, 10);
    const request = await Request.findOne({ request_id: requestId });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const { quantity } = request;
    request.status = status;
    const updatedRequest = await request.save();

    console.log("Email:", email);
    const data = new Date();
    const formattedDate = data.toISOString().split("T")[0];

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Request Status Update",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resource Request Approved</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
    body {
        
      font-family: "Poppins", sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .email-header {
      background-color: #4caf50;
      color: #ffffff;
      text-align: center;
      padding: 20px;
    }
    .email-header img {
      max-width: 150px;
    }
    .email-header h1 {
      margin: 10px 0 0;
      font-size: 24px;
    }
    .email-body {
      padding: 20px;
      text-align: center;
    }
    .email-body h2 {
      font-size: 20px;
      color: #333;
    }
    .email-body p {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
    }
    .email-body .resource-details {
      background-color: #f4f4f4;
      padding: 15px;
      margin: 20px auto;
      border-radius: 5px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .email-body .resource-details strong {
      color: #4caf50;
    }
    .email-footer {
      text-align: center;
      padding: 15px;
      font-size: 14px;
      color: #777;
      background-color: #f4f4f4;
    }
    .email-footer a {
      color: #4caf50;
      text-decoration: none;
    }
    .email-body img{
        width: 100px;
    }
    @media (max-width:600px) {
            .email-container {
                width: 80%;
                /* height: 90%; */
                margin-top: 50px;
            }

            .email-body p {
                font-size: 10px;
            }

            .email-header img {
                width: 100px;
            }

            .email-header h1 {
                font-size: 10px;
            }

            .email-body h2 {
                font-size: 18px;
                color: #333;
            }
            .email-body img{
                width: 50px;
            }
        }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="https://i.postimg.cc/pT69mFMB/logo.png" alt="Website Logo">
      <h1>Resource Request Approved!</h1>
    </div>
    <div class="email-body">
      <h2>👏 Great news, ${requestId}</h2>
      <p>Your resource request has been ${status}. Below are the details of your request:</p>
      <img src="https://www.pngarts.com/files/4/Happy-Emoji-PNG-Free-Download.png" alt="">
      <div class="resource-details">
        <p><strong>Request ID:</strong> #123456</p>
        <p><strong>Resource Type:</strong> Medical Supplies</p>
        <p><strong>Quantity Approved:</strong> ${quantity}</p>
        <p><strong>Approval Date:</strong> ${formattedDate}</p>
      </div>
      <p>Our team will ensure that the requested resources are delivered to you promptly. If you have any questions, feel free to reach out to us.</p>
    </div>
    <div class="email-footer">
      <p>Need assistance? <a href="#">Contact our support team</a>.</p>
      <p>Thank you for choosing PIPH! <br>The <strong>PIPH</strong> Team</p>
    </div>
  </div>
</body>
</html>`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Email sent: " + info.response);
        await Request.deleteOne({ request_id: requestId });
        console.log(`Request with ID ${requestId} deleted from the database.`);
        res.json(updatedRequest);
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating request status" });
  }
});

// ---------------------------
// AUTHENTICATION MIDDLEWARE (NEW)
// ---------------------------
function authMiddleware(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded contains userId
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------------------
// USER PROFILE ENDPOINTS (NEW)
// ---------------------------

// Get user profile (without password)
app.get("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update user profile (supports photo upload)
app.post("/api/user/update", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, userName, email, phone } = req.body;
    let updateData = { 
      name: fullName, 
      username: userName, 
      email, 
      phone 
    };

    if (req.file) {
      // The file is saved in public/uploads; store relative path for retrieval.
      updateData.photo = "uploads/" + req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// UTILITY FUNCTION: GENERATE OTP
// ---------------------------
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString(); // Random 6-digit OTP
}

// ---------------------------
// START THE SERVER
// ---------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
