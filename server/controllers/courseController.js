const Course = require("../models/CourseSchema");
const Category = require("../models/CategorySchema");
const User = require("../models/UserSchema");
const { uploadImageToCloudinary } = require("../utils/ImageUploder");

exports.createCourse = async (req, res) => {
  try {
    // fetch data from the request body
    const { courseName, courseDescription, whatYouWillLearn, price, category } =
      req.body;

    // Get thumbnail from req.files
    const thumbnail = req.files.thumbnailImage;

    // validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category ||
      !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check if it is instructor or not
    // one way
    // const instructor = await User.findOne({ email, accountType: "Instructor" });
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId, {
      accountType: "Instructor",
    });

    // TODO: verify that userId and instructorDetails._id are the same or different
    if (!instructorDetails) {
      return res.status(400).json({
        success: false,
        message: "Instructor details not found",
      });
    }

    // check if category exists -> you have passed taken category from req.body as id because it is a reference field in CourseSchema

    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(400).json({
        success: false,
        message: "Category details not found",
      });
    }

    // upload image to cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    // create an entry for new course
    const newCourse = new Course({
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      category,
      instructor: instructorDetails._id, // we are storing instructor id in courseSchema
      category: categoryDetails._id, // we are storing category id in courseSchema
      thumbnail: thumbnailImage.secure_url,
    });

    // add the new course to the user schema also

    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      // here we are pushing teh course id in courses array
      {
        $push: {
          courses: newCourse._id,
        },
      },
      {
        // we are using new: true to get the updated document
        new: true,
      }
    );

    // update the category schema also

    await Category.findByIdAndUpdate(
      { _id: categoryDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      {
        new: true,
      }
    );

    // return success response
    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all courses

exports.showAllCourses = async (req, res) => {
  try {
    // fetch all courses
    const courses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();

    // return success response
    return res.status(200).json({
      success: true,
      message: "All courses fetched successfully",
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get course details

exports.showCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    // fetch course details
    const courseDetails = await Course.findById(courseId)
      .populate({ path: "instructor", pouplate: { path: "additionalDetails" } })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    // validation
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: "Course details not found with the id",
      });
    }

    // return success response
    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      data: courseDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
