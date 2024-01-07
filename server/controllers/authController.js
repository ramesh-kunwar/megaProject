require("dotenv").config();
const OTP = require("../models/OTPSchema");

const User = require("../models/UserSchema");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Profile = require("../models/ProfileSchema");
const jwt = require("jsonwebtoken");
// send otp
exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  // check if user already exists

  try {
    const checkUserPresent = await User.find({ email });

    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already exists ",
      });
    }

    // generate otp
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("OTP generated: ", otp);

    // check unique otp or not // -> this is messy code
    const result = await OTP.findOne({ otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      result = await OTP.findOne({ otp });
    }

    // create an entry in otp
    const otpPayload = await OTP.create({
      email,
      otp,
    });

    res.status(201).json({
      success: true,
      message: "OTP sent Successfully",
      otpPayload,
    });
  } catch (error) {
    console.log(error, "Error in OTP controller");
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// signup

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumbeer,
    } = req.body;

    // validate data
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(403).json({
        success: false,
        msg: "All fields are required",
      });
    }

    // check pw and confirm pw
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: "Password and confirm Password doesn't match",
      });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "User already exists",
      });
    }

    //
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "OTP not found",
      });
    }

    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP Found",
      });
    }

    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      aobut: null,
      contactNumber: null,
    });

    // save to db
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      // default profile picture
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    res.status(201).json({
      success: true,
      msg: "User signup successful",
      user,
    });
  } catch (error) {
    console.log(error, "Error during singup");
    res.status(500).json({
      success: false,
      msg: error.message + "\nUser signup Failed",
    });
  }
};

// login

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "User not found",
      });
    }

    const matchPassword = await bcrypt.compare(password, user.password);

    if (!user || !matchPassword) {
      return res.status(400).json({
        success: false,
        msg: "Invalid credentials",
      });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    user.token = token;
    user.password = undefined;

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res.cookie("token", token, options).json({
      success: true,
      msg: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.log(error, " Error in login");

    res.status(500).json({
      success: false,
      msg: error.message + " Login failed",
    });
  }
};

// change password
exports.changePassword = async (req, res) => {
  // get data from req body
  // get oldPassword, newPassword, confirmPassword
  // validate
  // update pw in db
  // send mail -> password updated
};
