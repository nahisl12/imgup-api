const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
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
    next(new Error("Invalid file type, JPEG are PNG are supported only"), false);
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

const deleteFromAws = async (key) => {
  const imageToDelete = await s3
    .deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    })
    .promise();
};

module.exports = { upload, deleteFromAws };
