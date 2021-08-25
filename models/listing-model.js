const { query, query2, query3 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');
const { DBTables } = require('../utils/common');

class ListingModel {
  tableName = 'listings';
  tableUsers = 'users';
  tableListingHours = 'listing_business_hours';
  tableCategories = 'listing_categories';
  tableListingCategories = 'listing_categories_listing';
  tableListingContact = 'listing_contact';
  tableListingCoupon = 'listing_coupons';
  tableListingRestaurant = 'listing_restaurant';
  tableListingRestaurantItems = 'listing_restaurant_items';
  tableReview = 'listing_reviews';
  tableReviewLike = 'listing_review_likes';
  tableFavorites = 'listing_favorites';


  findOne = async (params, table = `${this.tableName}`) => {
    const { columnSet, values } = multipleColumnSet(params)

    const sql = `SELECT * FROM ${table}
    WHERE ${columnSet} LIMIT 1`;

    const result = await query(sql, [...values]);

    // return back the first row (user)
    return result[0] ? result[0] : {};

  }

  find = async (params = {}, table = `${this.tableName}`, orderby = '') => {
    let sql = `SELECT * FROM ${table}`;

    if (!Object.keys(params).length) {
      return await query(sql);
    }

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

    if (orderby != '') sql += ` ${orderby}`;

    return await query(sql, [...values]);
  }

  findMatchAny = async (params = {}, table = `${this.tableName}`) => {
    let sql = `SELECT * FROM ${table}`;

    if (!Object.keys(params).length) {
      return await query(sql);
    }

    const { columnSet, values } = multipleColumnSet(params, 'OR')
    sql += ` WHERE ${columnSet}`;

    return await query(sql, [...values]);
  }


  createListing = async (params, currentUser) => {



    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;
    const user_role = currentUser.role;
    let claimer_id = '';
    const output = {}



    if (user_role == 'candidate' || user_role == 'employer') claimer_id = user_id;
    // console.log(params.galleries);
    // return output;

    let slug = await commonfn.generateSlug(params.title, this.tableName);

    // process galleries data
    const galleries = [];
    if (params.galleries.length > 0) {
      for (const item of params.galleries) {
        if (item.image != '') galleries.push(item.image);
      }
    }


    // insert data into listings table
    const sql = `INSERT INTO ${this.tableName}
    (user_id, claimer_id, title, slug, tagline, logo, 
      cover_img, description, address, lat, lng, 
      price_range, price_min, price_max, featured_img, galleries, 
      business_hour, video_urls, products, button_icon, button_link, 
      coupon_title, coupon_description, coupon_image, coupon_code, coupon_popup_desc, coupon_link, coupon_expiry_date
      button_name, status, created_at, updated_at) 
      VALUES (?,?,?,?,?,?,
        ?,?,?,?,?,
        ?,?,?,?,?,
        ?,?,?,?,?,
        ?,?,?,?,?,?,?
        ?,?,?,?)`;

    const regResult = await query(sql, [user_id, claimer_id, params.title, slug, params.tagline, params.logo,
      params.cover_img, params.description, params.address, params.lat, params.lng,
      params.price_range, params.price_min, params.price_max, params.featured_img, JSON.stringify(galleries),
      params.business_hour, JSON.stringify(params.video_urls), JSON.stringify(params.products), params.button_icon, params.button_link,
      params.coupon_title, params.coupon_description, params.coupon_image, params.coupon_code, params.coupon_popup_desc, params.coupon_link, params.coupon_expiry_date,
      params.button_name, 'draft', current_date, current_date]);


    if (regResult.insertId) {

      const listing_id = regResult.insertId;

      // insert data to listing business hours table
      if (params.business_hour == 'open_for_selected_hours') {
        const sql_meta = `INSERT INTO ${this.tableListingHours} (listing_id, day_of_week, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ?`;
        const valuesHours = [];

        // Monday business hour
        const mondayHour = params.businsessHourMonday;
        const tmpMonday = [listing_id, 'monday', mondayHour.is_open, mondayHour.times[0].open, mondayHour.times[0].closes];
        if (mondayHour.times.length > 1) {
          tmpMonday.push(mondayHour.times[1].open);
          tmpMonday.push(mondayHour.times[1].closes);
        }
        else {
          tmpMonday.push(null);
          tmpMonday.push(null);
        }
        valuesHours.push(tmpMonday);

        // Tuesday business hour
        const tuesdayHour = params.businsessHourTuesday;
        const tmpTuesday = [listing_id, 'tuesday', tuesdayHour.is_open, tuesdayHour.times[0].open, tuesdayHour.times[0].closes];
        if (tuesdayHour.times.length > 1) {
          tmpTuesday.push(tuesdayHour.times[1].open);
          tmpTuesday.push(tuesdayHour.times[1].closes);
        }
        else {
          tmpTuesday.push(null);
          tmpTuesday.push(null);
        }
        valuesHours.push(tmpTuesday);

        // Wednesday business hour
        const wednesdayHour = params.businsessHourWednesday;
        const tmpWednesday = [listing_id, 'wednesday', wednesdayHour.is_open, wednesdayHour.times[0].open, wednesdayHour.times[0].closes];
        if (wednesdayHour.times.length > 1) {
          tmpWednesday.push(wednesdayHour.times[1].open);
          tmpWednesday.push(wednesdayHour.times[1].closes);
        }
        else {
          tmpWednesday.push(null);
          tmpWednesday.push(null);
        }
        valuesHours.push(tmpWednesday);

        // Thursday business hour
        const thursdayHour = params.businsessHourThursday;
        const tmpThursday = [listing_id, 'thursday', thursdayHour.is_open, thursdayHour.times[0].open, thursdayHour.times[0].closes];
        if (thursdayHour.times.length > 1) {
          tmpThursday.push(thursdayHour.times[1].open);
          tmpThursday.push(thursdayHour.times[1].closes);
        }
        else {
          tmpThursday.push(null);
          tmpThursday.push(null);
        }
        valuesHours.push(tmpThursday);

        // Friday business hour
        const fridayHour = params.businsessHourFriday;
        const tmpFriday = [listing_id, 'friday', fridayHour.is_open, fridayHour.times[0].open, fridayHour.times[0].closes];
        if (fridayHour.times.length > 1) {
          tmpFriday.push(fridayHour.times[1].open);
          tmpFriday.push(fridayHour.times[1].closes);
        }
        else {
          tmpFriday.push(null);
          tmpFriday.push(null);
        }
        valuesHours.push(tmpFriday);

        // Saturday business hour
        const saturdayHour = params.businsessHourSaturday;
        const tmpSaturday = [listing_id, 'saturday', saturdayHour.is_open, saturdayHour.times[0].open, saturdayHour.times[0].closes];
        if (saturdayHour.times.length > 1) {
          tmpSaturday.push(saturdayHour.times[1].open);
          tmpSaturday.push(saturdayHour.times[1].closes);
        }
        else {
          tmpSaturday.push(null);
          tmpSaturday.push(null);
        }
        valuesHours.push(tmpSaturday);

        // Sunday business hour
        const sundayHour = params.businsessHourSunday;
        const tmpSunday = [listing_id, 'sunday', sundayHour.is_open, sundayHour.times[0].open, sundayHour.times[0].closes];
        if (sundayHour.times.length > 1) {
          tmpSunday.push(sundayHour.times[1].open);
          tmpSunday.push(sundayHour.times[1].closes);
        }
        else {
          tmpSunday.push(null);
          tmpSunday.push(null);
        }
        valuesHours.push(tmpSunday);

        const resultListingHours = await query2(sql_meta, [valuesHours]);

      }

      // insert data to listing categories table
      if (params.categories.length > 0) {
        const sql_meta = `INSERT INTO ${this.tableListingCategories} (listing_id, listing_categories_id) VALUES ?`;
        const values = [];

        for (let x of params.categories) {
          const tmp = [listing_id, x];
          values.push(tmp);
        }

        const resultListingCategories = await query2(sql_meta, [values]);

      }

      // insert contacts
      const sql_meta = `INSERT INTO ${this.tableListingContact} (listing_id, email, phone, website, facebook, tiktok, twitter, linkedin) VALUES (?,?,?,?,?,?,?,?)`;
      const values = [listing_id, params.email, params.phone, params.website, params.facebook, params.tiktok, params.twitter, params.linkedin];

      const resultListingContact = await query(sql_meta, values);



      // insert restaurants
      if (params.restaurants.length > 0) {

        for (let restaurant of params.restaurants) {
          const sql_res = `INSERT INTO ${this.tableListingRestaurant} (listing_id, title, description, icon) VALUES (?,?,?,?)`;
          const valuesRes = [listing_id, restaurant.title, restaurant.description, restaurant.icon];

          const resultRestaurant = await query(sql_res, valuesRes);

          if (resultRestaurant.insertId && restaurant.items.length > 0) {

            const listing_res_id = resultRestaurant.insertId;

            const sql_item = `INSERT INTO ${this.tableListingRestaurantItems} (listing_restaurant_id, listing_id, title, description, image, price, link, open_new_window) VALUES ?`;
            const valuesItem = [];

            for (let item of restaurant.items) {
              const tmp = [listing_res_id, listing_id, item.title, item.description, item.image, item.price, item.link, item.is_new_window];
              valuesItem.push(tmp);
            }

            const resultRestaurantItem = await query2(sql_item, [valuesItem]);
          }

        }

      }

      output.status = 200
      output.data = { 'listing_id': listing_id, 'slug': slug }
    }
    else {
      output.status = 401
    }

    return output;
  }

  editListing = async (params, currentUser) => {

    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;
    const listing_id = params.id;
    const output = {}

    // process galleries data
    const galleries = [];
    if (params.galleries.length > 0) {
      for (const item of params.galleries) {
        if (item.image != '') galleries.push(item.image);
      }
    }

    // update listing table
    const basic_info = {
      'title': params.title,
      'tagline': params.tagline,
      'logo': params.logo,
      'cover_img': params.cover_img,
      'description': params.description,
      'address': params.address,
      'lat': params.lat,
      'lng': params.lng,
      'price_range': params.price_range,
      'price_min': params.price_min,
      'price_max': params.price_max,
      'featured_img': params.featured_img,
      'galleries': JSON.stringify(galleries),
      'video_urls': JSON.stringify(params.video_urls),
      'products': JSON.stringify(params.products),
      'business_hour': params.business_hour,
      'button_icon': params.button_icon,
      'button_link': params.button_link,
      'button_name': params.button_name,

      'coupon_title': params.coupon_title,
      'coupon_description': params.coupon_description,
      'coupon_image': params.coupon_image,
      'coupon_code': params.coupon_code,
      'coupon_popup_desc': params.coupon_popup_desc,
      'coupon_link': params.coupon_link,
      'coupon_expiry_date': params.coupon_expiry_date,
      'status': 'draft',
      'updated_at': current_date
    }

    const basic_colset = multipleColumnSet(basic_info, ',');

    const sql = `UPDATE ${this.tableName} SET ${basic_colset.columnSet} WHERE id = ?`;

    const result = await query(sql, [...basic_colset.values, listing_id]);


    if (result.affectedRows == 1) {

      // insert data to listing business hours table
      if (params.business_hour == 'open_for_selected_hours') {

        // Monday business hour
        const mondayHour = params.businsessHourMonday;

        const sqlHmMonday = `INSERT INTO ${this.tableListingHours} (id, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ? ON DUPLICATE KEY 
                              UPDATE is_open=VALUES(is_open), first_hour_start=VALUES(first_hour_start), first_hour_end=VALUES(first_hour_end),
                              second_hour_start=VALUES(second_hour_start), second_hour_end=VALUES(second_hour_end)`;
        const valuesMonday = [
          [mondayHour.id, mondayHour.is_open, mondayHour.times[0].open, mondayHour.times[0].closes]
        ];

        if (mondayHour.times.length > 1) {
          valuesMonday[0].push(mondayHour.times[1].open);
          valuesMonday[0].push(mondayHour.times[1].closes);
        }
        else {
          valuesMonday[0].push(null);
          valuesMonday[0].push(null);
        }

        await query2(sqlHmMonday, [valuesMonday]);

        // Tuesday business hour
        const tuesdayHour = params.businsessHourTuesday;
        const sqlHmTuesday = `INSERT INTO ${this.tableListingHours} (id, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ? ON DUPLICATE KEY 
                              UPDATE is_open=VALUES(is_open), first_hour_start=VALUES(first_hour_start), first_hour_end=VALUES(first_hour_end),
                              second_hour_start=VALUES(second_hour_start), second_hour_end=VALUES(second_hour_end)`;
        const valuesTuesday = [
          [tuesdayHour.id, tuesdayHour.is_open, tuesdayHour.times[0].open, tuesdayHour.times[0].closes]
        ];

        if (tuesdayHour.times.length > 1) {
          valuesTuesday[0].push(tuesdayHour.times[1].open);
          valuesTuesday[0].push(tuesdayHour.times[1].closes);
        }
        else {
          valuesTuesday[0].push(null);
          valuesTuesday[0].push(null);
        }

        await query2(sqlHmTuesday, [valuesTuesday]);

        // Wednesday business hour
        const wednesdayHour = params.businsessHourWednesday;
        const sqlHmWednesday = `INSERT INTO ${this.tableListingHours} (id, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ? ON DUPLICATE KEY 
                UPDATE is_open=VALUES(is_open), first_hour_start=VALUES(first_hour_start), first_hour_end=VALUES(first_hour_end),
                second_hour_start=VALUES(second_hour_start), second_hour_end=VALUES(second_hour_end)`;
        const valuesWednesday = [
          [wednesdayHour.id, wednesdayHour.is_open, wednesdayHour.times[0].open, wednesdayHour.times[0].closes]
        ];

        if (wednesdayHour.times.length > 1) {
          valuesWednesday[0].push(wednesdayHour.times[1].open);
          valuesWednesday[0].push(wednesdayHour.times[1].closes);
        }
        else {
          valuesWednesday[0].push(null);
          valuesWednesday[0].push(null);
        }

        await query2(sqlHmWednesday, [valuesWednesday]);

        // Thursday business hour
        const thursdayHour = params.businsessHourThursday;
        const sqlHmThursday = `INSERT INTO ${this.tableListingHours} (id, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ? ON DUPLICATE KEY 
                UPDATE is_open=VALUES(is_open), first_hour_start=VALUES(first_hour_start), first_hour_end=VALUES(first_hour_end),
                second_hour_start=VALUES(second_hour_start), second_hour_end=VALUES(second_hour_end)`;
        const valuesThursday = [
          [thursdayHour.id, thursdayHour.is_open, thursdayHour.times[0].open, thursdayHour.times[0].closes]
        ];

        if (thursdayHour.times.length > 1) {
          valuesThursday[0].push(thursdayHour.times[1].open);
          valuesThursday[0].push(thursdayHour.times[1].closes);
        }
        else {
          valuesThursday[0].push(null);
          valuesThursday[0].push(null);
        }

        await query2(sqlHmThursday, [valuesThursday]);

        // Friday business hour
        const fridayHour = params.businsessHourFriday;
        const sqlHmFriday = `INSERT INTO ${this.tableListingHours} (id, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ? ON DUPLICATE KEY 
                UPDATE is_open=VALUES(is_open), first_hour_start=VALUES(first_hour_start), first_hour_end=VALUES(first_hour_end),
                second_hour_start=VALUES(second_hour_start), second_hour_end=VALUES(second_hour_end)`;
        const valuesFriday = [
          [fridayHour.id, fridayHour.is_open, fridayHour.times[0].open, fridayHour.times[0].closes]
        ];

        if (fridayHour.times.length > 1) {
          valuesFriday[0].push(fridayHour.times[1].open);
          valuesFriday[0].push(fridayHour.times[1].closes);
        }
        else {
          valuesFriday[0].push(null);
          valuesFriday[0].push(null);
        }

        await query2(sqlHmFriday, [valuesFriday]);

        // Saturday business hour
        const saturdayHour = params.businsessHourSaturday;
        const sqlHmSaturday = `INSERT INTO ${this.tableListingHours} (id, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ? ON DUPLICATE KEY 
                UPDATE is_open=VALUES(is_open), first_hour_start=VALUES(first_hour_start), first_hour_end=VALUES(first_hour_end),
                second_hour_start=VALUES(second_hour_start), second_hour_end=VALUES(second_hour_end)`;
        const valuesSaturday = [
          [saturdayHour.id, saturdayHour.is_open, saturdayHour.times[0].open, saturdayHour.times[0].closes]
        ];

        if (saturdayHour.times.length > 1) {
          valuesSaturday[0].push(saturdayHour.times[1].open);
          valuesSaturday[0].push(saturdayHour.times[1].closes);
        }
        else {
          valuesSaturday[0].push(null);
          valuesSaturday[0].push(null);
        }

        await query2(sqlHmSaturday, [valuesSaturday]);

        // Sunday business hour
        const sundayHour = params.businsessHourSunday;
        const sqlHmSunday = `INSERT INTO ${this.tableListingHours} (id, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ? ON DUPLICATE KEY 
                UPDATE is_open=VALUES(is_open), first_hour_start=VALUES(first_hour_start), first_hour_end=VALUES(first_hour_end),
                second_hour_start=VALUES(second_hour_start), second_hour_end=VALUES(second_hour_end)`;
        const valuesSunday = [
          [sundayHour.id, sundayHour.is_open, sundayHour.times[0].open, sundayHour.times[0].closes]
        ];

        if (sundayHour.times.length > 1) {
          valuesSunday[0].push(sundayHour.times[1].open);
          valuesSunday[0].push(sundayHour.times[1].closes);
        }
        else {
          valuesSunday[0].push(null);
          valuesSunday[0].push(null);
        }

        await query2(sqlHmSunday, [valuesSunday]);


      }

      // insert data to listing categories table
      if (params.categories.length > 0) {

        // first delete the existing categories
        const sql_cat_del = `DELETE FROM ${this.tableListingCategories} WHERE listing_id = ?`;
        await query(sql_cat_del, [listing_id]);

        const sql_meta = `INSERT INTO ${this.tableListingCategories} (listing_id, listing_categories_id) VALUES ?`;
        const values = [];

        for (let x of params.categories) {
          const tmp = [listing_id, x];
          values.push(tmp);
        }

        const resultListingCategories = await query2(sql_meta, [values]);

      }

      // update contacts
      const sql_contact = `INSERT INTO ${this.tableListingContact} (listing_id, email, phone, website, facebook, tiktok, twitter, linkedin) VALUES ? ON DUPLICATE KEY 
                        UPDATE email=VALUES(email), phone=VALUES(phone), website=VALUES(website), facebook=VALUES(facebook), tiktok=VALUES(tiktok), twitter=VALUES(twitter), linkedin=VALUES(linkedin)`;
      const values_contact = [[listing_id, params.email, params.phone, params.website, params.facebook, params.tiktok, params.twitter, params.linkedin]];

      const resultListingContact = await query2(sql_contact, [values_contact]);


      // update restaurants
      // first delete the existing restaurants
      const sql_menu_del = `DELETE FROM ${this.tableListingRestaurant} WHERE listing_id = ?`;
      await query(sql_menu_del, [listing_id]);

      const sql_item_del = `DELETE FROM ${this.tableListingRestaurantItems} WHERE listing_id = ?`;
      await query(sql_item_del, [listing_id]);

      if (params.restaurants.length > 0) {

        for (let restaurant of params.restaurants) {
          const sql_res = `INSERT INTO ${this.tableListingRestaurant} (listing_id, title, description, icon) VALUES (?,?,?,?)`;
          const valuesRes = [listing_id, restaurant.title, restaurant.description, restaurant.icon];

          const resultRestaurant = await query(sql_res, valuesRes);

          if (resultRestaurant.insertId && restaurant.items.length > 0) {

            const listing_res_id = resultRestaurant.insertId;

            const sql_item = `INSERT INTO ${this.tableListingRestaurantItems} (listing_restaurant_id, listing_id, title, description, image, price, link, open_new_window) VALUES ?`;
            const valuesItem = [];

            for (let item of restaurant.items) {
              const tmp = [listing_res_id, listing_id, item.title, item.description, item.image, item.price, item.link, item.is_new_window];
              valuesItem.push(tmp);
            }

            const resultRestaurantItem = await query2(sql_item, [valuesItem]);
          }

        }

      }

      output.status = 200
      output.data = { 'listing_id': listing_id }
    }
    else {
      output.status = 401
    }

    return output;
  }

  searchListing = async (params = {}) => {

    const keyword = params.keyword ? params.keyword : '';
    const input_lat = params.lat ? params.lat : '';
    const input_lng = params.lng ? params.lng : '';

    const output = {}
    let values = [];

    let sql = '';
    let queryDistance = ''

    if(params.lat && params.lng){
      sql = `SELECT l.*, ( 6371 * acos( cos( radians('${encodeURI(input_lat)}') ) * cos( radians( l.lat ) ) * cos( radians( l.lng ) - radians('${encodeURI(input_lng)}') ) + sin( radians('${encodeURI(input_lat)}') ) * sin( radians( l.lat ) ) ) ) as listing_distance 
      FROM ${this.tableName} AS l`;

      queryDistance = ` HAVING listing_distance < 10`;
    }
    else{
      sql = `SELECT l.* FROM ${this.tableName} AS l`;
    }
    

    let queryParams = ` WHERE l.status = 'publish'`;
    if(params.user_id){
      queryParams += ` AND (l.user_id = ${encodeURI(params.user_id)} OR l.claimer_id = ${encodeURI(params.user_id)})`;
    }

    let queryJoinCat = '';
    if(params.category && params.category != ''){
      queryJoinCat += ` JOIN ${DBTables.listing_categories_listing} lc ON lc.listing_id = l.id`;
      queryParams += ` AND lc.listing_categories_id IN (${encodeURI(params.category)})`;
    }

    if(keyword != ''){
      queryParams += ` AND ( l.title LIKE '%${encodeURI(keyword)}%' OR l.description LIKE '%${encodeURI(keyword)}%' )`;
    }
    if(params.recommended){
      queryParams += ` AND l.recommended = 1`;
    }
    if(params.price && params.price != ''){
      queryParams += ` AND l.price_range = ?`;
      values.push(params.price);
    }
 
    if(params.discount){
      queryParams += ' AND l.coupon_code != "" AND l.coupon_expiry_date > NOW()';
    }
    
    
    // set order by
    let queryOrderby = '';
    if(params.orderby && params.orderby != ''){
      queryOrderby = ` ORDER BY ${encodeURI(params.orderby)}`;

      if(params.order && params.order != ''){
        queryOrderby += ` ${encodeURI(params.order)}`;
      }
    }

    // set limit 
    let queryLimit = '';
    if(params.limit && params.limit != '' && (params.offset == 0 || params.offset != '')){
      queryLimit = ` LIMIT ?, ?`;
      values.push(params.offset);
      values.push(params.limit);
    }
    else{
      queryLimit = ` LIMIT 0, 12`;
    }

    const count_sql = `${sql}${queryJoinCat}${queryParams}${queryDistance}${queryOrderby}`;
    sql += `${queryJoinCat}${queryParams}${queryDistance}${queryOrderby}${queryLimit}`;

    const listings = await query(sql, values);
    let total_listings = 0;

    if(listings.length > 0){

      const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
      const resultCount = await query(count_sql_final, values);
      
      total_listings = resultCount[0].count;

      const listing_ids = listings.map((l) => l['id']);
      
      // get contacts
      const sqlContacts = `SELECT * FROM ${DBTables.listing_contact} WHERE listing_id IN (${listing_ids.join()})`;
      const contacts = await query(sqlContacts);
      
      // get categories
      const sqlListCat = `SELECT lc.listing_id, lc.listing_categories_id, c.title, c.image 
                            FROM ${this.tableListingCategories} lc
                            JOIN ${this.tableCategories} c ON lc.listing_categories_id = c.id  
                            WHERE lc.listing_id IN (${listing_ids.join()})`;
      const categories = await query(sqlListCat);


      for (const item of listings) {
        item.contact = contacts.find((c) => c.listing_id == item.id);
        item.categories = categories.filter((c) => c.listing_id == item.id);
      }
    }
    output.status = 200;
    const data = {
      listings: listings,
      total_listings: total_listings
    }
    output.data = data;

    return output;
  }

  // get all the listings
  getListings = async (params) => {
    const limit = params.limit;
    const offset = params.offset;
    const orderby = params.orderby;
    const allParams = params.all ? params.all.split('&') : [];

    let sql = `SELECT * FROM ${this.tableName} `;

    let queryParams = `WHERE status = 'publish'`;
    let values = [];

    for (const item of allParams) {
      const param = item.split('=');

      switch (param[0]) {
        case 'featured':
          queryParams += ` AND featured = 1`;
          break;
      }

    }

    sql += queryParams;

    let queryOrderby = ` ORDER BY ${encodeURI(orderby)} DESC`;
    
    sql += `${queryOrderby} LIMIT ?, ?`;
    values.push(offset);
    values.push(limit);

    const listings = await query(sql, values);

    const listing_ids = listings.map((l) => l['id']);

    // get contacts
    const sqlContacts = `SELECT * FROM ${DBTables.listing_contact} WHERE listing_id IN (${listing_ids.join()})`;
    const contacts = await query(sqlContacts);

    // get categories
    const sqlListCat = `SELECT lc.listing_id, lc.listing_categories_id, c.title, c.image 
                          FROM ${this.tableListingCategories} lc
                          JOIN ${this.tableCategories} c ON lc.listing_categories_id = c.id  
                          WHERE lc.listing_id IN (${listing_ids.join()})`;
    const categories = await query(sqlListCat);


    for (const item of listings) {
      item.contact = contacts.find((c) => c.listing_id == item.id);
      item.categories = categories.filter((c) => c.listing_id == item.id);
    }

    return listings;

  }

  // get single listing
  getListing = async ({ slug }) => {
    const output = {};

    const sql = `SELECT * FROM ${this.tableName} WHERE slug=? LIMIT 1`;

    const result = await query(sql, [slug]);

    if (result.length > 0) {

      output.listing = result[0];
      const listing_id = result[0].id;

      // fetch categories
      const sqlListCat = `SELECT lc.listing_id, lc.listing_categories_id, c.title, c.image 
                          FROM ${this.tableListingCategories} lc
                          JOIN ${this.tableCategories} c ON lc.listing_categories_id = c.id  
                          WHERE lc.listing_id = ?`;
      output.categories = await query(sqlListCat, [listing_id]);

      
      // fetch products
      output.allproducts = [];
      if(output.listing.products){
        const prod_arr = JSON.parse(output.listing.products);
        const sqlListProd = `SELECT * FROM ${DBTables.products} 
                            WHERE id IN (${prod_arr.join()})`;
        output.allproducts = await query(sqlListProd);
      }
      


      // fetch contacts
      const sqlContact = `SELECT * FROM ${this.tableListingContact} WHERE listing_id=? LIMIT 1`;
      const contacts = await query(sqlContact, [listing_id]);
      if (contacts.length > 0) output.contacts = contacts[0];


      // fetch hours
      const sqlHour = `SELECT id, listing_id, day_of_week, is_open, TIME_FORMAT(first_hour_start,'%H:%i') as first_hour_start, TIME_FORMAT(first_hour_end,'%H:%i') as first_hour_end, 
                      TIME_FORMAT(second_hour_start,'%H:%i') as second_hour_start, TIME_FORMAT(second_hour_end,'%H:%i') as second_hour_end 
                      FROM ${this.tableListingHours} WHERE listing_id=?`;
      output.hours = await query(sqlHour, [listing_id]);

      // fetch menus
      const sqlmenus = `SELECT * FROM ${this.tableListingRestaurant} WHERE listing_id=?`;
      const menu = await query(sqlmenus, [listing_id]);
      const menu_ids = [];

      if (menu.length > 0) {
        for (const item of menu) {
          menu_ids.push(item.id);
        }
        const menu_ids_str = menu_ids.join(',');

        // fetch menu items
        const sqlitems = `SELECT * FROM ${this.tableListingRestaurantItems} WHERE listing_restaurant_id IN (?)`;
        const items = await query(sqlitems, [menu_ids_str]);

        if (items.length > 0) {
          for (const item of menu) {
            const restaurant_id = item.id;
            item.items = items.filter(it => it.listing_restaurant_id == restaurant_id);
          }
        }

      }

      output.menus = menu;

    }

    return output;

  }

  publishListing = async ({ id }) => {

    const sql = `UPDATE ${this.tableName} SET status = ? WHERE id = ?`;
    const result = await query(sql, ['publish', id]);

    if (result.affectedRows > 0) {
      return true;
    }
    else {
      return false;
    }

  }

  deleteListing = async (id) => {

    // delete review
    const sql = `DELETE FROM ${DBTables.listings} WHERE id IN (?)`;
    const result = await query(sql, [id]);

    return result;
  }

  // get current user favorites 
  getFavorites = async (user_id) => {
    const sql = `SELECT listing_id FROM ${DBTables.listing_favorites} WHERE user_id = ?`;
    const result = await query(sql, [user_id]);
    const favorites = result.map(l => l.listing_id);
    return favorites;
  }

  favoriteListings = async (params = {}, currentUser) => {

    const user_id = currentUser.id;
    const output = {}
    let values = [];

    let sql = '';

    sql = `SELECT l.* FROM ${this.tableName} AS l 
          JOIN ${DBTables.listing_favorites} lf ON lf.listing_id = l.id`;
    

    let queryParams = ` WHERE l.status = 'publish' AND lf.user_id = ?`;
    values.push(user_id);
    
    
    // set order by
    let queryOrderby = ` ORDER BY lf.id DESC`;

    // set limit 
    let queryLimit = '';
    if(params.limit && params.limit != '' && (params.offset == 0 || params.offset != '')){
      queryLimit = ` LIMIT ?, ?`;
      values.push(params.offset);
      values.push(params.limit);
    }
    else{
      queryLimit = ` LIMIT 0, 12`;
    }

    const count_sql = `${sql}${queryParams}${queryOrderby}`;
    sql += `${queryParams}${queryOrderby}${queryLimit}`;

    const listings = await query(sql, values);
    let total_listings = 0;

    if(listings.length > 0){

      const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
      const resultCount = await query(count_sql_final, [user_id]);
      
      total_listings = resultCount[0].count;

      const listing_ids = listings.map((l) => l['id']);
      
      // get contacts
      const sqlContacts = `SELECT * FROM ${DBTables.listing_contact} WHERE listing_id IN (${listing_ids.join()})`;
      const contacts = await query(sqlContacts);
      
      // get categories
      const sqlListCat = `SELECT lc.listing_id, lc.listing_categories_id, c.title, c.image 
                            FROM ${this.tableListingCategories} lc
                            JOIN ${this.tableCategories} c ON lc.listing_categories_id = c.id  
                            WHERE lc.listing_id IN (${listing_ids.join()})`;
      const categories = await query(sqlListCat);


      for (const item of listings) {
        item.contact = contacts.find((c) => c.listing_id == item.id);
        item.categories = categories.filter((c) => c.listing_id == item.id);
      }
    }
    output.status = 200;
    const data = {
      listings: listings,
      total_listings: total_listings
    }
    output.data = data;

    return output;
  }

  // get current user favorites 
  updateFavorite = async (listing_id, user_id) => {

    const data = {'listing_id': listing_id, 'user_id': user_id}
    const likeExist = await this.findOne(data, DBTables.listing_favorites);
    
    if (Object.keys(likeExist).length > 0) {

      // delete like
      const sql = `DELETE FROM ${DBTables.listing_favorites} WHERE id = ?`;
      await query(sql, [likeExist.id]);

      // update like count; first get the existing like count
      const sqlCount = `SELECT COUNT(*) AS no_of_favorite
        FROM ${DBTables.listing_favorites} WHERE listing_id = ?`;

      const data = await query(sqlCount, [listing_id]);

      // now update with final count
      const update_data = {
        'favorites': data[0].no_of_favorite
      }
      
      const basic_colset = multipleColumnSet(update_data, ',');
      
      const sql_update = `UPDATE ${DBTables.listings} SET ${basic_colset.columnSet} WHERE id = ?`;
      
      await query(sql_update, [...basic_colset.values, listing_id]);
      

    }
    else{
      // add like
      const sql = `INSERT INTO ${DBTables.listing_favorites} (listing_id, user_id) VALUES (?,?)`;
      const values = [listing_id, user_id];
      
      await query(sql, values);

      // update like count; first get the existing like count
      const sqlCount = `SELECT COUNT(*) AS no_of_favorite
        FROM ${DBTables.listing_favorites} WHERE listing_id = ?`;

      const data = await query(sqlCount, [listing_id]);

      // now update with final count
      const update_data = {
        'favorites': data[0].no_of_favorite
      }
      
      const basic_colset = multipleColumnSet(update_data, ',');
      
      const sql_update = `UPDATE ${DBTables.listings} SET ${basic_colset.columnSet} WHERE id = ?`;
      
      await query(sql_update, [...basic_colset.values, listing_id]);
    }
    
    return true;
    
  }

  // update view of a listing
  updateView =  async (id) => {
    const current_date = commonfn.dateTimeNow();

    // first get the current view
    const sql = `SELECT view FROM ${DBTables.listings} WHERE id = ? LIMIT 1`
    const result = await query(sql, [id]);
    const current_view = result[0].view;

    // update the view
    const updated_view = current_view + 1;
    const basic_info = {
      'view': updated_view,
      'updated_at': current_date
    }
    
    const basic_colset = multipleColumnSet(basic_info, ',');
    
    const sqlUPdate = `UPDATE ${DBTables.listings} SET ${basic_colset.columnSet} WHERE id = ?`;
    
    const resultUpdate = await query(sqlUPdate, [...basic_colset.values, id]);
    
  }

  newReview = async (params) => {

    const current_date = commonfn.dateTimeNow();

    const sql = `INSERT INTO ${this.tableReview} (listing_id, user_id, rating, title, description, created_at) VALUES (?,?,?,?,?,?)`;
    const values = [params.listing_id, params.user_id, params.rating, params.title, params.description, current_date];

    const result = await query(sql, values);

    if (result.insertId) {

      const resultUpdate = await this.updateListingReview(params.listing_id);

      if (resultUpdate.affectedRows == 1) {
        return true;
      }
    }

    return false;

  }

  editReview = async (params) => {

    const current_date = commonfn.dateTimeNow();

    const basic_info = {
      'rating': params.rating,
      'title': params.title,
      'description': params.description,
    }

    const basic_colset = multipleColumnSet(basic_info, ',');

    const sql = `UPDATE ${this.tableReview} SET ${basic_colset.columnSet} WHERE id = ?`;
    const result = await query(sql, [...basic_colset.values, params.id]);


    if (result.affectedRows == 1) {

      const resultUpdate = await this.updateListingReview(params.listing_id);

      if (resultUpdate.affectedRows == 1) {
        return true;
      }

    }

    return false;

  }

  // update review columns in listing table
  updateListingReview = async (listing_id) => {

    const sql = `SELECT COUNT(*) AS no_of_rating,
    AVG(rating) AS avg_rating 
    FROM ${this.tableReview} WHERE listing_id = ? AND parent_id IS NULL`;

    const update_review_data = await query(sql, [listing_id]);

    // update listing table - avg_rating and no_of_rating 
    const basic_info = {
      'no_of_rating': update_review_data[0].no_of_rating,
      'avg_rating': update_review_data[0].avg_rating
    }

    const basic_colset = multipleColumnSet(basic_info, ',');

    const sqlUpdate = `UPDATE ${this.tableName} SET ${basic_colset.columnSet} WHERE id = ?`;

    const resultUpdate = await query(sqlUpdate, [...basic_colset.values, listing_id]);

    return resultUpdate;
  }

  getReviews = async ({ id }) => {

    const sqlReview = `SELECT r.*, u.username, u.display_name, u.profile_photo, u.role 
                          FROM ${this.tableReview} r
                          JOIN ${this.tableUsers} u ON r.user_id = u.id  
                          WHERE r.listing_id = ? ORDER BY r.id DESC`;
    const review_list = await query(sqlReview, [id]);

    const likes_list = await this.find({ 'listing_id': id }, this.tableReviewLike);

    const reviews = [];

    for (const item of review_list) {
      if (!item.parent_id) {
        const comments = review_list.filter(review => review.parent_id == item.id);
        const likes = likes_list.filter(like => like.listing_review_id == item.id);

        // sort comment list - order by ID ASC
        comments.sort((a, b) => a['id'] - b['id']);

        item.comment_list = comments;
        item.like_list = likes;
        reviews.push(item);
      }
    }

    return reviews;
  }

  deleteReview = async (params) => {

    // delete review
    const sql = `DELETE FROM ${this.tableReview} WHERE id IN (?)`;
    const result = await query(sql, [params.id]);

    // delete comment
    const sqlComment = `DELETE FROM ${DBTables.listing_reviews} WHERE parent_id IN (?)`;
    await query(sqlComment, [params.id]);

    const resultUpdate = await this.updateListingReview(params.listing_id);

    return result;
  }

  updateReviewLike = async (params) => {

    const review_id = params.review_id;
    const user_id = params.user_id;

    const data = { 'listing_review_id': review_id, 'user_id': user_id }
    const likeExist = await this.findOne(data, this.tableReviewLike);

    if (Object.keys(likeExist).length > 0) {

      // delete like
      const sql = `DELETE FROM ${this.tableReviewLike} WHERE id = ?`;
      await query(sql, [likeExist.id]);

      // update like count; first get the existing like count
      const data = { 'id': review_id }
      const review = await this.findOne(data, this.tableReview);

      const updated_like_count = review.likes - 1;

      // now update with final count
      const update_data = {
        'likes': updated_like_count
      }

      const basic_colset = multipleColumnSet(update_data, ',');

      const sql_update = `UPDATE ${this.tableReview} SET ${basic_colset.columnSet} WHERE id = ?`;

      await query(sql_update, [...basic_colset.values, review_id]);


    }
    else {
      // add like
      const sql = `INSERT INTO ${this.tableReviewLike} (listing_review_id, listing_id, user_id) VALUES (?,?,?)`;
      const values = [review_id, params.listing_id, user_id];

      await query(sql, values);

      // update like count; first get the existing like count
      const data = { 'id': review_id }
      const review = await this.findOne(data, this.tableReview);

      const updated_like_count = review.likes + 1;

      // now update with final count
      const update_data = {
        'likes': updated_like_count
      }

      const basic_colset = multipleColumnSet(update_data, ',');

      const sql_update = `UPDATE ${this.tableReview} SET ${basic_colset.columnSet} WHERE id = ?`;

      await query(sql_update, [...basic_colset.values, review_id]);
    }

    const updated_reviews = this.getReviews({ 'id': params.listing_id });

    return updated_reviews;

  }

  addOrEditComment = async (params) => {

    const current_date = commonfn.dateTimeNow();

    if (params.comment_id != '') {
      // edit comment
      const basic_info = {
        'description': params.comment,
      }

      const basic_colset = multipleColumnSet(basic_info, ',');

      const sql = `UPDATE ${DBTables.listing_reviews} SET ${basic_colset.columnSet} WHERE id = ?`;

      const result = await query(sql, [...basic_colset.values, params.comment_id]);


      if (result.affectedRows == 1) {
        return true;
      }
    }
    else {
      // insert comment
      const sql = `INSERT INTO ${DBTables.listing_reviews} (listing_id, user_id, description, parent_id, created_at) VALUES (?,?,?,?,?)`;
      const values = [params.listing_id, params.user_id, params.comment, params.review_id, current_date];

      const result = await query(sql, values);

      if (result.insertId) {

        await this.updateCommentNumber(params.review_id);

        return true;
      }
    }

    return false;

  }

  updateCommentNumber = async (review_id) => {

    const sql = `SELECT COUNT(*) AS no_of_comment 
      FROM ${this.tableReview} WHERE parent_id = ?`;

    const data = await query(sql, [review_id]);

    // update listing table - avg_rating and no_of_rating 
    const basic_info = {
      'comments': data[0].no_of_comment
    }

    const basic_colset = multipleColumnSet(basic_info, ',');

    const sqlUpdate = `UPDATE ${this.tableReview} SET ${basic_colset.columnSet} WHERE id = ?`;

    const resultUpdate = await query(sqlUpdate, [...basic_colset.values, review_id]);

    return resultUpdate;

  }

  deleteComment = async (params) => {

    // delete comment
    const sql = `DELETE FROM ${this.tableReview} WHERE id IN (?)`;
    const result = await query(sql, [params.id]);

    // delete comment
    await this.updateCommentNumber(params.review_id);

    return result;
  }


  createListingCategory = async (params) => {
    let output = {};

    const sql = `INSERT INTO ${this.tableCategories} 
      (title, image) 
      VALUES (?,?)`;

    const result = await query(sql, [params.title, params.image]);

    if (result.insertId) {
      const listing_category_id = result.insertId;

      output.status = 200
      output.data = { 'listing_category_id': listing_category_id }
    }
    else {
      output.status = 401
    }

    return output;
  }

  updateListingCategory = async (categoryId, params) => {
    let sql = `UPDATE ${this.tableCategories} SET`;

    const paramArray = [];
    for (let param in params) {
      paramArray.push(` ${param} = ?`);
    }

    sql += paramArray.join(', ');

    sql += ` WHERE id = ?`;

    const values = [
      ...Object.values(params),
      categoryId
    ];

    const result = await query(sql, values);

    return result;
  }

  getListingCategories = async () => {
    let sql = `SELECT * FROM ${this.tableCategories}`;

    return await query(sql);
  }

  getTrendingCategories = async () => {
    let sql = `SELECT COUNT(lc.listing_id) as total_listing, lc.listing_categories_id, c.title, c.image
    FROM ${DBTables.listing_categories_listing} AS lc
    JOIN ${DBTables.listing_categories} AS c ON lc.listing_categories_id = c.id
    GROUP BY lc.listing_categories_id
    ORDER BY total_listing DESC LIMIT 4`;

    return await query(sql);
  }

  getListingCategory = async (categoryId) => {
    let sql = `SELECT * FROM ${this.tableCategories} WHERE id=?`;

    return await query(sql, [categoryId]);
  }

  deleteListingCategory = async (categoryId) => {
    const sql = `DELETE FROM ${this.tableCategories} WHERE id=?`;
    const values = [categoryId];

    return await query(sql, values);
  }

  newClaim = async (params, currentUser) => {

    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;

    const sql = `INSERT INTO ${DBTables.listing_claims} (listing_id, user_id, firstname, lastname, phone, email, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`;
    const values = [params.listing_id, user_id, params.firstname, params.lastname, params.phone, params.email, 'pending', current_date, current_date];

    const result = await query(sql, values);

    if (result.insertId) {
      return true;
    }

    return false;

  }

  getClaims = async (params) => {
    let sql = `SELECT c.*, l.title, u.username FROM ${DBTables.listing_claims} AS c
                JOIN ${DBTables.listings} AS l ON l.id =  c.listing_id 
                JOIN ${DBTables.users} AS u ON u.id =  c.user_id 
                WHERE 1=1`;
    let queryParams = '';
    let values = [];

    if(params.listing_id){
      queryParams += ` AND listing_id = ?`;
      values.push(params.listing_id);
    }
    if(params.status){
      queryParams += ` AND status = ?`;
      values.push(params.status);
    }

    sql += `${queryParams}`;

    return await query(sql, values);
  }


  approveClaim = async (id) => {
    const current_date = commonfn.dateTimeNow();

    // get listing claim details
    const claim = await this.findOne({id}, DBTables.listing_claims);

    // update listing_claims table
    const basic_info = {
      'status': 'approved',
      'updated_at': current_date
    }
    
    const basic_colset = multipleColumnSet(basic_info, ',');
    
    const sql = `UPDATE ${DBTables.listing_claims} SET ${basic_colset.columnSet} WHERE id = ?`;
    
    const result = await query(sql, [...basic_colset.values, id]);
    
    
    if (result.affectedRows == 1) {
      // update listing table 
      const basic_info = {
        'claimer_id': claim.user_id,
        'updated_at': current_date
      }
      
      const basic_colset = multipleColumnSet(basic_info, ',');
      
      const sql = `UPDATE ${DBTables.listings} SET ${basic_colset.columnSet} WHERE id = ?`;
      
      const result = await query(sql, [...basic_colset.values, claim.listing_id]);
      
      
      return result;
    }

    return false;
  }

  deleteClaim = async (id) => {
    const sql = `DELETE FROM ${DBTables.listing_claims} WHERE id IN (?)`;
    return await query(sql, [id]);
  }


}

module.exports = new ListingModel;
