exports.RESPONSE_CODES = Object.freeze({
  "415_unsupported": "Unsupported Content Type :entity",
  "401_invalidApiKey": "Invalid HTTP request",
  "401_invalidRequest": "Invalid request",
  "415_missingHeader": "Missing Header :entity.",
  "400_paramMissing": "Please enter :entity.",
  "400_paramMissingGeneral": "Please enter the missing fields",

  "401_unauthorised": "Uauthorized",
  "401_invalidCredentials": "Uauthorized",
  "401_accountNotVerified": "Account is not verified",
  "401_accountDeactivated": "Account is deactivated",
  "401_invalidAge": "You must be 18 to register",
  "401_notEmployer": "You must be an employer",
  "401_notAdmin": "You must be an admin",
  "401_notCreateForum": "You are not allowed to create forum",
  "401_notUpdateForum": "You are not allowed to update forum",
  "401_notCreateTopic": "You are not allowed to create topic",
  "401_notUpdateTopic": "You are not allowed to update topic",
  "401_notCreateReply": "You are not allowed to post reply",
  "401_notUpdateReply": "You are not allowed to update reply",
  "401_notAdminOrEmployer": "You must be an admin or an employer",
  "403_unknownError": "Something went wrong. Please try again.",

  // Errors
  // Generalized erros
  "404_foundNothing": ":entity not found",

  // User Specific Errors
  "403_emailAlreadyExists": "Email already exists",
  "403_usernameAlreadyExists": "Username already exists",
  "403_emailUsernameAlreadyExists": "Email or Username already exists",
  "403_invalidEmail": "Invalid Email",
  "403_passwordValidation": "Password must be at least 8 characters, must contain one lowercase, one uppercase and one number",
  "403_passwordsDontMatch": "Passwords do not match",
  "403_passwordsCurrentDontMatch": "Current Passwords do not match",
  "403_newPasswordsDontMatch": "New Passwords do not match",
  "403_signInInvalidEmail": "Email is not correct",
  "403_signInInvalidPassword": "Password is not correct",
  "403_signInInvalidCredential": "Email/password invalid",
  "403_invalidResetKey": "Reset key is not valid",
  "403_invalidVerificationKey": "Verification key is not valid",

  // File Specific Error
  "403_invalidImageFormat": "Supported images are png, jpg and jpeg",
  "403_invalidFileFormat": "Supported file type are doc, docx, pdf and file size cannot be greater than 5MB",

  // Mail Specific Error
  "403_missingValue": "Subject and Body are required",




  // SUCCESS
  // Generalized Success
  "200_successful": "Successful",
  "200_loginSuccessful": "Login Successful",
  "200_retrieved": "Retrieved successfully",
  "200_detailFound": ":entity retrieved successfully",
  "200_registerSuccess": "Registered successfully",
  "200_verifiedSuccess": "Account is verified successfully",
  "200_recorded": ":entity recorded successfully",
  "200_added_successfully": "Added successfully",
  "200_updated_successfully": "Updated successfully",
  "200_deleted_successfully": "Deleted successfully",
  "200_added": ":entity added successfully",
  "200_updated": ":entity updated successfully",
  "200_deleted": ":entity deleted successfully",

  // user Specific Success
  "200_userCreated": "Account created!",

  // File Specific Success
  "200_uploadSuccess": "Uploaded Successfully",

  // Mail Specific Success
  "200_mailSuccess": "Email Sent Successfully",
  
});

exports.ENTITIES = Object.freeze({

  // General
  entity_id: "ID",
  entity_reviews: "Reviews",
  entity_comment: "Comment",
  entity_details: "Details",
  entity_provider: "Provider",
  entity_page: "Page",
  entity_category: "Category",
  entity_tag: "Tag",

  // Users
  entity_apiKey: "API Key",
  entity_fullname: "Full Name",
  entity_username: "Username",
  entity_email: "Email",
  entity_user: "User",
  entity_users: "Users",
  entity_password: "Password",
  entity_confirmPassword: "Confirm Password",
  entity_userReview: "Review",
  entity_userFollower: "Follower",
  entity_notification: "Notification",

  // listing
  entity_listing: "Listing",
  entity_listingID: "Listing ID",

  // product
  entity_product: "Product",
  entity_productID: "Product ID",
  entity_order: "Order",


  // job
  entity_sectors: "Sectors",
  entity_sector: "Sector",
  entity_job: "Job",
  entity_jobApplication: "Job Application",

  // news
  entity_news: "News",

  // travel
  entity_travel: "Travel",

  // finance
  entity_finance: "Finance",   

  // forum
  entity_forum: "Forum",

  // topic
  entity_topic: "Topic",

  // reply
  entity_reply: "Reply",

  // event
  entity_event: "Event",
  entity_eventID: "Event ID",
  entity_organiser: "Organizer",
  
  // mobiles
  entity_mobile: "Mobile",
  entity_provider: "Provider",

  // deals
  entity_deal: "Deal",
  entity_deals: "Deals",
  entity_dealer: "Dealer",
  entity_dealers: "Dealers",
});
