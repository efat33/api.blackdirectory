const multer = require('multer');
const AppError = require("../appError");

const fileFilter = (reqm, file, cb) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if(allowedMimeTypes.includes(file.mimetype)){
    cb(null, true);
  }
  else{
    req.fileValidationError = 'Supported image type are png, jpg, jpeg and image size cannot be greater than 1MB';
    cb(null, false);
  }
};

// user storage
const diskStorageUser = multer.diskStorage({
  destination: (reqm, file, cb) => {
    cb(null, `uploads/users`);
  },
  filename: (reqm, file, cb) => {
    const mimeType = file.mimetype.split('/');
    const fileType = mimeType[1];
    const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
    const fileName = onlyName.replace(' ', '-') + '-'+ Date.now() + '.' + fileType;
    cb(null, fileName);
  },
});

// listing storage
const storageImageUser = multer({ storage: diskStorageUser, fileFilter: fileFilter }).single(
  'image'
);

const diskStorageListing = multer.diskStorage({
  destination: (reqm, file, cb) => {
    cb(null, `uploads/listing`);
  },
  filename: (reqm, file, cb) => {
    const mimeType = file.mimetype.split('/');
    const fileType = mimeType[1];
    const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
    const fileName = onlyName.replace(' ', '-') + '-'+ Date.now() + '.' + fileType;
    cb(null, fileName);
  },
});


const storageImageListing = multer({ storage: diskStorageListing, fileFilter: fileFilter }).single(
  'image'
);

exports.storageImageUser = storageImageUser;
exports.storageImageListing = storageImageListing;