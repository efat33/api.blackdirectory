const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/upload-controller');
const auth = require('../utils/auth');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const {storageFileUser, storageFileJob} = require('../utils/storage/storage-file');
const storageImage = require('../utils/storage/storage-image');

const validation = require('../utils/listingValidator');


router.post('/file-user', storageFileUser, awaitHandlerFactory(UploadController.uploadFile));
router.post('/image-user', storageImage.storageImageUser,  awaitHandlerFactory(UploadController.uploadImage));

router.post('/image-listing', storageImage.storageImageListing,  awaitHandlerFactory(UploadController.uploadImage));

router.post('/image-event', storageImage.storageImageEvent,  awaitHandlerFactory(UploadController.uploadImage));

router.post('/file-job', storageFileJob, awaitHandlerFactory(UploadController.uploadFile));

router.post('/image-news', storageImage.storageImageNews, awaitHandlerFactory(UploadController.uploadImage));
router.post('/image-news-ckeditor', storageImage.storageImageNewsCkeditor, awaitHandlerFactory(UploadController.uploadImageCkeditor));

router.post('/image-product', storageImage.storageImageProduct, awaitHandlerFactory(UploadController.uploadImage));
router.post('/image-store', storageImage.storageImageShop, awaitHandlerFactory(UploadController.uploadImage));

router.post('/image-mobiles', storageImage.storageImageMobiles, awaitHandlerFactory(UploadController.uploadImage));

module.exports = router;