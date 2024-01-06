const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60,
  },
});

// -> send email
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = mailSender(
      email,
      "Verification Email from StudyNotion",
      otp
    );

    console.log("Email sent Successfully: ", mailResponse);
  } catch (error) {
    console.log(error);
    console.log("Error occured while sending mails");
    throw new Error(error);
  }
}

otpSchema.pre("save", async function (next) {
  await sendVerificationEmail(this.email, this.otp);
  next();
});

module.exports = mongoose.model("OTP", otpSchema);
