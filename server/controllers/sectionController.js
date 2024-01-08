const Section = require("../models/SectionSchema");

const Course = require("../models/CourseSchema");

exports.createSection = async (req, res) => {
  try {
    // data fetch
    const { sectionName, courseId } = req.body;
    // data validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        msg: "All field are required",
      });
    }
    // create section
    const newSection = await Section.create({
      sectionName,
    });
    // update section in course -> push section id to course
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },

      { new: true }
    );

    // // use populate to replace sections/sub-sections both in the updatedCourseDetails

    // send response
    return res.status(200).json({
      success: true,
      msg: "Section created successfully",
      updatedCourseDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Section creation failed",
      error: error.message,
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    // data input
    const { sectionName, sectionId } = req.body;
    // data validation
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        msg: "All field are required",
      });
    }
    // update data

    const section = await Section.findByIdAndUpdate(
      sectionId,
      {
        sectionName,
      },
      {
        new: true,
      }
    );

    // return res
    return res.status(200).json({
      success: true,
      msg: "Section updated successfully",
      section,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Section update failed",
      error: error.message,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    // get ID - assuming that we are sending ID in params
    const { sectionId } = req.params;

    // use findByIdAndDelete
    await Section.findByIdAndDelete(sectionId);

    // TODO[Testing Time]: do we need to delete the entry from the course schema ?

    // send res
    return res.status(200).json({
      success: true,
      msg: "Section deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Section deletion failed",
      error: error.message,
    });
  }
};
