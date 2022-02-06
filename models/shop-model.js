const { query, query2, query3 } = require('../server');
const AppError = require('../utils/appError');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');
const { DBTables } = require('../utils/common');

class ShopModel {
  tableName = 'products';
  tableNameReviews = 'product_reviews';
  tableNameShopDetails = 'store_details';
  tableNameCartItems = 'store_cart_items';

  tableOrders = 'orders';
  tableOrderItems = 'order_items';
  tableOrderShipments = 'order_shipments';
  tableOrderPromoCodes = 'order_promo_codes';

  tableWithdrawRequests = 'withdraw_requests';

  tableNameUsers = 'users';
  tableCountries = 'countries';

  earnPercent = 95;

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
      if (orderby != '') sql += ` ${orderby}`;

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


  newProduct = async (params, currentUser) => {

    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;
    const user_role = currentUser.role;
    const output = {}

    let slug = await commonfn.generateSlug(params.title, this.tableName);

    // insert into product table 
    const sql = `INSERT INTO ${DBTables.products} (user_id, title, slug, price, discounted_price, 
                  discount_start, discount_end, image, galleries, 
                  short_desc, description, sku, stock_status, purchase_note, 
                  is_downloadable, is_virtual, created_at, updated_at) VALUES 
                  (?,?,?,?,?,
                    ?,?,?,?,
                    ?,?,?,?,?,
                    ?,?,?,?)`;
    const values = [
      user_id, params.title, slug, params.price, params.discounted_price, 
      params.discount_start ? commonfn.dateTime(new Date(params.discount_start)) : null, 
      params.discount_end ? commonfn.dateTime(new Date(params.discount_end)) : null,
      params.image, JSON.stringify(params.galleries), params.short_desc, 
      params.description, params.sku, params.stock_status, params.purchase_note, params.is_downloadable, params.is_virtual,
      current_date, current_date
    ];

    const result_product = await query(sql, values);

    if (result_product.insertId) {

      const product_id = result_product.insertId;

      // insert meta data
      const sql_meta = `INSERT INTO ${DBTables.products_meta} (product_id, meta_key, meta_value) VALUES ?`;
      const values = [];

      // insert download meta data
      if (params.is_downloadable) {
        values.push([product_id, 'download_files', JSON.stringify(params.download_files)]);
      }
      else {
        values.push([product_id, 'download_files', '']);
      }

      const resultProdMeta = await query2(sql_meta, [values]);

      // insert product categories 
      if (params.categories && params.categories.length > 0) {
        const sql_cats = `INSERT INTO ${DBTables.product_category_relationships} (product_id, category_id) VALUES ?`;
        const values = [];

        for (let category_id of params.categories) {
          const tmp = [product_id, category_id];
          values.push(tmp);
        }

        await query2(sql_cats, [values]);
      }

      // insert product tags 
      if (params.tags && params.tags.length > 0) {
        const sql_tags = `INSERT INTO ${DBTables.product_tag_relationships} (product_id, tag_id) VALUES ?`;
        const values = [];

        for (let x of params.tags) {
          const tmp = [product_id, x];
          values.push(tmp);
        }

        const resultProdTags = await query2(sql_tags, [values]);

      }

      // insert product options 
      if (params.options && params.options.length > 0) {
        const sql_options = `INSERT INTO ${DBTables.product_option_relationships} (product_id, option_id, choice_id) VALUES ?`;
        const values = [];

        for (let option of params.options) {
          for (const choice of option.choices) {
            const value = [product_id, option.option_id, choice];
            values.push(value);
          }
        }

        await query2(sql_options, [values]);

      }

      return true;
    }
    return false;
  }

  editProduct = async (params, currentUser) => {

    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;

    // update product table 
    const basic_info = {
      'title': params.title,
      'price': params.price,
      'discounted_price': params.discounted_price,
      'discount_start': params.discount_start ? commonfn.dateTime(new Date(params.discount_start)) : null,
      'discount_end': params.discount_end ? commonfn.dateTime(new Date(params.discount_end)) : null,
      'image': params.image,
      'galleries': JSON.stringify(params.galleries),
      'short_desc': params.short_desc,
      'description': params.description,
      'sku': params.sku,
      'stock_status': params.stock_status,
      'purchase_note': params.purchase_note,
      'is_downloadable': params.is_downloadable,
      'is_virtual': params.is_virtual,
      'updated_at': current_date
    }

    const basic_colset = multipleColumnSet(basic_info, ',');

    const sql = `UPDATE ${DBTables.products} SET ${basic_colset.columnSet} WHERE id = ?`;

    const result = await query(sql, [...basic_colset.values, params.id]);


    if (result.affectedRows == 1) {
      const product_id = params.id;

      // update meta table
      const sqlMeta = `INSERT INTO ${DBTables.products_meta} (product_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY UPDATE meta_value=VALUES(meta_value)`;
      const values = [];

      if (params.is_downloadable) {
        values.push([product_id, 'download_files', JSON.stringify(params.download_files)]);
      }
      else {
        values.push([product_id, 'download_files', '']);
      }

      await query2(sqlMeta, [values]);


      // update product tags 
      // first delete the existing tags 
      const sql = `DELETE FROM ${DBTables.product_tag_relationships} WHERE product_id IN (?)`;
      await query(sql, [product_id]);

      // insert product tags 
      if (params.tags && params.tags.length > 0) {
        const sql_tags = `INSERT INTO ${DBTables.product_tag_relationships} (product_id, tag_id) VALUES ?`;
        const values = [];

        for (let x of params.tags) {
          const tmp = [product_id, x];
          values.push(tmp);
        }

        const resultProdTags = await query2(sql_tags, [values]);

      }

      // update product categories
      const cat_ids = encodeURI(params.categories.join(','));
      const cat_remove_sql = `DELETE FROM ${DBTables.product_category_relationships} 
        WHERE product_id=${product_id} AND category_id NOT IN (${cat_ids})`;

      await query(cat_remove_sql);

      if (params.categories && params.categories.length > 0) {
        const cat_sql = `INSERT INTO ${DBTables.product_category_relationships} 
          (product_id, category_id) 
          VALUES ? ON DUPLICATE KEY UPDATE id=id`;

        const cat_values = params.categories.map(cat => ([product_id, cat]));
        await query2(cat_sql, [cat_values]);
      }

      // update product options
      // first delete the existing options 
      const option_remove_sql = `DELETE FROM ${DBTables.product_option_relationships} WHERE product_id IN (?)`;
      await query(option_remove_sql, [product_id]);

      // insert product options 
      if (params.options && params.options.length > 0) {
        const sql_options = `INSERT INTO ${DBTables.product_option_relationships} (product_id, option_id, choice_id) VALUES ?`;
        const values = [];

        for (let option of params.options) {
          for (const choice of option.choices) {
            const value = [product_id, option.option_id, choice];
            values.push(value);
          }
        }

        await query2(sql_options, [values]);

      }

      return true;
    }

    return false;
  }

  deleteProduct = async (id) => {
    const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
    const values = [id];

    return await query(sql, values);
  }

  getProduct = async (slug) => {
    let sql = `SELECT p.*, store.store_name as store_name, 
      users.username as user_username, users.display_name as user_display_name
      FROM ${DBTables.products} as p
      LEFT JOIN ${DBTables.store_details} as store ON store.user_id=p.user_id
      LEFT JOIN ${DBTables.users} as users ON users.id=p.user_id
      WHERE p.slug=?`;

    const result = await query(sql, [slug]);
    const product = result[0] ? result[0] : {};

    if (Object.keys(product) === 0) {
      return product;
    }

    const product_id = product.id;

    product.galleries = JSON.parse(product.galleries);

    // process meta data
    const metaData = await this.find({ 'product_id': product_id }, DBTables.products_meta);

    for (const item of metaData) {
      if (item.meta_key == 'download_files' && item.meta_value != '') {
        product.download_files = JSON.parse(item.meta_value);
      }
    }

    // process tags data
    const sqlTags = `SELECT t.title, tr.tag_id
                          FROM ${DBTables.product_tag_relationships} tr
                          JOIN ${DBTables.product_tags} t ON t.id = tr.tag_id  
                          WHERE tr.product_id = ?`;
    const tagData = await query(sqlTags, [product_id]);
    const tags = [];
    for (const item of tagData) {
      tags.push(item);
    }
    product.tags = tags;

    // process categories data
    const sqlCats = `SELECT pc.*
      FROM ${DBTables.product_category_relationships} pcr
      JOIN ${DBTables.product_categories} pc ON pc.id = pcr.category_id  
      WHERE pcr.product_id = ?`;

    const catData = await query(sqlCats, [product_id]);
    const categories = [];

    for (const item of catData) {
      categories.push(item);
    }

    product.categories = categories;

    // process options data
    const sqlOptions = `SELECT po.*, poc.id as choice_id, poc.title as choice
      FROM ${DBTables.product_option_relationships} por
      LEFT JOIN ${DBTables.product_options} po ON po.id = por.option_id  
      LEFT JOIN ${DBTables.product_option_choices} poc ON poc.id = por.choice_id  
      WHERE por.product_id = ?`;

    const optionData = await query(sqlOptions, [product_id]);

    const options = {};

    for (const option of optionData) {
      if (!options[option.id]) {
        options[option.id] = { id: option.id, title: option.title, choices: [] };
      }

      options[option.id].choices.push({ id: option.choice_id, title: option.choice });
    }

    product.options = Object.values(options);

    this.updateProductViewCount(product);

    return product;
  }

  updateProductViewCount = async (product) => {
    const sql = `UPDATE ${DBTables.products} SET views=${product.views + 1} WHERE id=${product.id}`;

    return await query(sql);
  }

  getProducts = async (params) => {
    let sql = `SELECT DISTINCT p.*, store.store_name as store_name, 
      users.username as user_username, users.display_name as user_display_name
      FROM ${DBTables.products} as p
      LEFT JOIN ${DBTables.store_details} as store ON store.user_id=p.user_id
      LEFT JOIN ${DBTables.users} as users ON users.id=p.user_id`;

    let queryParams = ` WHERE p.status = 'publish'`;

    let values = [];

    // set params
    if (params.params) {
      const p = params.params;

      if (p.keyword && p.keyword != '') {
        // TODO: do javascript validation
        queryParams += ` AND ( p.title LIKE '%${encodeURI(p.keyword)}%' OR p.description LIKE '%${encodeURI(p.keyword)}%' )`;
      }

      if (p.category && p.category != '') {
        // TODO: do javascript validation
        sql += ` LEFT JOIN ${DBTables.product_category_relationships} as pcr ON pcr.product_id=p.id`
        queryParams += ` AND pcr.category_id = ?`;
        values.push(p.category);
      }

      if (p.price_min) {
        queryParams += ` AND (p.price >= ? OR 
          (p.discounted_price >= ? AND 
            ((p.discount_start <= UTC_TIMESTAMP() AND p.discount_end >= UTC_TIMESTAMP()) 
              OR p.discount_start IS NULL OR p.discount_end IS NULL
            )
          )
        )`;

        values.push(p.price_min);
        values.push(p.price_min);
      }

      if (p.price_max) {
        queryParams += ` AND (p.price <= ? OR 
          (p.discounted_price <= ? AND 
            ((p.discount_start <= UTC_TIMESTAMP() AND p.discount_end >= UTC_TIMESTAMP())
              OR p.discount_start IS NULL OR p.discount_end IS NULL
            )
          )
        )`;

        values.push(p.price_max);
        values.push(p.price_max);
      }

      if (p.rating) {
        queryParams += ` AND p.rating_average >= ?`;
        values.push(p.rating);
      }

      if (p.choices && p.choices.length) {
        sql += ` LEFT JOIN ${DBTables.product_option_relationships} as por ON por.product_id=p.id`

        const choiceParams = p.choices.map((choice) => `por.choice_id=?`);

        queryParams += ` AND (${choiceParams.join(' OR ')})`;
        values.push(...p.choices);
      }

      if (p.brands && p.brands.length) {
        const ids = encodeURI(p.brands.join(','));

        queryParams += ` AND p.user_id IN (${ids})`;
      }

      if (p.tag && p.tag != '') {
        const tagSql = `
          SELECT DISTINCT product_id
          FROM ${DBTables.product_tag_relationships}
          WHERE tag_id = ?
        `;

        const product_ids = await query(tagSql, [encodeURI(p.tag)]);

        let ids = product_ids.map((product_id) => product_id.product_id);
        if (ids.length) {
          ids = ids.join(',');
        } else {
          ids = 0;
        }

        queryParams += ` AND p.id IN (${ids})`;
      }

      if (p.user_id && p.user_id != '') {
        // TODO: do javascript validation
        queryParams += ` AND p.user_id = ${p.user_id}`;
      }

      if (p.ids) {
        const ids = encodeURI(p.ids.join(','));

        queryParams += ` AND p.id IN (${ids})`;
      }
    }

    // set order by
    let queryOrderby = '';
    if (params.orderby && params.orderby != '') {
      const orderBy = encodeURI(params.orderby);
      queryOrderby = ` ORDER BY ${orderBy}`;

      if (params.order && params.order != '') {
        // TODO: do javascript validation
        const order = encodeURI(params.order);
        queryOrderby += ` ${order}`;
      }
    }

    // set limit 
    let queryLimit = '';
    if (params.limit && params.limit != '' && (params.offset == 0 || params.offset != '')) {
      queryLimit = ` LIMIT ?, ?`;
      values.push(params.offset);
      values.push(params.limit);
    }

    sql += `${queryParams}${queryOrderby}${queryLimit}`;

    return await query(sql, values);
  }

  getRelatedProducts = async (slug) => {
    const sqlTags = `SELECT tr.tag_id
      FROM ${DBTables.product_tag_relationships} tr
      LEFT JOIN ${DBTables.products} as p ON p.id = tr.product_id 
      WHERE p.slug = ?`;

    const tagData = await query(sqlTags, [slug]);
    const tagIds = tagData.map(tag => tag.tag_id);

    const sqlCats = `SELECT pcr.category_id
      FROM ${DBTables.product_category_relationships} pcr
      LEFT JOIN ${DBTables.products} as p ON p.id = pcr.product_id 
      WHERE p.slug = ?`;

    const catData = await query(sqlCats, [slug]);
    const catIds = catData.map(cat => cat.category_id);

    let catRelatedRows = [];
    if (catIds.length) {

      let catRelatedSql = `SELECT DISTINCT p.*, store.store_name as store_name, 
        users.username as user_username, users.display_name as user_display_name
        FROM ${DBTables.product_category_relationships} as pcr 
        LEFT JOIN ${DBTables.products} as p ON pcr.product_id = p.id
        LEFT JOIN ${DBTables.store_details} as store ON store.user_id=p.user_id
        LEFT JOIN ${DBTables.users} as users ON users.id=p.user_id`;

      let catRelatedQueryParams = ` WHERE p.slug != ? AND pcr.category_id IN (${catIds.join(',')})`;

      // set limit 
      let catRelatedQueryLimit = ` LIMIT 4`;

      catRelatedSql += `${catRelatedQueryParams}${catRelatedQueryLimit}`;

      catRelatedRows = await query(catRelatedSql, [slug]);
    }

    let tagRelatedRows = [];
    if (tagIds.length) {
      let tagRelatedSql = `SELECT DISTINCT p.*, store.store_name as store_name, 
        users.username as user_username, users.display_name as user_display_name
        FROM ${DBTables.product_tag_relationships} as ptr 
        LEFT JOIN ${DBTables.products} as p ON ptr.product_id = p.id
        LEFT JOIN ${DBTables.store_details} as store ON store.user_id=p.user_id
        LEFT JOIN ${DBTables.users} as users ON users.id=p.user_id`;

      let tagRelatedQueryParams = ` WHERE p.slug != ? AND ptr.tag_id IN (${tagIds.join(',')})`;

      // set limit 
      let tagRelatedQueryLimit = ` LIMIT 4`;

      tagRelatedSql += `${tagRelatedQueryParams}${tagRelatedQueryLimit}`;

      tagRelatedRows = await query(tagRelatedSql, [slug]);
    }

    const mergedProducts = [...catRelatedRows, ...tagRelatedRows];
    mergedProducts.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return mergedProducts.slice(0, 4);
  }

  getProductReviews = async (id) => {
    let sql = `SELECT Reviews.*, Users.display_name as user_display_name,
    Users.username as user_username, Users.profile_photo as user_profile_photo  
    FROM ${this.tableNameReviews} as Reviews 
    LEFT JOIN ${this.tableNameUsers} as Users ON Users.id=Reviews.user_id  
    WHERE Reviews.product_id=?
    ORDER BY created_at ASC`;

    return await query(sql, [id]);
  }

  createProductReview = async (product_id, params, currentUser) => {
    const user_id = currentUser.id;
    let output = {};

    const sql = `INSERT INTO ${this.tableNameReviews} 
      (
        user_id, 
        product_id, 
        rating, 
        review
      ) 
      VALUES (?,?,?,?)`;

    const values = [
      user_id,
      product_id,
      params.rating,
      params.review
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200;

      await this.updateReviewCount(product_id);
    }
    else {
      output.status = 401;
    }

    return output;
  }

  updateReviewCount = async (product_id) => {
    let sql = `UPDATE ${this.tableName} 
        SET rating_average = (
          SELECT avg(rating) FROM ${this.tableNameReviews} WHERE product_id = ?
        ), rating_total = (
          SELECT count(*) FROM ${this.tableNameReviews} WHERE product_id = ?
        ) 
        WHERE id = ?`;

    const result = await query(sql, [product_id, product_id, product_id]);

    return result;
  }

  getShopDetails = async (id) => {
    let sql = `SELECT Details.* 
    FROM ${this.tableNameShopDetails} as Details  
    WHERE Details.user_id=?`;

    return await query(sql, [id]);
  }

  updateShopDetails = async (params, currentUser) => {
    const current_date = commonfn.dateTimeNow();
    const sql = `INSERT INTO ${this.tableNameShopDetails} 
      (user_id, store_name, product_per_page, phone, address, latitude, longitude, show_email, show_more_products, profile_picture, banner, created_at, updated_at) 
      VALUES ? ON DUPLICATE KEY 
      UPDATE store_name=VALUES(store_name),
        product_per_page=VALUES(product_per_page),
        phone=VALUES(phone),
        address=VALUES(address),
        latitude=VALUES(latitude),
        longitude=VALUES(longitude),
        show_email=VALUES(show_email),
        show_more_products=VALUES(show_more_products),
        profile_picture=VALUES(profile_picture),
        banner=VALUES(banner),
        updated_at='${current_date}'
      `;

    const values = [];
    values.push(currentUser.id);

    let availableKeys = ['store_name', 'product_per_page', 'phone', 'address', 'latitude', 'longitude', 'show_email', 'show_more_products', 'profile_picture', 'banner'];

    for (const key of availableKeys) {
      let value = params[key];

      if (key === 'show_email' || key === 'show_more_products') {
        value = value || 0;
      }

      values.push(value);
    }

    values.push(current_date);
    values.push(current_date);

    if (values.length) {
      return await query2(sql, [[values]]);
    }
  }

  getCartItems = async (user_id) => {
    let sql = `SELECT Cart.*, 
    Product.title as product_title, Product.slug as product_slug, Product.price as product_price, Product.image as product_image,
    Product.discounted_price as product_discounted_price, Product.discount_start as product_discount_start, 
    Product.discount_end as product_discount_end, Product.user_id as vendor_id,
    Users.username as vendor_username, Users.display_name as vendor_display_name 
    FROM ${this.tableNameCartItems} as Cart  
    LEFT JOIN ${this.tableName} as Product ON Product.id=Cart.product_id
    LEFT JOIN ${DBTables.users} as Users ON Users.id=Product.user_id
    WHERE Cart.user_id=?`;

    return await query(sql, [user_id]);
  }

  updateCartItems = async (items, currentUser) => {
    const current_date = commonfn.dateTimeNow();
    const sql = `INSERT INTO ${this.tableNameCartItems} 
      (user_id, product_id, quantity, created_at, updated_at) 
      VALUES ? ON DUPLICATE KEY 
      UPDATE quantity=VALUES(quantity),
        updated_at='${current_date}'
      `;

    const values = [];

    let availableKeys = ['product_id', 'quantity'];

    for (const item of items) {
      let itemValues = [];
      itemValues.push(currentUser.id);

      for (const key of availableKeys) {
        if (item[key] == null) {
          throw new AppError(403, `${key} is required`);
        }

        itemValues.push(item[key]);
      }

      itemValues.push(current_date);
      itemValues.push(current_date);

      values.push(itemValues);
    }

    if (values.length) {
      return await query2(sql, [values]);
    }
  }

  deleteCartItem = async (item_id) => {
    const sql = `DELETE FROM ${this.tableNameCartItems} WHERE id=?`;
    const values = [item_id];

    await query(sql, values);
  }

  clearCartItems = async (user_id) => {
    const sql = `DELETE FROM ${this.tableNameCartItems} WHERE user_id=?`;
    const values = [user_id];

    await query(sql, values);
  }


  getOrders = async (params = {}, page = 1, limit = -1) => {
    let sql = `SELECT Orders.*, 
      Promo.code as promo_code, Promo.discount as discount,
      Shipping.title as shipping_title, Shipping.fee as shipping_fee
      FROM ${this.tableOrders} as Orders 
      LEFT JOIN ${this.tableOrderPromoCodes} as Promo ON Promo.id=Orders.promo_id
      LEFT JOIN ${DBTables.product_shippings} as Shipping ON Shipping.id=Orders.shipping_id
      `;

    const paramArray = [];
    const values = [];

    for (let param in params) {
      paramArray.push(`Orders.${param}=?`);
      values.push(params[param])
    }

    if (paramArray.length) {
      sql += ` WHERE ${paramArray.join(' AND ')}`;
    }

    if (limit > 0) {
      sql += ` LIMIT ${limit} OFFSET ${limit * (page - 1)}`;
    }

    return await query(sql, values);
  }

  getOrder = async (params = {}) => {
    let sql = `SELECT Orders.*, 
      Promo.code as promo_code, Promo.discount as discount,
      Shipping.title as shipping_title, Shipping.fee as shipping_fee
      FROM ${this.tableOrders} as Orders
      LEFT JOIN ${this.tableOrderPromoCodes} as Promo ON Promo.id=Orders.promo_id
      LEFT JOIN ${DBTables.product_shippings} as Shipping ON Shipping.id=Orders.shipping_id
      `;

    let orCondition = '';
    if (params['Orders.user_id'] && params['Orders.vendor_id']) {
      orCondition = ` (Orders.user_id = ${params['Orders.user_id']} OR Orders.vendor_id = ${params['Orders.vendor_id']})`;

      delete params['Orders.user_id'];
      delete params['Orders.vendor_id'];
    }

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

    if (orCondition) {
      sql += ` AND ${orCondition}`
    }

    const result = await query(sql, [...values]);

    if (result.length > 0) {
      const orderItems = await this.getOrderItems(result[0].id);

      if (orderItems.length) {
        result[0].items = await this.getOrderItems(result[0].id);
      }

      result[0].shipment = await this.getOrderShipment(result[0].id);
    }

    return result;
  }

  getOrderItems = async (order_id) => {
    let sql = `SELECT OrderItems.*,
      Product.title as product_title, Product.slug as product_slug, OrderItems.price as product_price, Product.image as product_image 
      FROM ${this.tableOrderItems} as OrderItems
      LEFT JOIN ${this.tableName} as Product ON Product.id=OrderItems.product_id
      WHERE order_id=?
      `;

    return await query(sql, [order_id]);
  }

  getOrderShipment = async (order_id) => {
    let sql = `SELECT first_name, last_name, company_name, Countries.title as country, address, city, state, postcode, phone, email
      FROM ${this.tableOrderShipments}
      LEFT JOIN ${this.tableCountries} as Countries ON Countries.id=country_id
      WHERE order_id=?
      `;

    return await query(sql, [order_id]);
  }

  createOrder = async (orders, currentUser) => {
    if (orders.length > 1) {
      const parentOrder = await this.insertOrder(orders[0], currentUser);

      if (parentOrder.status !== 401) {
        for (let i = 1; i < orders.length; i++) {
          await this.insertOrder(orders[i], currentUser, parentOrder.data.order_id);
        }
      }

      return parentOrder;
    } else {
      return await this.insertOrder(orders[0], currentUser);
    }
  }

  insertOrder = async (order, currentUser, parent_id = -1) => {
    const current_date = commonfn.dateTimeNow();
    let output = {};

    const sql = `INSERT INTO ${this.tableOrders} 
        (parent_id, user_id, vendor_id, subtotal, total, earned, promo_id, shipping_id, additional_info, created_at, updated_at) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
      parent_id,
      currentUser.id,
      order.vendor_id,
      order.subtotal,
      order.total,
      order.total * 0.95,
      order.promo_id,
      order.shipping_method,
      order.additional_info,
      current_date,
      current_date
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      const order_id = result.insertId;

      output.status = 200
      output.data = { order_id }

      const orderItemsSql = `INSERT INTO ${this.tableOrderItems} 
        (order_id, product_id, quantity, price, total, earned, created_at) 
        VALUES ?`;

      const items = [];

      for (const item of order.items) {
        const total = item.quantity * item.price;
        const earned = total * 0.95;

        items.push([order_id, item.product_id, item.quantity, item.price, total, earned, current_date]);
      }

      if (items.length > 0) {
        await query2(orderItemsSql, [items]);
      }

      const orderShippingSql = `INSERT INTO ${this.tableOrderShipments} 
        (order_id, first_name, last_name, company_name, country_id, address, city, state, postcode, phone, email) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

      const shippingValues = [
        order_id,
        order.shipping.first_name,
        order.shipping.last_name,
        order.shipping.company_name,
        order.shipping.country_id,
        order.shipping.address,
        order.shipping.city,
        order.shipping.state,
        order.shipping.postcode,
        order.shipping.phone,
        order.shipping.email,
      ];

      await query(orderShippingSql, shippingValues);
    }
    else {
      output.status = 401
    }

    return output;
  }

  updateOrderStatus = async (orderId, status) => {
    const current_date = commonfn.dateTimeNow();

    const sql = `UPDATE ${this.tableOrders} SET status=?, updated_at=? WHERE id = ?`;
    const values = [status, current_date, orderId];

    return await query(sql, values);
  }

  getPromo = async (params = {}) => {
    let sql = `SELECT Promo.*
        FROM ${this.tableOrderPromoCodes} as Promo
        `;

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

    const result = await query(sql, [...values]);

    return result;
  }

  getCountries = async () => {
    let sql = `SELECT * FROM ${this.tableCountries}`;

    return await query(sql);
  }

  createWithdrawRequest = async (params, currentUser) => {
    const current_date = commonfn.dateTimeNow();
    let output = {};

    const sql = `INSERT INTO ${this.tableWithdrawRequests} 
        (user_id, amount, payment_method, date) 
        VALUES (?,?,?,?)`;

    const values = [
      currentUser.id,
      params.amount,
      params.payment_method,
      current_date,
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      const request_id = result.insertId;

      output.status = 200
      output.data = { request_id }
    }
    else {
      output.status = 401
    }

    return output;
  }

  getWithdrawRequests = async (currentUser) => {
    let sql = `SELECT * FROM ${this.tableWithdrawRequests}`;

    if (currentUser.role === 'admin') {
      return await query(sql);
    }

    sql += ` WHERE user_id=?`;

    return await query(sql, [currentUser.id]);
  }

  getSoldItems = async (currentUser) => {
    let sql = `SELECT OrderItems.*, Orders.status as order_status 
      FROM ${this.tableOrderItems} as OrderItems
      LEFT JOIN ${this.tableName} as Products ON Products.id=OrderItems.product_id 
      LEFT JOIN ${this.tableOrders} as Orders ON Orders.id=OrderItems.order_id 
      WHERE Products.user_id=?
    `;

    return await query(sql, [currentUser.id]);
  }

  addWishlistProduct = async (product_id, currentUser) => {
    const user_id = currentUser.id;
    const output = {}

    const sql = `INSERT INTO ${DBTables.product_wishlists} 
            (user_id, product_id) 
            VALUES ? ON DUPLICATE KEY UPDATE id=id`;

    const values = [user_id, product_id];

    const result = await query2(sql, [[values]]);

    if (result.insertId) {
      output.status = 200
    }
    else {
      output.status = 401
    }

    return output;
  }

  getWishlistProducts = async (currentUser) => {
    let sql = `SELECT product_id
      FROM ${DBTables.product_wishlists}
      WHERE user_id=${currentUser.id}`;

    let product_ids = await query(sql);
    product_ids = product_ids.map(obj => obj.product_id);

    if (product_ids.length) {
      return this.getProducts({ params: { ids: product_ids } });
    }

    return [];
  }

  deleteWishlistProduct = async (product_id, currentUser) => {
    const sql = `DELETE FROM ${DBTables.product_wishlists} WHERE user_id=? AND product_id=?`;
    const values = [currentUser.id, product_id];

    return await query(sql, values);
  }

  getProductOptions = async () => {
    let sql = `SELECT Choices.*, Options.title as option
      FROM ${DBTables.product_options} as Options
      LEFT JOIN ${DBTables.product_option_choices} as Choices ON Choices.option_id=Options.id`;

    return await query(sql);
  }

  getProductCategoryOptions = async () => {
    let sql = `SELECT *
      FROM ${DBTables.product_category_option_relationships}`;

    return await query(sql);
  }

  getPriceRange = async () => {
    let sql = `SELECT MAX(price) as max_price, MIN(price) as min_price, 
      MAX(discounted_price) as max_discounted_price, MIN(discounted_price) as min_discounted_price
      FROM ${DBTables.products}`;

    return await query(sql);
  }

  getBrands = async () => {
    let sql = `SELECT DISTINCT u.id as id, u.display_name as display_name, u.username as username
      FROM ${DBTables.products} as p
      LEFT JOIN ${DBTables.users} as u ON u.id=p.user_id
      ORDER BY u.display_name`;

    return await query(sql);
  }

  getShippingMethods = async (user_id) => {
    let sql = `SELECT *
      FROM ${DBTables.product_shippings}
      WHERE vendor_id=?
      ORDER BY shipping_order`;

    return await query(sql, [user_id]);
  }

  getShippingMethodsById = async (ids) => {
    let sql = `SELECT *
    FROM ${DBTables.product_shippings}
    WHERE id IN (${encodeURI(ids.join(','))})`;
    
    return await query(sql);
  }

  addShippingMethod = async (body, currentUser) => {
    const user_id = currentUser.id;
    const output = {}

    const sql = `INSERT INTO ${DBTables.product_shippings} 
            (vendor_id, title, zones, fee, shipping_order) 
            VALUES (?,?,?,?,?)`;

    const values = [
      user_id,
      body.title,
      JSON.stringify(body.zones),
      body.fee || 0,
      body.shipping_order || 1
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200
    }
    else {
      output.status = 401
    }

    return output;
  }
  
  editShippingMethod = async (shipping_id, body) => {
    const sqlParamsArr = [];
    const values = [];

    Object.entries(body).forEach(([key, val]) => {
      sqlParamsArr.push(`${key} = ?`);

      if(key == 'zones'){
        values.push(JSON.stringify(val));
      }
      else{
        values.push(val);
      }
      
    });

    const sqlParams = sqlParamsArr.join(',');
    const sql = `UPDATE ${DBTables.product_shippings} SET ${sqlParams} WHERE id=?`;
    values.push(shipping_id);

    return await query(sql, values);
  }

  deleteShippingMethod = async (shipping_id, currentUser) => {
    const sql = `DELETE FROM ${DBTables.product_shippings} WHERE id=? AND vendor_id=?`;
    const values = [shipping_id, currentUser.id];

    return await query(sql, values);
  }

  addCategory = async (body) => {
    const output = {}

    const sql = `INSERT INTO ${DBTables.product_categories} 
            (parent_id, title, image) 
            VALUES (?,?,?)`;

    const values = [
      body.parent_id,
      body.title,
      body.image
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200
    }
    else {
      output.status = 401
    }

    return output;
  }
  
  editCategory = async (category_id, body) => {
    const sqlParamsArr = [];
    const values = [];

    Object.entries(body).forEach(([key, val]) => {
      sqlParamsArr.push(`${key} = ?`);
      values.push(val);
    });

    const sqlParams = sqlParamsArr.join(',');
    const sql = `UPDATE ${DBTables.product_categories} SET ${sqlParams} WHERE id=?`;
    values.push(category_id);

    return await query(sql, values);
  }

  deleteCategory = async (category_id, currentUser) => {
    const sql = `DELETE FROM ${DBTables.product_categories} WHERE id=?`;
    const values = [category_id];

    return await query(sql, values);
  }

  getCategoryOptions = async () => {
    let sql = `SELECT Options.*,
      Choices.id as choice_id, Choices.title as choice, Choices.choice_order as choice_order
      FROM ${DBTables.product_options} as Options
      LEFT JOIN ${DBTables.product_option_choices} as Choices ON Choices.option_id=Options.id
      ORDER BY Options.title`;

    return await query(sql);
  }

  addCategoryOption = async (body) => {
    const output = {}

    const sql = `INSERT INTO ${DBTables.product_options} 
            (title) 
            VALUES (?)`;

    const values = [
      body.title,
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200
    }
    else {
      output.status = 401
    }

    return output;
  }
  
  editCategoryOption = async (option_id, body) => {
    const sqlParamsArr = [];
    const values = [];

    Object.entries(body).forEach(([key, val]) => {
      sqlParamsArr.push(`${key} = ?`);
      values.push(val);
    });

    const sqlParams = sqlParamsArr.join(',');
    const sql = `UPDATE ${DBTables.product_options} SET ${sqlParams} WHERE id=?`;
    values.push(option_id);

    return await query(sql, values);
  }

  deleteCategoryOption = async (option_id) => {
    const sql = `DELETE FROM ${DBTables.product_options} WHERE id=?`;
    const choiceSql = `DELETE FROM ${DBTables.product_option_choices} WHERE option_id=?`;

    const values = [option_id];

    await query(choiceSql, values);
    return await query(sql, values);
  }

  addOptionChoice = async (body) => {
    const output = {}

    const sql = `INSERT INTO ${DBTables.product_option_choices} 
            (option_id, title, choice_order) 
            VALUES (?,?,?)`;

    const values = [
      body.option_id,
      body.title,
      body.choice_order,
    ];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200
    }
    else {
      output.status = 401
    }

    return output;
  }
  
  editOptionChoice = async (choice_id, body) => {
    const sqlParamsArr = [];
    const values = [];

    Object.entries(body).forEach(([key, val]) => {
      sqlParamsArr.push(`${key} = ?`);
      values.push(val);
    });

    const sqlParams = sqlParamsArr.join(',');
    const sql = `UPDATE ${DBTables.product_option_choices} SET ${sqlParams} WHERE id=?`;
    values.push(choice_id);

    return await query(sql, values);
  }

  deleteOptionChoice = async (choice_id) => {
    const sql = `DELETE FROM ${DBTables.product_option_choices} WHERE id=?`;

    const values = [choice_id];

    return await query(sql, values);
  }
  
  assignCategoryOptions = async (body) => {
    let ids = body.selectedOptions.map(option => option.id);
    ids = encodeURI(ids.join(','));

    let remove_sql = `DELETE FROM ${DBTables.product_category_option_relationships} 
      WHERE category_id=?`;
    
    if (ids) {
      remove_sql += ` AND option_id NOT IN (${ids})`;
    }

    await query(remove_sql, [body.category_id]);

    if (body.selectedOptions && body.selectedOptions.length > 0) {
      const sql = `INSERT INTO ${DBTables.product_category_option_relationships} 
        (category_id, option_id) 
        VALUES ? ON DUPLICATE KEY UPDATE id=id`;

      const values = body.selectedOptions.map(option => ([body.category_id, option.id]));
      await query2(sql, [values]);
    }
  }
}

module.exports = new ShopModel;
