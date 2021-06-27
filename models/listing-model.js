const {query, query2, query3} = require('../server');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');

class ListingModel {
  tableName = 'listings';
  tableListingHours = 'listing_business_hours';
  tableCategories = 'listing_categories';
  tableListingCategories = 'listing_categories_listing';
  tableListingContact = 'listing_contact';
  tableListingCoupon = 'listing_coupons';
  tableListingRestaurant = 'listing_restaurant';
  tableListingRestaurantItems = 'listing_restaurant_items';

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

  find = async (params = {}) => {
      let sql = `SELECT * FROM ${this.tableName}`;

      if (!Object.keys(params).length) {
          return await query(sql);
      }

      const { columnSet, values } = multipleColumnSet(params)
      sql += ` WHERE ${columnSet}`;

      return await query(sql, [...values]);
  }


  createListing = async (params, currentUser) => {

    
    
    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;
    const user_role = currentUser.role;
    let claimer_id = '';
    const output = {}

   

    if(user_role == 'candidate' || user_role == 'employer') claimer_id = user_id;
    // console.log(params.galleries);
    // return output;

    let slug = await commonfn.generateSlug(params.title, this.tableName);

    // process galleries data
    const galleries = [];
    if(params.galleries.length > 0){
      for (const item of params.galleries) {
        if(item.image != '') galleries.push(item.image);
      }
    }

    
    // insert data into listings table
    const sql = `INSERT INTO ${this.tableName}
    (user_id, claimer_id, title, slug, tagline, logo, 
      cover_img, description, address, lat, lng, 
      price_range, price_min, price_max, featured_img, galleries, 
      business_hour, video_urls, products, button_icon, button_link, 
      button_name, status, created_at, updated_at) 
      VALUES (?,?,?,?,?,?,
        ?,?,?,?,?,
        ?,?,?,?,?,
        ?,?,?,?,?,
        ?,?,?,?)`;
    const regResult = await query(sql, [user_id, claimer_id, params.title, slug, params.tagline, params.logo, 
      params.cover_img, params.description, params.address, params.lat, params.lng,
      params.price_range, params.price_min, params.price_max,  params.featured_img, JSON.stringify(galleries),
      params.business_hour, JSON.stringify(params.video_urls), JSON.stringify(params.products), params.button_icon, params.button_link, 
      params.button_name, 'draft', current_date, current_date]);

  
    if(regResult.insertId){
      
      const listing_id = regResult.insertId;

      // insert data to listing business hours table
      if(params.business_hour == 'open_for_selected_hours'){
        const sql_meta = `INSERT INTO ${this.tableListingHours} (listing_id, day_of_week, is_open, first_hour_start, first_hour_end, second_hour_start, second_hour_end) VALUES ?`;
        const valuesHours = [];

        // Monday business hour
        const mondayHour = params.businsessHourMonday;
        const tmpMonday = [listing_id, 'monday', mondayHour.is_open, mondayHour.times[0].open, mondayHour.times[0].closes];
        if(mondayHour.times.length > 1){
          tmpMonday.push(mondayHour.times[1].open);
          tmpMonday.push(mondayHour.times[1].closes);
        }
        else{
          tmpMonday.push(null);
          tmpMonday.push(null);
        }
        valuesHours.push(tmpMonday);

        // Tuesday business hour
        const tuesdayHour = params.businsessHourTuesday;
        const tmpTuesday = [listing_id, 'tuesday', tuesdayHour.is_open, tuesdayHour.times[0].open, tuesdayHour.times[0].closes];
        if(tuesdayHour.times.length > 1){
          tmpTuesday.push(tuesdayHour.times[1].open);
          tmpTuesday.push(tuesdayHour.times[1].closes);
        }
        else{
          tmpTuesday.push(null);
          tmpTuesday.push(null);
        }
        valuesHours.push(tmpTuesday);

        // Wednesday business hour
        const wednesdayHour = params.businsessHourWednesday;
        const tmpWednesday = [listing_id, 'wednesday', wednesdayHour.is_open, wednesdayHour.times[0].open, wednesdayHour.times[0].closes];
        if(wednesdayHour.times.length > 1){
          tmpWednesday.push(wednesdayHour.times[1].open);
          tmpWednesday.push(wednesdayHour.times[1].closes);
        }
        else{
          tmpWednesday.push(null);
          tmpWednesday.push(null);
        }
        valuesHours.push(tmpWednesday);

        // Thursday business hour
        const thursdayHour = params.businsessHourThursday;
        const tmpThursday = [listing_id, 'thursday', thursdayHour.is_open, thursdayHour.times[0].open, thursdayHour.times[0].closes];
        if(thursdayHour.times.length > 1){
          tmpThursday.push(thursdayHour.times[1].open);
          tmpThursday.push(thursdayHour.times[1].closes);
        }
        else{
          tmpThursday.push(null);
          tmpThursday.push(null);
        }
        valuesHours.push(tmpThursday);

        // Friday business hour
        const fridayHour = params.businsessHourFriday;
        const tmpFriday = [listing_id, 'friday', fridayHour.is_open, fridayHour.times[0].open, fridayHour.times[0].closes];
        if(fridayHour.times.length > 1){
          tmpFriday.push(fridayHour.times[1].open);
          tmpFriday.push(fridayHour.times[1].closes);
        }
        else{
          tmpFriday.push(null);
          tmpFriday.push(null);
        }
        valuesHours.push(tmpFriday);

        // Saturday business hour
        const saturdayHour = params.businsessHourSaturday;
        const tmpSaturday = [listing_id, 'saturday', saturdayHour.is_open, saturdayHour.times[0].open, saturdayHour.times[0].closes];
        if(saturdayHour.times.length > 1){
          tmpSaturday.push(saturdayHour.times[1].open);
          tmpSaturday.push(saturdayHour.times[1].closes);
        }
        else{
          tmpSaturday.push(null);
          tmpSaturday.push(null);
        }
        valuesHours.push(tmpSaturday);

        // Sunday business hour
        const sundayHour = params.businsessHourSunday;
        const tmpSunday = [listing_id, 'sunday', sundayHour.is_open, sundayHour.times[0].open, sundayHour.times[0].closes];
        if(sundayHour.times.length > 1){
          tmpSunday.push(sundayHour.times[1].open);
          tmpSunday.push(sundayHour.times[1].closes);
        }
        else{
          tmpSunday.push(null);
          tmpSunday.push(null);
        }
        valuesHours.push(tmpSunday);
        
        const resultListingHours = await query2(sql_meta, [valuesHours]);

      }
     
      // insert data to listing categories table
      if(params.categories.length > 0){
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
      const values = [listing_id, params.email, params.phone, params.website, params.facebook, params.twitter, params.linkedin, params.tiktok];

      const resultListingContact = await query(sql_meta, values);

     
      // insert coupon
      if(params.coupon_title != '' && params.coupon_code != '' && params.coupon_expiry_date != ''){
        const sql_meta = `INSERT INTO ${this.tableListingCoupon} (listing_id, title, description, image, coupon_code, popup_desc, link, expiry_date, created_at) VALUES (?,?,?,?,?,?,?,?,?)`;
        const values = [listing_id, params.coupon_title, params.coupon_description, params.coupon_image, params.coupon_code, params.coupon_popup_desc, params.coupon_link, params.coupon_expiry_date, current_date];

        const resultListingCoupon = await query(sql_meta, values);

      }

      
      // insert restaurants
      if(params.restaurants.length > 0){
        
        for (let restaurant of params.restaurants) {
          const sql_res = `INSERT INTO ${this.tableListingRestaurant} (listing_id, title, description, icon) VALUES (?,?,?,?)`;
          const valuesRes = [listing_id, restaurant.title, restaurant.description, restaurant.icon];

          const resultRestaurant = await query(sql_res, valuesRes);
          
          if(resultRestaurant.insertId && restaurant.items.length > 0){
            
            const listing_res_id = resultRestaurant.insertId;
            
            const sql_item = `INSERT INTO ${this.tableListingRestaurantItems} (listing_restaurant_id, title, description, image, price, link, open_new_window) VALUES ?`;
            const valuesItem = [];
            
            for (let item of restaurant.items) {
              const tmp = [listing_res_id, item.title, item.description, item.image, item.price, item.link, item.is_new_window];
              valuesItem.push(tmp);
            }
            
            const resultRestaurantItem = await query2(sql_item, [valuesItem]);
          }

        }

      }

      output.status = 200
      output.data = {'listing_id': listing_id, 'slug': slug}
    }
    else{
      output.status = 401
    }

    return output;
  }

  searchListing = async (params = {}) => {

    const keyword = params.keyword;
    const input_lat = params.lat;
    const input_lng = params.lng;

    const output = {}

    let sql = `SELECT ${this.tableName}.*, ( 6371 * acos( cos( radians('${input_lat}') ) * cos( radians( ${this.tableName}.lat ) ) * cos( radians( ${this.tableName}.lng ) - radians('${input_lng}') ) + sin( radians('${input_lat}') ) * sin( radians( ${this.tableName}.lat ) ) ) ) as listing_distance FROM ${this.tableName}  WHERE ${this.tableName}.status = 'publish'`;

    let condition = ``;

    if(keyword != ''){
      condition += ` AND ( ${this.tableName}.title LIKE '%${keyword}%' OR ${this.tableName}.description LIKE '%${keyword}%' )`;
    }
 
    sql += ` ${condition} HAVING listing_distance < 10 ORDER BY listing_distance LIMIT 0, 12`

    const result = await query3(sql);
    if(result.length > 0){
      output.status = 200;
      output.data = result;
    }
    else{
      output.status = 401
    }

    return output;
  }


  getListing = async ({slug}) => {
    const output = {};
    
    const sql = `SELECT * FROM ${this.tableName} WHERE slug=? LIMIT 1`;

    const result  = await query(sql, [slug]);
    
    if(result.length > 0){
      
      output.listing = result[0];
      const listing_id = result[0].id;
      
      // fetch categories
      const sqlListCat = `SELECT lc.listing_id, lc.listing_categories_id, c.title, c.image 
                          FROM ${this.tableListingCategories} lc
                          JOIN ${this.tableCategories} c ON lc.listing_categories_id = c.id  
                          WHERE lc.listing_id = ?`;
      output.categories = await query(sqlListCat, [listing_id]);


      // fetch contacts
      const sqlContact = `SELECT * FROM ${this.tableListingContact} WHERE listing_id=? LIMIT 1`;
      output.contacts = await query(sqlContact, [listing_id]);

      // fetch coupon
      const sqlCoupon = `SELECT * FROM ${this.tableListingCoupon} WHERE listing_id=? LIMIT 1`;
      output.coupon = await query(sqlCoupon, [listing_id]);

      // fetch hours
      const sqlHour = `SELECT * FROM ${this.tableListingHours} WHERE listing_id=?`;
      output.hours = await query(sqlHour, [listing_id]);

      // fetch menus
      const sqlmenus = `SELECT * FROM ${this.tableListingRestaurant} WHERE listing_id=?`;
      const menu = output.menus = await query(sqlmenus, [listing_id]);
      const menu_ids = [];

      if(menu.length > 0){
        for (const item of menu) {
          menu_ids.push(item.id);
        }
        const menu_ids_str = menu_ids.join(',');
        
        // fetch menu items
        const sqlitems = `SELECT * FROM ${this.tableListingRestaurantItems} WHERE listing_restaurant_id IN (${menu_ids_str})`;
        output.items = await query3(sqlitems);
        
      }
      

      

    }

    return output;

  }

  publishListing = async ({id}) => {

    const listing = await this.findOne({id});

    if(listing){
      const sql = `UPDATE ${this.tableName} SET status = ? WHERE id = ?`;
      const result = await query(sql, ['publish', id,]);
      
      return result;
    }
    else{
      return false;
    }
    
  }


}

module.exports = new ListingModel;




