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
    const values = [user_id, params.title, slug, params.price, params.discounted_price, params.discount_start, params.discount_end, params.image,
      JSON.stringify(params.galleries), params.short_desc, params.description, params.sku, params.stock_status, params.purchase_note, params.is_downloadable, params.is_virtual,
      current_date, current_date];

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
      'discount_start': params.discount_start,
      'discount_end': params.discount_end,
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
      const cat_remove_sql = `DELETE FROM ${DBTables.product_category_relationships} WHERE product_id=${product_id} AND category_id NOT IN (${cat_ids})`;
      await query(cat_remove_sql);

      if (params.categories && params.categories.length > 0) {
        const cat_sql = `INSERT INTO ${DBTables.product_category_relationships} 
          (product_id, category_id) 
          VALUES ? ON DUPLICATE KEY UPDATE id=id`;

        const cat_values = params.categories.map(cat => ([product_id, cat]));
        await query2(cat_sql, [cat_values]);
      }

      return true;
    }

    return false;
  }

  getProduct = async (slug) => {
    let sql = `SELECT p.*
              FROM ${DBTables.products} as p
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

    this.updateProductViewCount(product);

    return product;
  }

  updateProductViewCount = async (product) => {
    const sql = `UPDATE ${DBTables.products} SET views=${product.views + 1} WHERE id=${product.id}`;

    return await query(sql);
  }

  getProducts = async (params) => {
    let sql = `SELECT p.*
              FROM ${DBTables.products} as p`;

    let queryParams = ` WHERE p.status = 'publish'`;

    let values = [];

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

    // set params
    if (params.params) {
      const p = params.params;

      if (p.keyword && p.keyword != '') {
        // TODO: do javascript validation
        queryParams += ` AND ( p.title LIKE '%${p.keyword}%' OR p.description LIKE '%${p.keyword}%' )`;
      }

      if (p.category && p.category != '') {
        // TODO: do javascript validation
        queryParams += ` AND p.category_id = ${p.category}`;
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

    sql += `${queryParams}${queryOrderby}${queryLimit}`;

    return await query(sql, values);
  }

  getRelatedProducts = async (slug) => {
    let sql = `SELECT p.*, c.title as category_name
              FROM ${DBTables.products} as p
              JOIN ${DBTables.product_categories} as c ON p.category_id = c.id`;

    let queryParams = ` WHERE p.slug != ? AND p.category_id = (
      SELECT category_id FROM ${DBTables.products} WHERE slug = ?
    )`;

    let values = [slug, slug];

    // set limit 
    let queryLimit = ` LIMIT 4`;

    sql += `${queryParams}${queryLimit}`;



    return await query(sql, values);
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
    Product.discount_end as product_discount_end 
    FROM ${this.tableNameCartItems} as Cart  
    LEFT JOIN ${this.tableName} as Product ON Product.id=Cart.product_id
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
      Promo.code as promo_code, Promo.discount as discount
      FROM ${this.tableOrders} as Orders 
      LEFT JOIN ${this.tableOrderPromoCodes} as Promo ON Promo.id=Orders.promo_id
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
      Promo.code as promo_code, Promo.discount as discount
      FROM ${this.tableOrders} as Orders
      LEFT JOIN ${this.tableOrderPromoCodes} as Promo ON Promo.id=Orders.promo_id
      `;

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

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
        (parent_id, user_id, vendor_id, subtotal, total, earned, promo_id, additional_info, created_at, updated_at) 
        VALUES (?,?,?,?,?,?,?,?,?,?)`;

    const values = [
      parent_id,
      currentUser.id,
      order.vendor_id,
      order.subtotal,
      order.total,
      order.total * 0.95,
      order.promo_id,
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
    let sql = `SELECT * FROM ${this.tableWithdrawRequests} WHERE user_id=?`;

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
}

module.exports = new ShopModel;
