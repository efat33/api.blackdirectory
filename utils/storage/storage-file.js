const multer = require('multer');
const AppError = require("../appError");

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['pdf', 'docx', 'doc'];
  const ext = file.originalname.substring(file.originalname.lastIndexOf('.') + 1);
  if(allowedMimeTypes.includes(ext)){
    cb(null, true);
  }
  else{
    req.fileValidationError = 'Supported file type are doc, docx, pdf and file size cannot be greater than 5MB';
    cb(null, false);
  }
};

const diskStorageUser = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `uploads/users`);
  },
  filename: (req, file, cb) => {
    const fileType = file.originalname.substring(file.originalname.lastIndexOf('.') + 1);
    const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
    const fileName = onlyName.replace(' ', '-') + '-'+ Date.now() + '.' + fileType;
    cb(null, fileName);
  },
});


const diskStorageJob = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `uploads/job`);
  },
  filename: (req, file, cb) => {
    const fileType = file.originalname.substring(file.originalname.lastIndexOf('.') + 1);
    const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
    const fileName = onlyName.replace(' ', '-') + '-'+ Date.now() + '.' + fileType;
    cb(null, fileName);
  },
});

const storageFileUser = multer({ storage: diskStorageUser, fileFilter: fileFilter }).single(
  'file'
);

const storageFileJob = multer({ storage: diskStorageJob, fileFilter: fileFilter }).single(
  'file'
);

exports.storageFileUser = storageFileUser;
exports.storageFileJob = storageFileJob;
