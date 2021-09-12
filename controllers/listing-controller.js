const ListingModel = require("../models/listing-model");
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const { DBTables } = require('../utils/common');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const listingModel = require("../models/listing-model");
dotenv.config();

class ListingController {

  checkValidation = (req) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new AppError(400, "400_paramMissingGeneral", null, errors);
    }
  };

  newListing = async (req, res, next) => {
    // check primary validation set in listingValidator.js
    this.checkValidation(req);
    // console.log(req.body.restaurants[0]);
    // return;


    const result = await ListingModel.createListing(req.body, req.currentUser);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_added", { 'entity': 'entity_listing' }, result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  updateListing = async (req, res, next) => {
    // check primary validation set in listingValidator.js
    this.checkValidation(req);
    // console.log(req.body);
    // return;

    // do validation
    if (!req.body.id) {
      throw new AppError(401, "400_paramMissing", { 'entity': 'entity_id' });
    }
    if (req.body.user_id != req.currentUser.id && req.body.claimer_id != req.currentUser.id) {
      throw new AppError(401, "401_invalidCredentials");
    }


    const result = await ListingModel.editListing(req.body, req.currentUser);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_listing' }, result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  searchListing = async (req, res, next) => {

    // if(!req.body.lat || !req.body.lng){
    //   throw new AppError(401, "Location is required");
    // }

    if (req.currentUser && req.currentUser.role === 'admin') {
      delete req.body.user_id;
    }

    const result = await ListingModel.searchListing(req.body);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_listing' }, result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // get all the listings
  getListings = async (req, res, next) => {


    const result = await ListingModel.getListings(req.params);


    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_listing' }, result);


  };

  // get single listing details
  getListing = async (req, res, next) => {
    const result = await ListingModel.getListing(req.params);

    if (Object.keys(result).length === 0) throw new AppError(403, "403_unknownError");

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_listing' }, result);


  };

  // get current users favorite listings
  getFavorites = async (req, res, next) => {

    let favorites = [];
    if(req.currentUser){
      favorites = await ListingModel.getFavorites(req.currentUser.id);
    }

    new AppSuccess(res, 200, "200_successful", '', favorites);
  };

  getFavoriteListings = async (req, res, next) => {

    const result = await ListingModel.favoriteListings(req.body, req.currentUser);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_listing' }, result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // get current users favorite listings
  updateFavorite = async (req, res, next) => {

    const result = await ListingModel.updateFavorite(req.params.id, req.currentUser.id);

    new AppSuccess(res, 200, "200_successful");
  };


  publishListing = async (req, res, next) => {


    // validation if listing user_id or claimer_id equal to current user id
    if (!req.body.id) {
      throw new AppError(401, "400_paramMissing", { 'entity': 'entity_id' });
    }

    // get the listing details
    const listing = await listingModel.findOne({ id: req.body.id });
    if (Object.keys(listing).length == 0) {
      throw new AppError(401, "401_invalidRequest");
    }

    if (listing.user_id != req.currentUser.id && listing.claimer_id != req.currentUser.id) {
      throw new AppError(401, "401_invalidCredentials");
    }

    const result = await ListingModel.publishListing(req.body);

    if (result) {

      new AppSuccess(res, 200, "Published Successfully");

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // delete listing
  deleteListing = async (req, res, next) => {

    // first get the review details
    const listing = await ListingModel.findOne({ 'id': req.params.id });

    if (Object.keys(listing).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    if (req.currentUser.role !== 'admin' && listing.user_id != req.currentUser.id) {
      throw new AppError(401, "Unauthorised");
    }

    const result = await ListingModel.deleteListing(req.params.id);

    if (result.affectedRows > 0) {
      new AppSuccess(res, 200, "Deleted Successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  // get listing categories
  getCategories = async (req, res, next) => {
    
    const result = await ListingModel.find('', DBTables.listing_categories);
    new AppSuccess(res, 200, "200_successful", '', result);
 
  };

  // update view of a listing
  updateView = async (req, res, next) => {
    
    const result = await ListingModel.updateView(req.params.id);
    new AppSuccess(res, 200, "200_successful");
 
  };

  newReview = async (req, res, next) => {

    // validation
    if (req.body.listing_id == '') {
      throw new AppError(403, "Listing ID is required");
    }
    if (req.body.user_id == '') {
      throw new AppError(403, "User ID is required");
    }
    if (req.body.rating == '') {
      throw new AppError(403, "Rating is required");
    }
    if (req.body.title == '') {
      throw new AppError(403, "Title is required");
    }
    if (req.body.description == '') {
      throw new AppError(403, "Description is required");
    }


    const result = await ListingModel.newReview(req.body);

    if (result) {

      new AppSuccess(res, 200, "Published Successfully");

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  editReview = async (req, res, next) => {

    // validation
    if (req.body.listing_id == '') {
      throw new AppError(401, "Listing ID is required");
    }
    if (req.body.user_id == '') {
      throw new AppError(401, "User ID is required");
    }
    if (req.body.id == '') {
      throw new AppError(401, "ID is required");
    }
    if (req.body.rating == '') {
      throw new AppError(401, "Rating is required");
    }
    if (req.body.title == '') {
      throw new AppError(401, "Title is required");
    }
    if (req.body.description == '') {
      throw new AppError(401, "Description is required");
    }
    if (req.body.user_id != req.currentUser.id) {
      throw new AppError(401, "Unauthorised");
    }


    const result = await ListingModel.editReview(req.body);

    if (result) {

      new AppSuccess(res, 200, "Updated Successfully");

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  getReviews = async (req, res, next) => {

    const result = await ListingModel.getReviews(req.params);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_reviews' }, result);

  };

  deleteReview = async (req, res, next) => {

    // first get the review details
    const review = await ListingModel.findOne({ 'id': req.params.id }, DBTables.listing_reviews);

    if (Object.keys(review).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    if (review.user_id != req.currentUser.id) {
      throw new AppError(401, "Unauthorised");
    }

    const data = {
      'id': req.params.id,
      'listing_id': review.listing_id,
    }
    const result = await ListingModel.deleteReview(data);

    if (result.affectedRows > 0) {
      new AppSuccess(res, 200, "Deleted Successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  updateReviewLike = async (req, res, next) => {

    const result = await ListingModel.updateReviewLike(req.body);

    new AppSuccess(res, 200, "200_successful", '', result);

  };

  addOrEditComment = async (req, res, next) => {

    // validation
    if (req.body.review_id == '') {
      throw new AppError(401, "Review ID is required");
    }
    if (req.body.comment == '') {
      throw new AppError(401, "Comment is required");
    }
    if (req.body.comment_id != '' && req.body.user_id != req.currentUser.id) {
      throw new AppError(403, "Unauthorised");
    }


    const result = await ListingModel.addOrEditComment(req.body);

    if (result) {

      new AppSuccess(res, 200, "Updated Successfully");

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  deleteComment = async (req, res, next) => {

    // first get the review details
    const review = await ListingModel.findOne({ 'id': req.params.id }, DBTables.listing_reviews);

    if (Object.keys(review).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    if (review.user_id != req.currentUser.id) {
      throw new AppError(401, "Unauthorised");
    }

    const data = {
      'id': req.params.id,
      'review_id': review.parent_id,
    }
    const result = await ListingModel.deleteComment(data);

    if (result.affectedRows > 0) {
      new AppSuccess(res, 200, "Deleted Successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }


  getListingCategories = async (req, res, next) => {
    const result = await ListingModel.getListingCategories();

    new AppSuccess(res, 200, "200_successful", { 'entity': 'entity_category' }, result);
  };

  getTrendingCategories = async (req, res, next) => {
    const result = await ListingModel.getTrendingCategories();

    new AppSuccess(res, 200, "200_successful", { 'entity': 'entity_category' }, result);
  };

  newListingCategory = async (req, res, next) => {
    const listingCategory = await ListingModel.createListingCategory(req.body);

    if (listingCategory.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_category' });
  }

  updateListingCategory = async (req, res, next) => {
    const result = await ListingModel.updateListingCategory(req.params.category_id, req.body);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_category' }, result);
  };

  deleteListingCategory = async (req, res, next) => {
    const result = await ListingModel.getListingCategory(req.params.category_id);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    await ListingModel.deleteListingCategory(req.params.category_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_category' });
  };

  newClaim = async (req, res, next) => {

    // validation
    if (req.body.listing_id == '') {
      throw new AppError(403, "Listing ID is required");
    }
    if (req.body.firstname  == '') {
      throw new AppError(403, "Firstname is required");
    }
    if (req.body.lastname == '') {
      throw new AppError(403, "Lastname is required");
    }
    if (req.body.phone == '') {
      throw new AppError(403, "Phone is required");
    }
    if (req.body.email == '') {
      throw new AppError(403, "Email is required");
    }

    // check if the user has already applied for this listing
    const claim = await ListingModel.findOne({listing_id: req.body.listing_id, user_id: req.currentUser.id}, DBTables.listing_claims);

    if (Object.keys(claim).length > 0){
      throw new AppError(403, "You have already submitted claim request for this listing");
    }

    const result = await ListingModel.newClaim(req.body, req.currentUser);

    if (result) {

      new AppSuccess(res, 200, "Submitted Successfully");

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  getClaims = async (req, res, next) => {
    const result = await ListingModel.getClaims(req.body);

    new AppSuccess(res, 200, "200_successful", '', result);
  };


  approveClaim = async (req, res, next) => {
    const result = await ListingModel.approveClaim(req.params.id);

    if (result.affectedRows && result.affectedRows > 0) {
      new AppSuccess(res, 200, "Successfully Approved");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  };


  deleteClaim = async (req, res, next) => {
    const result = await ListingModel.deleteClaim(req.params.id);

    if (result.affectedRows > 0) {
      new AppSuccess(res, 200, "200_deleted_successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
    
  };

}

module.exports = new ListingController();
