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
        message: "All fields are required",
      });
    }
    // create section
    const newSection = await Section.create({
      sectionName,
    });

    // update course with section
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: { courseContent: newSection._id },
      },
      { new: true }
    ).populate("courseContent");
    // TODO: populate sub section also

    // return success response
    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: updatedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
        message: "All fields are required",
      });
    }

    // update section
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        sectionName,
      },
      { new: true }
    );

    // we don't need to update course becasue in courseSchema id is stored
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Unable to update section",
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    // get section id
    const { sectionId } = req.params;

    // delete section
    await Section.findByIdAndDelete(sectionId);

    // TODO: doo we need to delete teh entry from courseSchema also?

    // return success response
    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Unable to delete section",
    });
  }
};
