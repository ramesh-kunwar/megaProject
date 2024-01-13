const Category = require("../models/CategorySchema");

exports.createCategory = async (req, res) => {
  try {
    // fetch data from the request body
    const { name, description } = req.body;
    // check if the fields are empty
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // check if the category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    // create a new category

    const category = await Category.create({
      name,
      description,
    });

    // return the response
    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    // fetch all categories
    const categories = await Category.find(
      {},
      { name: true, description: true }
    );

    // send response
    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// category page details
exports.categoryPageDetails = async (req, res) => {
  try {
    // get the category id
    const { categoryId } = req.body;

    // fetch all the courses in that category
    const selectedCategory = await Category.findById(categoryId)
      .populate("course")
      .exec();

    // validation
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // get courses for different categories
    const differentCategories = await Category.find(
      { _id: { $ne: categoryId } } // $ne means not equal to
    )
      .populate("course")
      .exec();

    // get top selling courses
    const topSellingCourses = await Course.find({})
      .sort({
        sales: -1,
      })
      .limit(3)
      .exec();

    // return the response

    return res.status(200).json({
      success: true,
      message: "Category page details fetched successfully",
      data: {
        selectedCategory,
        differentCategories,
        topSellingCourses,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
