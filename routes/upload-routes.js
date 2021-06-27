const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/upload-controller');
const auth = require('../utils/auth');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const {storageFileUser} = require('../utils/storage/storage-file');
const {storageImageUser, storageImageListing} = require('../utils/storage/storage-image');

const validation = require('../utils/listingValidator');


router.post('/file-user', storageFileUser, awaitHandlerFactory(UploadController.uploadFile));
router.post('/image-user', storageImageUser,  awaitHandlerFactory(UploadController.uploadImage));

router.post('/image-listing', storageImageListing,  awaitHandlerFactory(UploadController.uploadImage));



module.exports = router;