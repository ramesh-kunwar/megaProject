const { instance } = require("../config/razorpay");
const Course = require("../models/CourseSchema");
const User = require("../models/UserSchema");
const mailSender = require("../utils/mailSender");

const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");

// capture the paymetn and inititate the razor pay order

exports.capturePayment = async (req, res) => {
  // step 1. we need course id to find all the details of course
  // get courseId and userID

  const { course_id } = req.body;
  const userId = req.user.id;

  // validation

  // valid courseID
  if (!course_id) {
    return res.json({
      success: false,
      message: "Please Provide valid course id",
    });
  }

  // valid courseDetail
  let course;
  try {
    course = await Course.findById(course_id);
    if (!course) {
      return res.json({
        success: false,
        message: "Could not find course with given id",
      });
    }

    // user already paid for the same course

    const uid = new mongoose.Types.ObjectId(userId); // converting user id to string

    if (course.studentsEnrolled.includes(uid)) {
      return res.json({
        success: false,
        message: "You have already enrolled for this course",
      });
    }
  } catch (error) {
    return res.json({
      success: false,
      message: "Please Provide valid course id",
    });
  }

  // step 2: create order

  const amount = course.price;
  const currency = "INR";

  const options = {
    amount: amount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
    notes: {
      courseId: course_id,
      userId,
    },
  };

  try {
    // initiate the payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);

    // return the response
    return res.status(200).json({
      success: true,
      message: "Payment Initiated",

      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (error) {
    //
    console.log(error);
    return res.json({
      success: false,
      message: "Could not initiate order",
    });
  }

  // return response
};

// verify the payment and enroll the user for the course
// verify signature of razorpay and server

exports.verifySignature = async (req, res) => {
  // match server secret and secret send by razorpay

  const webhookSecret = "123456789"; // server secret

  // secret of razor pay
  const signature = req.headers["x-razorpay-signature"];

  // create an hmac object
  const shasum = crypto.createHmac("sha256", webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  // match the signature with digest

  // if this gets matched -> payment is authorized
  if (signature === digest) {
    //
    console.log("payment is authorized");
    // get the courseId and userId from notes
    const { courseId, userId } = req.body.payload.payment.entity.notes;

    try {
      // fulfill the action

      // find the course and entroll the student in it
      const entrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        {
          $push: { studentsEnrolled: userId },
        },
        { new: true }
      );

      if (!entrolledCourse) {
        return res.status(400).json({
          success: false,
          message: "Could not enroll student",
        });
      }

      console.log(entrolledCourse);

      // find the student and add the course to his list of  enrolled courses
      const enrolledStudent = await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: { courses: courseId },
        },
        { new: true }
      );

      console.log(enrolledStudent);

      // send the email to the student about the course enrollment
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Course Enrollment`,
        "You have successfully enrolled for the course"
      );

      console.log(emailResponse);

      return res.status(200).json({
        success: true,
        message: "Signature verified and course added",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid Request",
    });
  }
};
