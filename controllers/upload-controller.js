const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const dotenv = require("dotenv");
const sharp = require('sharp');
dotenv.config();

class UploadController {

    uploadImage = async (req, res, next) => {

        if (!req.file) {
            new AppSuccess(res, 200, "200_uploadSuccess", '', {fileValidationError: req.fileValidationError});
            return;
        }

        // resize the images
        if(req.body.resize && req.body.resize == 'yes'){
            
            const image = sharp(req.file.path);

            image
            .metadata()
            .then(function(metadata) {

                // resize thumbnail
                if(metadata.width > 200){
                    image
                    .resize(200)
                    .toFile(req.file.destination + '/thumb-' + req.file.filename);
                }
                else{
                    image
                    .resize(metadata.width)
                    .toFile(req.file.destination + '/thumb-' + req.file.filename);
                }
                
                // resize medium
                if(metadata.width > 400){
                    image
                    .resize(400)
                    .toFile(req.file.destination + '/medium-' + req.file.filename);
                }
                else{
                    image
                    .resize(metadata.width)
                    .toFile(req.file.destination + '/medium-' + req.file.filename);
                }

                // resize large
                if(metadata.width > 1200){
                    image
                    .resize(1200)
                    .toFile(req.file.destination + '/large-' + req.file.filename);
                }
                else{
                    image
                    .resize(metadata.width)
                    .toFile(req.file.destination + '/large-' + req.file.filename);
                }

            });

        }

        new AppSuccess(res, 200, "200_uploadSuccess", '', {filename: req.file.filename});
    
    };


    uploadFile = async (req, res, next) => {
        if (!req.file) {
            new AppSuccess(res, 200, "200_uploadSuccess", '', {fileValidationError: req.fileValidationError});
            return;
        }
        new AppSuccess(res, 200, "200_uploadSuccess", '', {filename: req.file.filename});
    
    };

}

module.exports = new UploadController();
