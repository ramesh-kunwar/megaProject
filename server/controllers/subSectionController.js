const SubSection = require("../models/SubSectionSchema");
const Section = require("../models/SectionSchema");
const { uploadImageToCloudinary } = require("../utils/ImageUploder");

// create subSection
exports.createSubSection = async (req, res) => {
  try {
    // fetch data from req body
    const { sectionId, title, timeDuration, description } = req.body;

    // extract file/video
    const video = req.files.videoFile;

    // validation
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    // upload file/video to cloudinary
    const videoUrl = await uploadImageToCloudinary(video);

    // create subSection
    const subSection = await SubSection.create({
      title,
      timeDuration,
      description,
      videoUrl: videoUrl.secure_url,
    });

    // update section with subSection

    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      { $push: { subSections: subSection._id } },
      { new: true }
    );

    // TODO: log update section here,after adding populate query

    // send response
    return res.status(200).json({
      success: true,
      msg: "Sub Section created successfully",
      data: subSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Sub Section creation failed",
      error: error.message,
    });
  }
};

// TODO: update subsection

// TODO: delete subsection
