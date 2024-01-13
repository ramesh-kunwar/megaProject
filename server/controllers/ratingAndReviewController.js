const RatingAndReview = require("../models/RatingAndReviewSchema");
const Course = require("../models/CourseSchema");
const User = require("../models/UserSchema");

// @desc    Create a rating and review

exports.createRating = async (req, res) => {
  try {
    // get user id
    const userId = req.user.id;

    // fetch data from the request body
    const { rating, review, courseId } = req.body;

    // check if user is enrolled in the course or not
    const courseDetails = await Course.findById({
      _id: courseId,
      studentsEntrolled: { $elemMatch: { userId: userId } },
    });

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // check if user has already given rating and review or not

    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already given rating and review for this course",
      });
    }

    // create rating and review
    const ratingReview = await RatingAndReview.create({
      user: userId,
      rating,
      review,
    });

    // update course with rating and review
    const updatedCourseDetails = await Course.findByIdAndUpdate(courseId, {
      $push: { ratingAndReviews: ratingReview._id },
    });

    console.log(updatedCourseDetails);

    // return response
    return res.status(200).json({
      success: true,
      message: "Rating and review created successfully",
      data: ratingReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @decs getAverageRating
exports.getAverageRating = async (req, res) => {
  try {
    // get course id
    const courseId = req.body.courseId;

    // calculate average rating
    const result = await RatingAndReview.aggregate([
      {
        $match: { course: new mongoose.Types.ObjectId(courseId) },
      },
      {
        $group: {
          _id: "$course",
          averageRating: { $avg: "$rating" },
        },
      },
    ]);
    // return rating
    if (result.rating > 0) {
      return res.status(200).json({
        success: true,
        message: "Rating fetched successfully",
        averageRating: result[0].averageRating,
      });
    }

    if (result.rating === 0) {
      return res.status(200).json({
        success: true,
        message: "Rating fetched successfully",
        averageRating: 0,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all rating and reviews

exports.getAllRating = async (req, res) => {
  try {
    // get course id
    const courseId = req.body.courseId;

    // get all rating and reviews
    const ratingAndReviews = await RatingAndReview.find({})
      .sort({ rating: -1 })
      .populate({
        path: "user",
        select: "name lastname email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();

    // return response
    return res.status(200).json({
      success: true,
      message: "Rating and reviews fetched successfully",
      data: ratingAndReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
