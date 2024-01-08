const bcrypt = require("bcrypt");
const User = require("../models/UserSchema");
const mailSender = require("../utils/mailSender");

// resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
  try {
    // get email from reqbody
    const email = req.body.email;

    // check user, email validation
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Your email is not registered",
      });
    }

    // generate token
    const token = crypto.randomUUID();

    // update user by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email },
      {
        token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      {
        new: true,
      }
    );

    // create url
    const url = `http://localhost:3000/update-password/${token}`;

    // send mail containing the url
    await mailSender(
      email,
      "Password reset Link",
      `Password Reset Link: ${url}`
    );

    // return response

    res.status(200).json({
      success: true,
      message: "Email sent Successfully. Check email and reset password",
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // data fetch
    const { password, confirmPassword, token } = req.body;
    // validation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password doesn't match",
      });
    }
    // get user details from db using token
    const userDetails = await User.findOne({ token: token });
    //   if no entry - invalid token || token time expired
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        msg: "Token invalid",
      });
    }
    // token time check
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        msg: "Token expired. Rengenerate your Token",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // update password

    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      msg: "Password reset successful",
    });
  } catch (error) {
    return res.status({
      success: false,
      msg: error.message,
    });
  }
};
