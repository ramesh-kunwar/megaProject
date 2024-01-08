const SubSection = require("../models/SubSectionSchema");
const Section = require("../models/SectionSchema");
const { uploadImageToCloudinary } = require("../utils/ImageUploder");

// create subSection
exports.createSubSection = async (req, res) => {
  try {
    // fetch data from req body;
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
    // upload video to cloudinary

    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    // create a subSection
    const subSectionDetails = await SubSection.create({
      title,
      timeDuration,
      description,
      videoUrl: uploadDetails.secure_url,
    });

    // update section with this subSection objectId
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSectioin: subSectionDetails._id,
        },
      },
      { new: true }
    );

    // TODO: log updated section here, after adding populate query
    // return res

    return res.status(201).json({
      success: false,
      msg: "Sub Section creation successful",
      updatedSection,
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

// TDOO: delete subsection
