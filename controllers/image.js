const ImageRouter = require("express").Router();
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

// get all public images
ImageRouter.get("/", async (req, res) => {
  try {
    const allImages = await Image.find({ status: "public" });
    if (allImages.length >= 1) {
      res.json(allImages);
    }
  } catch (error) {
    res.json({ message: error });
  }
});

// get all images belonging to this user
ImageRouter.get("/userImages", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // find images that have the user id in it
    // Might be better to do this by getting the image ids in the user from the decoded token and pull images
    // in the image database that match it
    const userImages = await Image.find({ user: user._id });

    res.status(201).json(userImages);
  } catch (error) {
    res.json(error);
  }
});

// End point for handling the editing of image data e.g status/folder its in
ImageRouter.put("/edit", auth, async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  try {
    const imageId = req.body.imageId;

    if (user._id) {
      // check if the image exists using the id
      const image = await Image.findByIdAndUpdate(
        imageId,
        {
          folder: req.body.folder,
          status: req.body.status,
        },
        { new: true }
      );
      res.status(200).json({ message: "The image was updated successfully" });
    }
  } catch (error) {
    console.log(error);
  }
});

// Delete image request
ImageRouter.delete("/delete", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const imageId = req.body.imageId;

    if (user._id) {
      // find the image by id and get the link to the picture
      const image = await Image.findById(imageId);
      const imageUrl = image.url; // get the url from the database record

      // const imageUrlSplit = imageUrl.split("/");
      const key = image.key;

      const imageToDelete = await s3
        .deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        })
        .promise();

      const userImages = user.images;
      const deleteUserImage = await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { images: image._id } }
      ); // this is used to remove the imageId from the user images array

      const deleteImage = await Image.findByIdAndDelete(imageId); // delete the image entry

      res.status(200).json({ message: "The image was successfully deleted" });
    }
  } catch (error) {
    console.log(error);
  }
});

// upload image endpoint
ImageRouter.post(
  "/upload",
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
        key: req.file.key,
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

module.exports = ImageRouter;
