const Profile = require("../models/Profile");
const User = require("../models/User");

exports.updateProfile = async (req, res) => {
  try {
    // get data
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    // get userId
    const userId = req.user.id;

    // validation

    if (!contactNumber || !gender || userId) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    // find profile
    const userDetails = await Profile.findById(userId);
    const profileId = userDetails.additionalDetails;

    const profileDetails = await Profile.findById(profileId);

    // update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.contactNumber = contactNumber;
    profileDetails.gender = gender;

    // save profile
    await profileDetails.save();

    // return response
    return res.status(200).json({
      success: true,
      msg: "Profile updated successfully",
      data: profileDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Profile updation failed",
      error: error.message,
    });
  }
};

// delete account
// TODO: Explore how can we schedule this deletion operation
exports.deleteAccount = async (req, res) => {
  try {
    // get userId
    const userId = req.user.id;

    // validate

    // find user
    const userDetails = await User.findById(userId);

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        msg: "User not found",
      });
    }
    // delete profile
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });

    // TODO: unenroll user from all enrolled courses

    // delete user
    await User.findByIdAndDelete({ _id: userId });

    // return response
    return res.status(200).json({
      success: true,
      msg: "Account deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Account deletion failed",
      error: error.message,
    });
  }
};

// get all user details

exports.getAllUserDetails = async (req, res) => {
  try {
    // get id
    const id = req.user.id;

    // validationa nd get user details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    // return response

    return res.status(200).json({
      success: true,
      msg: "All user details",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Error while fetching user details",
      error: error.message,
    });
  }
};
