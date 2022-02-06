const multer = require('multer');
const AppError = require("../appError");

const regexPattern = /[ &\/\\#, +()$~%.'":*?<>{}]/g;

const fileFilter = (reqm, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
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
        const fileName = onlyName.replace(' ', '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});

const storageImageUser = multer({ storage: diskStorageUser, fileFilter: fileFilter }).single(
    'image'
);

// listing storage
const diskStorageListing = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/listing`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '_') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});


const storageImageListing = multer({ storage: diskStorageListing, fileFilter: fileFilter }).single(
    'image'
);

// home hero storage
const diskStorageGallery = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/gallery`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '_') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});


const storageImageGallery = multer({ storage: diskStorageGallery, fileFilter: fileFilter }).single(
    'image'
);

// event storage
const diskStorageEvent = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/event`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});


const storageImageEvent = multer({ storage: diskStorageEvent, fileFilter: fileFilter }).single(
    'image'
);

// news storage
const diskStorageNews = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/news`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});


const storageImageNews = multer({ storage: diskStorageNews, fileFilter: fileFilter }).single(
    'image'
);

// ckeditor storage
const diskStorageNewsCkeditor = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/news`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});

const storageImageNewsCkeditor = multer({ storage: diskStorageNewsCkeditor, fileFilter: fileFilter }).single(
    'upload'
);

const diskStorageProduct = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/product`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});


const storageImageProduct = multer({ storage: diskStorageProduct, fileFilter: fileFilter }).single(
    'image'
);

const diskStorageShop = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/shop`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});


const storageImageShop = multer({ storage: diskStorageShop, fileFilter: fileFilter }).single(
    'image'
);

const diskStorageMobiles = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/mobiles`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});


const storageImageMobiles = multer({ storage: diskStorageMobiles, fileFilter: fileFilter }).single(
    'image'
);

// ckeditor storage
const diskStoragePagesCkeditor = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/pages`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});

const storageImagePagesCkeditor = multer({ storage: diskStoragePagesCkeditor, fileFilter: fileFilter }).single(
    'upload'
);


// deal storage
const diskStorageDeal = multer.diskStorage({
  destination: (reqm, file, cb) => {
      cb(null, `uploads/deal`);
  },
  filename: (reqm, file, cb) => {
      const mimeType = file.mimetype.split('/');
      const fileType = mimeType[1];
      const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
      const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
      cb(null, fileName);
  },
});


const storageImageDeal = multer({ storage: diskStorageDeal, fileFilter: fileFilter }).single(
  'image'
);

// ckeditor storage
const diskStorageDealCkeditor = multer.diskStorage({
  destination: (reqm, file, cb) => {
      cb(null, `uploads/deal`);
  },
  filename: (reqm, file, cb) => {
      const mimeType = file.mimetype.split('/');
      const fileType = mimeType[1];
      const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
      const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
      cb(null, fileName);
  },
});

const storageImageDealCkeditor = multer({ storage: diskStorageDealCkeditor, fileFilter: fileFilter }).single(
  'upload'
);


// travel storage
const diskStorageTravel = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/travels`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});


const storageImageTravel = multer({ storage: diskStorageTravel, fileFilter: fileFilter }).single(
    'image'
);

// ckeditor storage for travel
const diskStorageTravelCkeditor = multer.diskStorage({
    destination: (reqm, file, cb) => {
        cb(null, `uploads/news`);
    },
    filename: (reqm, file, cb) => {
        const mimeType = file.mimetype.split('/');
        const fileType = mimeType[1];
        const onlyName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        const fileName = onlyName.replace(regexPattern, '-') + '-' + Date.now() + '.' + fileType;
        cb(null, fileName);
    },
});

const storageImageTravelCkeditor = multer({ storage: diskStorageTravelCkeditor, fileFilter: fileFilter }).single(
    'upload'
);

module.exports = {
    storageImageUser,
    storageImageListing,
    storageImageGallery,
    storageImageNews,
    storageImageNewsCkeditor,
    storageImageProduct,
    storageImageEvent,
    storageImageShop,
    storageImageMobiles,
    storageImagePagesCkeditor,
    storageImageDeal,
    storageImageDealCkeditor,
    storageImageTravel,
    storageImageTravelCkeditor
}
