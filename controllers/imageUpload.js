const imageUploadRouter = require("express").Router();
const aws = require("aws-sdk");
const { response } = require("express");
require("dotenv").config();
const multer = require("multer");
const multerS3 = require("multer-s3");
const auth = require("../middleware/auth");
const Image = require("../models/image");
const User = require("../models/user");
const path = require("path");

const s3 = new aws.S3();

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_BUCKET_REGION,
});

const filter = (req, file, next) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    next(null, true);
  } else {
    next(
      new Error("Invalid file type, JPEG are PNG are supported only"),
      false
    );
  }
};

const upload = multer({
  filter,
  storage: multerS3({
    acl: "public-read",
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now().toString()}${ext}`);
    },
  }),
});

imageUploadRouter.post(
  "/",
  auth,
  upload.single("image"),
  async (req, res, next) => {
    try {
      // id is inside req.user._id with decrypted token
      const userId = req.user.id;
      // find the user upload a file
      const user = await User.findById(userId);

      if (!user) {
        return res.json({ userId });
      }
      // create image object and store in database
      const image = new Image({
        url: req.file.location,
        author: req.user.username,
        user: user._id,
        folder: "default",
        status: "private",
      });

      // // save the image to the db
      const savedImage = await image.save(image);
      //search for the user using the id passed through with the request and update the images array in it
      user.images = user.images.concat(savedImage._id);
      await user.save();

      response.status(200).json(savedImage.url);
    } catch (error) {
      res.json(error);
    }
  }
);

module.exports = imageUploadRouter;
