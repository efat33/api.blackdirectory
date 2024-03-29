const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class UserModel {
  tableName = 'users';
  tableNameMeta = 'users_meta';
  tableNameEducation = 'candidate_education';
  tableNameExperience = 'candidate_experience';
  tableNamePortfolio = 'candidate_portfolio';
  tableNameUserReview = 'user_reviews';
  tableNameFollowStats = 'user_follow_stats';
  tableNameNotifications = 'user_notifications';
  tableNameUserRequest = 'user_requests';

  findOneMatchAny = async (params = {}) => {
    let sql = `SELECT * FROM ${this.tableName}`;

    if (!Object.keys(params).length) {
      return await query(sql);
    }

    const { columnSet, values } = multipleColumnSet(params, 'OR')
    sql += ` WHERE ${columnSet}`;

    return await query(sql, [...values]);
  }

  findOne = async (params, table = `${this.tableName}`) => {
    const { columnSet, values } = multipleColumnSet(params)

    const sql = `SELECT * FROM ${table}
    WHERE ${columnSet} LIMIT 1`;

    const result = await query(sql, [...values]);

    // return back the first row (user)
    return result[0];
  }

  find = async (params = {}, table = `${this.tableName}`, orderby = '') => {
    let sql = `SELECT * FROM ${table}`;

    if (!Object.keys(params).length) {
      if(orderby != '') sql += ` ${orderby}`;
      return await query(sql);
    }

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

    if(orderby != '') sql += ` ${orderby}`;

    return await query(sql, [...values]);
  }

  loginWithFacebook = async (params) => {
    const { columnSet, values } = multipleColumnSet(params)

    // console.log(values);

    const sql = `SELECT * FROM ${this.tableName}
    WHERE ${columnSet}`;

    const result = await query(sql, [...values]);

    // return back the first row (user)
    return result[0];
  }

  register = async ({ email, username, password, auth_type, role, created_at, updated_at, verification_key }) => {

    // const user = await query(`SELECT email, username, referral_code FROM ${this.tableName}`);

    const sql = `INSERT INTO ${this.tableName}
    (email, username, display_name, password, auth_type, role, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`;
    const regResult = await query(sql, [email, username, username, password, auth_type, role, created_at, updated_at]);


    // return data to controller
    const output = {}

    if (regResult.insertId) {
      // insert data to users meta table
      const user_id = regResult.insertId;
      const sql_meta = `INSERT INTO ${this.tableNameMeta} (user_id, meta_key, meta_value) VALUES ?`;
      const values = [
        [user_id, 'verification_key', verification_key],
        [user_id, 'reset_passwork_key', ''],
        [user_id, 'facebook_link', ''],
        [user_id, 'twitter_link', ''],
        [user_id, 'linkedin_link', ''],
        [user_id, 'instagram_link', ''],
        [user_id, 'pinterest_link', ''],
        [user_id, 'spotify_link', ''],
        [user_id, 'tiktok_link', ''],
        [user_id, 'youtube_link', ''],
        [user_id, 'apple_music_link', ''],
        [user_id, 'tidal_link', ''],
        [user_id, 'soundcloud_link', '']
      ];

      // prepare other meta data
      if (role == 'employer') {
        values.push(
          [user_id, 'website', ''],
          [user_id, 'founded_date', '']
        );
      }
      else if (role == 'candidate') {
        values.push(
          [user_id, 'job_title', ''],
          [user_id, 'job_industry', ''],
          [user_id, 'salary_type', ''],
          [user_id, 'salary_amount', ''],
          [user_id, 'age', ''],
          [user_id, 'academics', ''],
          [user_id, 'gender', ''],
          [user_id, 'availble_now', ''],
          [user_id, 'cover_letter', ''],
          [user_id, 'candidate_cv', '']
        );
      }

      const regMetaResult = await query2(sql_meta, [values]);

      output.status = 200
      output.data = { 'user_id': regResult.insertId }
    }
    else {
      output.status = 401
    }

    return output;
  }

  userForgotPassword = async ({ email, reset_key }) => {

    const user = await this.findOne({ email });

    if (user) {
      const sqlUser = `UPDATE ${this.tableNameMeta} SET meta_value = ? WHERE user_id = ? AND meta_key = ?`;
      const result = await query(sqlUser, [reset_key, user.id, 'reset_passwork_key']);

      return result;
    }
    else {
      return false;
    }

  }

  updateRow = async (params, conditions, tableName) => {

    const values = [];
    const sqlParamsArr = [];
    const sqlConditionsArr = [];

    Object.entries(params).forEach(([key, val]) => {
      sqlParamsArr.push(`${key} = ?`);
      values.push(val);
    });

    Object.entries(conditions).forEach(([key, val]) => {
      sqlConditionsArr.push(`${key} = ?`);
      values.push(val);
    });

    const sqlParams = sqlParamsArr.join(',');
    const sqlConditions = sqlConditionsArr.join(' AND ');

    const sqlUser = `UPDATE ${tableName} SET ${sqlParams} WHERE ${sqlConditions}`;
    const result = await query(sqlUser, values);

    return result;
  }

  updatePassword = async ({ id, password, updated_at }) => {
    const sqlUser = `UPDATE ${this.tableName} SET password = ?, updated_at = ? WHERE id = ?`;
    const result = await query(sqlUser, [password, updated_at, id]);

    if (result.affectedRows == 1) {
      const sqlUserMeta = `UPDATE ${this.tableNameMeta} SET meta_value = ? WHERE user_id = ? AND meta_key = ?`;
      const resultMeta = await query(sqlUserMeta, ['', id, 'reset_passwork_key']);

      if (resultMeta.affectedRows == 1) {
        return true;
      }
    }

    return false;
  }

  changePassword = async ({ id, password, updated_at }) => {
    const sqlUser = `UPDATE ${this.tableName} SET password = ?, updated_at = ? WHERE id = ?`;
    const result = await query(sqlUser, [password, updated_at, id]);

    if (result.affectedRows == 1) {
      return true;
    }

    return false;
  }

  updateProfile = async (basic_info, employer_info, candidate_info, current_user, candidate_others) => {

    const user_id = current_user.id;
    const user_role = current_user.role;

    const basic_colset = multipleColumnSet(basic_info, ',');

    const sql = `UPDATE ${this.tableName} SET ${basic_colset.columnSet} WHERE id = ?`;

    const result = await query(sql, [...basic_colset.values, user_id]);

    if (result.affectedRows == 1) {
      // update meta data
      if (user_role == 'employer') {
        // const sqlUserMeta = `UPDATE ${this.tableNameMeta} SET meta_value = ? WHERE user_id = ? AND meta_key = ?`;
        const sqlUserMeta = `INSERT INTO ${this.tableNameMeta} (user_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY UPDATE meta_value=VALUES(meta_value)`;
        const values = [];

        Object.entries(employer_info).forEach(([key, val]) => {
          const temp_arr = [user_id, key, val];
          values.push(temp_arr);
        });

        const regMetaResult = await query2(sqlUserMeta, [values]);

        return true;
      }
      else if (user_role == 'candidate') {
        const sqlUserMeta = `INSERT INTO ${this.tableNameMeta} (user_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY UPDATE meta_value=VALUES(meta_value)`;
        const values = [];

        Object.entries(candidate_info).forEach(([key, val]) => {
          const temp_arr = [user_id, key, val];
          values.push(temp_arr);
        });

        await query2(sqlUserMeta, [values]);

        /*********===================================*********/

        // first delete the existing educations 
        const sql_del_edu = `DELETE FROM ${this.tableNameEducation} WHERE user_id IN (?)`;
        await query(sql_del_edu, [user_id]);

        // insert educations anew 
        if (candidate_others.educations && candidate_others.educations.length > 0) {
          const sql = `INSERT INTO ${this.tableNameEducation} (user_id, title, institute, year, description, sequence) VALUES ?`;
          const insertData = [];
          
          for (let i = 0; i < candidate_others.educations.length; i++) {
            const edu = candidate_others.educations[i];
            const temp_arr = [edu.user_id, edu.title, edu.institute, edu.year, edu.description, i];
            insertData.push(temp_arr);
          }
          
          await query2(sql, [insertData]);
        }

        /*********===================================*********/

        // first delete the existing experience 
        const sql_del_exp = `DELETE FROM ${this.tableNameExperience} WHERE user_id IN (?)`;
        await query(sql_del_exp, [user_id]);

        // insert experience anew 
        if (candidate_others.experiences && candidate_others.experiences.length > 0) {
          const sql = `INSERT INTO ${this.tableNameExperience} (user_id, title, start_date, end_date, present, company, description, sequence) VALUES ?`;
          const insertData = [];

          for (let i = 0; i < candidate_others.experiences.length; i++) {
            const item = candidate_others.experiences[i];
            const present = item.present ? 1 : 0;
            const temp_arr = [item.user_id, item.title, item.start_date, item.end_date, present, item.company, item.description, i];
            insertData.push(temp_arr);
          }
          
          await query2(sql, [insertData]);
        }


        /*********===================================*********/

        // first delete the existing portfolios 
        const sql_del_port = `DELETE FROM ${this.tableNamePortfolio} WHERE user_id IN (?)`;
        await query(sql_del_port, [user_id]);

        // insert portfolios anew 
        if (candidate_others.portfolios && candidate_others.portfolios.length > 0) {
          const sql = `INSERT INTO ${this.tableNamePortfolio} (user_id, title, image, youtube_url, site_url, sequence) VALUES ?`;
          const insertData = [];
          
          for (let i = 0; i < candidate_others.portfolios.length; i++) {
            const item = candidate_others.portfolios[i];
            const temp_arr = [item.user_id, item.title, item.image_name, item.youtube_url, item.site_url, i];
            insertData.push(temp_arr);
          }
          
          await query2(sql, [insertData]);
        }

        return true;

      }
    }

    return true;
  }

  updateUserPostMeta = async (userId, meta) => {
    const sql = `INSERT INTO ${this.tableNameMeta} (user_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY UPDATE meta_value=VALUES(meta_value)`;
    const meta_values = [];

    for (let [meta_key, meta_value] of Object.entries(meta)) {
      meta_values.push([parseInt(userId), meta_key, meta_value])
    }

    if (meta_values.length) {
      return await query2(sql, [meta_values]);
    }
  }

  getUserProfile = async ({ id, role }) => {

    const sqlUser = `SELECT * FROM ${this.tableName}  WHERE id = ? LIMIT 1`;
    const result = await query(sqlUser, [id]);
    const { password, ...userDetails } = result[0];

    const sqlUserMeta = `SELECT * FROM ${this.tableNameMeta}  WHERE user_id = ?`;
    const userMeta = await query(sqlUserMeta, [id]);


    const output = {
      'data': userDetails,
      'meta_data': userMeta
    }

    if (!role) {
      role = userDetails.role;
    }

    if (role == 'candidate') {
      const sqlUserEdu = `SELECT * FROM ${this.tableNameEducation}  WHERE user_id = ? ORDER BY sequence`;
      output.educations = await query(sqlUserEdu, [id]);

      const sqlUserExp = `SELECT * FROM ${this.tableNameExperience}  WHERE user_id = ? ORDER BY sequence`;
      output.experiences = await query(sqlUserExp, [id]);

      const sqlUserPort = `SELECT * FROM ${this.tableNamePortfolio}  WHERE user_id = ? ORDER BY sequence`;
      output.portfolios = await query(sqlUserPort, [id]);
    }

    return output;
  }

  getUserDetails = async ({ username }) => {

    const sqlUser = `SELECT u.id, u.email, u.first_name, u.last_name, u.username, u.display_name, u.dob, u.phone, u.is_business, u.description, u.job_sectors_id,
      u.pubic_view, u.profile_photo, u.cover_photo, u.role, u.forum_role, u.views, u.address, u.latitude, u.longitude, u.featured, u.auth_type, u.verified, u.created_at,
      u.updated_at, u.role, s.title AS sector
      FROM ${this.tableName} u
      LEFT JOIN job_sectors s ON s.id = u.job_sectors_id  
      WHERE u.username = ? LIMIT 1`;

    const result = await query(sqlUser, [username]);
    const { password, ...userDetails } = result[0];

    const sqlUserMeta = `SELECT * FROM ${this.tableNameMeta}  WHERE user_id = ?`;
    const userMeta = await query(sqlUserMeta, [userDetails.id]);


    const output = {
      'data': userDetails,
      'meta_data': userMeta
    }

    if (userDetails.role == 'candidate') {
      const sqlUserEdu = `SELECT * FROM ${this.tableNameEducation}  WHERE user_id = ? ORDER BY sequence`;
      output.educations = await query(sqlUserEdu, [userDetails.id]);

      const sqlUserExp = `SELECT * FROM ${this.tableNameExperience}  WHERE user_id = ? ORDER BY sequence`;
      output.experiences = await query(sqlUserExp, [userDetails.id]);

      const sqlUserPort = `SELECT * FROM ${this.tableNamePortfolio}  WHERE user_id = ? ORDER BY sequence`;
      output.portfolios = await query(sqlUserPort, [userDetails.id]);
    }

    return output;
  }

  getUserDetailsByID = async ({ id }) => {

    const sqlUser = `SELECT * FROM ${this.tableName}  WHERE id = ? LIMIT 1`;
    const result = await query(sqlUser, [id]);
    const { password, ...userDetails } = result[0];

    const sqlUserMeta = `SELECT * FROM ${this.tableNameMeta}  WHERE user_id = ?`;
    const userMeta = await query(sqlUserMeta, [id]);


    const output = {
      'data': userDetails,
      'meta_data': userMeta
    }

    if (userDetails.role == 'candidate') {
      const sqlUserEdu = `SELECT * FROM ${this.tableNameEducation}  WHERE user_id = ? ORDER BY sequence`;
      output.educations = await query(sqlUserEdu, [id]);

      const sqlUserExp = `SELECT * FROM ${this.tableNameExperience}  WHERE user_id = ? ORDER BY sequence`;
      output.experiences = await query(sqlUserExp, [id]);

      const sqlUserPort = `SELECT * FROM ${this.tableNamePortfolio}  WHERE user_id = ? ORDER BY sequence`;
      output.portfolios = await query(sqlUserPort, [id]);
    }

    return output;
  }

  verifyAccount = async ({ id }) => {

    const result = await this.updateRow({ 'verified': 1 }, { 'id': id }, this.tableName);

    if (result.affectedRows == 1) {
      // account is verified. now remove verification key
      const resultMeta = await this.updateRow({ 'meta_value': '' }, { 'user_id': id, 'meta_key': 'verification_key' }, this.tableNameMeta);

      return result;
    }

    return false;
  }

  registerImport = async ({ email, username, password, auth_type, role, created_at, updated_at, verification_key, display_name, verified }) => {

    // const user = await query(`SELECT email, username, referral_code FROM ${this.tableName}`);

    const sql = `INSERT INTO ${this.tableName}
    (email, username, display_name, password, auth_type, role, verified, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`;
    const regResult = await query(sql, [email, username, display_name, password, auth_type, role, verified, created_at, updated_at]);


    // return data to controller
    const output = {}

    if (regResult.insertId) {
      // insert data to users meta table
      const user_id = regResult.insertId;
      const sql_meta = `INSERT INTO ${this.tableNameMeta} (user_id, meta_key, meta_value) VALUES ?`;
      const values = [
        [user_id, 'verification_key', verification_key],
        [user_id, 'reset_passwork_key', ''],
        [user_id, 'facebook_link', ''],
        [user_id, 'twitter_link', ''],
        [user_id, 'linkedin_link', ''],
        [user_id, 'instagram_link', ''],
        [user_id, 'pinterest_link', ''],
        [user_id, 'spotify_link', ''],
        [user_id, 'tiktok_link', ''],
        [user_id, 'youtube_link', ''],
        [user_id, 'apple_music_link', ''],
        [user_id, 'tidal_link', ''],
        [user_id, 'soundcloud_link', '']
      ];

      // prepare other meta data
      if (role == 'employer') {
        values.push(
          [user_id, 'website', ''],
          [user_id, 'founded_date', '']
        );
      }
      else if (role == 'candidate') {
        values.push(
          [user_id, 'job_title', ''],
          [user_id, 'job_industry', ''],
          [user_id, 'salary_type', ''],
          [user_id, 'salary_amount', ''],
          [user_id, 'age', ''],
          [user_id, 'academics', ''],
          [user_id, 'gender', ''],
          [user_id, 'availble_now', ''],
          [user_id, 'cover_letter', ''],
          [user_id, 'candidate_cv', '']
        );
      }

      const regMetaResult = await query2(sql_meta, [values]);

      output.status = 200
      output.data = { 'user_id': regResult.insertId }
    }
    else {
      output.status = 401
    }

    return output;
  }

  importUsers = async () => {

    // const sql = `SELECT tax.term_id as tx_term_id, tax.taxonomy as taxonomy, terms.term_id as term_id, terms.name as title 
    //               FROM wplc_term_taxonomy tax 
    //               LEFT JOIN wplc_terms terms ON tax.term_id = terms.term_id 
    //               WHERE taxonomy = 'sector' ORDER BY term_id`;
    // const result = await query(sql);

    // if(result.length > 0){
    //   const sql_meta = `INSERT INTO job_sectors (id, title) VALUES ?`;
    //   const values = [];
    //   for (let sector of result) {
    //     const tmp = [sector.term_id, sector.title];
    //     values.push(tmp);
    //   }

    //   const regMetaResult = await query2(sql_meta, [values]);
    // }

    const sql = `SELECT u.ID as id, u.user_login as username, u.user_pass as password, u.user_email as email, u.user_registered as created_at, u.user_activation_key as verification_key, u.display_name as display_name
                  FROM wplc_users u`;
    const users = await query(sql);

    const sql_meta = `SELECT um.* 
                  FROM wplc_usermeta um`;
    const users_meta = await query(sql_meta);

    // const sql_post = `SELECT p.post_type as type, pm.* 
    //               FROM wplc_posts p 
    //               LEFT JOIN wplc_postmeta pm ON pm.post_id = p.ID 
    //               WHERE p.post_type  = 'employer' OR p.post_type = 'candidate' `;
    // const post_meta = await query(sql_post);

    // console.log(PHPUnserialize.unserialize(users_meta[46].meta_value));
    // console.log(commonfn.filterUserMetaItems(users_meta, 244, 'wplc_capabilities'));

    // check the user role
    for (const [i, item] of users.entries()) {
      let user_role = '';
      const user_roles_obj = PHPUnserialize.unserialize(commonfn.filterUserMetaItems(users_meta, item.id, 'wplc_capabilities'));
      const user_roles_arr = Object.keys(user_roles_obj);
      if (user_roles_arr.includes("administrator")) {
        user_role = 'admin';
      }
      else if (user_roles_arr.includes("jobsearch_employer")) {
        user_role = 'employer';
      }
      else {
        user_role = 'candidate';
      }
      users[i].role = user_role;

      let user_verified = commonfn.filterUserMetaItems(users_meta, item.id, 'wilcity_confirmed')
      users[i].verified = user_verified == 1 ? 1 : 0;

      const registerInfo = {
        "email": item.email,
        "username": item.username,
        "password": item.password,
        "auth_type": "general",
        "role": user_role,
        "created_at": item.created_at,
        "updated_at": item.created_at,
        "verification_key": item.verification_key,
        "display_name": item.display_name,
        "verified": user_verified == 1 ? 1 : 0
      }
      // await this.registerImport(registerInfo);
    }
    


    return users_meta;
  }


  getUserReviews = async (id) => {
    let sql = `SELECT Reviews.*, Users.display_name as candidate_display_name,
        Users.username as candidate_username, Users.profile_photo as candidate_profile_photo  
        FROM ${this.tableNameUserReview} as Reviews 
        LEFT JOIN ${this.tableName} as Users ON Users.id=Reviews.candidate_id  
        WHERE Reviews.employer_id=?
        ORDER BY created_at DESC`;

    return await query(sql, [id]);
  }

  createUserReview = async (employer_id, params, currentUser) => {
    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;
    let output = {};

    const sql = `INSERT INTO ${this.tableNameUserReview} 
            (
                candidate_id, 
                employer_id, 
                rating_quality, 
                rating_communication, 
                rating_goodwill, 
                rating_overall, 
                review, 
                created_at
            ) 
            VALUES (?,?,?,?,?,?,?,?)`;

    const values = [
      user_id,
      employer_id,
      params.rating_quality,
      params.rating_communication,
      params.rating_goodwill,
      params.rating_overall,
      params.review,
      current_date
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200;
    }
    else {
      output.status = 401;
    }

    return output;
  }

  createUserFollower = async (employer_id, currentUser) => {
    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;
    let output = {};

    const sql = `INSERT INTO ${this.tableNameFollowStats} 
            (candidate_id, employer_id, created_at) 
            VALUES (?,?,?)`;

    const values = [
      user_id,
      employer_id,
      current_date
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200;
    }
    else {
      output.status = 401;
    }

    return output;
  }

  getFollowers = async (currentUser) => {
    let sql = `SELECT Followers.*, Users.display_name as candidate_display_name, Users.email as candidate_email,
        Users.username as candidate_username, Users.profile_photo as candidate_profile_photo  
        FROM ${this.tableNameFollowStats} as Followers 
        LEFT JOIN ${this.tableName} as Users ON Users.id=Followers.candidate_id  
        WHERE Followers.employer_id=?`;

    return await query(sql, [currentUser.id]);
  }

  getFollowings = async (currentUser) => {
    let sql = `SELECT Followings.*, Users.display_name as employer_display_name, Users.email as employer_email,
        Users.username as employer_username, Users.profile_photo as employer_profile_photo,
        JobSectors.title as job_sector, Users.address as employer_address   
        FROM ${this.tableNameFollowStats} as Followings 
        LEFT JOIN ${this.tableName} as Users ON Users.id=Followings.employer_id  
        LEFT JOIN job_sectors as JobSectors ON JobSectors.id=Users.job_sectors_id  
        WHERE Followings.candidate_id=?`;

    return await query(sql, [currentUser.id]);
  }

  deleteFollowing = async (employer_id, currentUser) => {
    const sql = `DELETE FROM ${this.tableNameFollowStats} WHERE candidate_id=? AND employer_id=?`;
    const values = [currentUser.id, employer_id];

    return await query(sql, values);
  }

  createNotification = async (params = {}) => {
    let output = {};

    const sql = `INSERT INTO ${this.tableNameNotifications} 
            (user_id, acted_user_id, notification_trigger, notification_type, notification_type_id) 
            VALUES (?,?,?,?,?)`;

    const values = [
      params.user_id,
      params.acted_user_id,
      params.notification_trigger,
      params.notification_type,
      params.notification_type_id
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200;
      output.id = result.insertId;
    }
    else {
      output.status = 401;
    }

    return output;
  }

  getNotifications = async (currentUser) => {
    let sql = `SELECT Notifications.*, 
        ActedUser.display_name as user_display_name, ActedUser.username as user_username
        FROM ${this.tableNameNotifications} as Notifications 
        LEFT JOIN ${this.tableName} as User ON User.id=Notifications.user_id 
        LEFT JOIN ${this.tableName} as ActedUser ON ActedUser.id=Notifications.acted_user_id
        WHERE Notifications.user_id=?
        ORDER BY Notifications.created_at DESC`;

    return await query(sql, [currentUser.id]);
  }

  getNotification = async (id) => {
    let sql = `SELECT Notifications.*, 
        ActedUser.display_name as acted_user_display_name, ActedUser.username as acted_user_username,
        User.email as user_email, User.display_name as user_display_name, User.username as user_username 
        FROM ${this.tableNameNotifications} as Notifications 
        LEFT JOIN ${this.tableName} as User ON User.id=Notifications.user_id 
        LEFT JOIN ${this.tableName} as ActedUser ON ActedUser.id=Notifications.acted_user_id
        WHERE Notifications.id=?
        ORDER BY Notifications.created_at DESC`;

    return await query(sql, [id]);
  }

  updateNotification = async (notificationId, params) => {
    let sql = `UPDATE ${this.tableNameNotifications} SET`;

    const paramArray = [];
    for (let param in params) {
      paramArray.push(` ${param} = ?`);
    }

    sql += paramArray.join(', ');

    sql += ` WHERE id = ?`;

    const values = [
      ...Object.values(params),
      notificationId
    ];

    const result = await query(sql, values);

    return result;
  }

  deleteNotification = async (notification_id) => {
    const sql = `DELETE FROM ${this.tableNameNotifications} WHERE id=?`;
    const values = [notification_id];

    return await query(sql, values);
  }

  getUsersByIds = async (userIds) => {
    const sql = `SELECT * FROM ${this.tableName} WHERE id IN (?)`;

    return await query2(sql, [userIds]);
  }

  verifiyEmail = async (verification_key) => {
    const sql = `SELECT * FROM ${this.tableNameMeta} WHERE meta_key='verification_key' AND meta_value=?`;

    const result = await query(sql, [verification_key]);

    if (result.length) {
      const userId = result[0].user_id;

      const verifySql = `UPDATE ${this.tableName} SET verified=1 WHERE id=${userId}`;
      await query(verifySql);

      return true;
    }
    
    return false;
  }

  increaseCVDownloadCount = async (currentUser) => {
    const sql = `INSERT INTO ${this.tableNameMeta} (user_id, meta_key, meta_value)
      VALUES ? ON DUPLICATE KEY UPDATE meta_value = meta_value + 1`;

    return await query2(sql, [[[currentUser.id, 'cv_download', 1]]]);
  }

  userRequest = async (params, currentUser) => {
    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;
    let output = {};

    const sql = `INSERT INTO ${this.tableNameUserRequest} 
            (
              user_id, 
              user_email, 
              request_type, 
              description, 
              created_at
            ) 
            VALUES (?,?,?,?,?)`;

    const values = [
      user_id,
      params.user_email,
      params.request,
      params.description,
      current_date
    ];

    const result = await query(sql, values);

    // deactivate the account if user requests for delete 
    if(params.request == 'delete'){
      const basic_info = {
        'is_deactivated': 1,
        'updated_at': current_date
      }
      
      const basic_colset = multipleColumnSet(basic_info, ',');
      
      const sql = `UPDATE ${this.tableName} SET ${basic_colset.columnSet} WHERE id = ?`;
      await query(sql, [...basic_colset.values, user_id]);
    }

    return result;
    
  }

  userRequestDeactivate = async (params) => {
    const current_date = commonfn.dateTimeNow();
    let output = { status: 401};
    const user_id = params.user_id;

    const basic_info = {
      'is_deactivated': 1,
      'updated_at': current_date
    }
    
    const basic_colset = multipleColumnSet(basic_info, ',');
    
    const sql = `UPDATE ${this.tableName} SET ${basic_colset.columnSet} WHERE id = ?`;
    
    const result = await query(sql, [...basic_colset.values, user_id]);
    
    
    if (result.affectedRows == 1) {
      const sql = `DELETE FROM ${this.tableNameUserRequest} WHERE id IN (?)`;
      await query(sql, [params.id]);

      output.status = 200;
    }

    return output;
  }

  userRequestReactivate = async (params) => {
    const current_date = commonfn.dateTimeNow();
    let output = { status: 401};
    const user_id = params.id;
    console.log(params);
    const basic_info = {
      'is_deactivated': 0,
      'updated_at': current_date
    }
    
    const basic_colset = multipleColumnSet(basic_info, ',');
    
    const sql = `UPDATE ${this.tableName} SET ${basic_colset.columnSet} WHERE id = ?`;
    
    const result = await query(sql, [...basic_colset.values, user_id]);
    
    
    if (result.affectedRows == 1) {

      output.status = 200;
    }

    return output;
  }

}

module.exports = new UserModel;
