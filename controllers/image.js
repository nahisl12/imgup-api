const ImageRouter = require("express").Router();
const { response } = require("express");
require("dotenv").config();
const auth = require("../middleware/auth");
const Image = require("../models/image");
const User = require("../models/user");
const { upload, deleteFromAws } = require("./Helpers/AwsRequests");

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

      const key = image.key;

      const deleteInAws = await deleteFromAws(key);
      const deleteUserImage = await User.findOneAndUpdate({ _id: userId }, { $pull: { images: image._id } }); // this is used to remove the imageId from the user images array
      const deleteImage = await Image.findByIdAndDelete(imageId); // delete the image entry

      res.status(200).json({ message: "The image was successfully deleted" });
    }
  } catch (error) {
    console.log(error);
  }
});

// upload image endpoint
ImageRouter.post("/upload", auth, upload.single("image"), async (req, res, next) => {
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
});

module.exports = ImageRouter;
