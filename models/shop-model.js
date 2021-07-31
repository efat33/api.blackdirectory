const {query, query2, query3} = require('../server');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');
const {DBTables} = require('../utils/common');

class ShopModel {
  tableName = 'products';

  
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

      if(orderby != '') sql += ` ${orderby}`;

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
                  discount_start, discount_end, category_id, image, galleries, 
                  short_desc, description, sku, stock_status, purchase_note, 
                  is_downloadable, is_virtual, created_at, updated_at) VALUES 
                  (?,?,?,?,?,
                    ?,?,?,?,?,
                    ?,?,?,?,?,
                    ?,?,?,?)`;
    const values = [user_id, params.title, slug, params.price, params.discounted_price, params.discount_start, params.discount_end, params.category_id, params.image,
              JSON.stringify(params.galleries), params.short_desc, params.description, params.sku, params.stock_status, params.purchase_note, params.is_downloadable, params.is_virtual, 
              current_date, current_date];
    
    const result_product = await query(sql, values);

    if(result_product.insertId){
      
      const product_id = result_product.insertId;

      // insert meta data
      const sql_meta = `INSERT INTO ${DBTables.products_meta} (product_id, meta_key, meta_value) VALUES ?`;
      const values = [];

      // insert download meta data
      if(params.is_downloadable){
        values.push([product_id, 'download_files', JSON.stringify(params.download_files)]);
      }
      else{
        values.push([product_id, 'download_files', '']);
      }

      const resultProdMeta = await query2(sql_meta, [values]);

      // insert product tags 
      if(params.tags && params.tags.length > 0){
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
      'category_id': params.category_id,
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

      if(params.is_downloadable){
        values.push([product_id, 'download_files', JSON.stringify(params.download_files)]);
      }
      else{
        values.push([product_id, 'download_files', '']);
      }
      
      await query2(sqlMeta, [values]);


      // update product tags 
      // first delete the existing tags 
      const sql = `DELETE FROM ${DBTables.product_tag_relationships} WHERE product_id IN (?)`;
      await query(sql, [product_id]);

      // insert product tags 
      if(params.tags && params.tags.length > 0){
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

  getProduct = async (slug) => {
    const product = await this.findOne({'slug': slug});

    if(Object.keys(product) === 0){
      return product;
    }
    
    const product_id = product.id;

    product.galleries = JSON.parse(product.galleries);
    
    // process meta data
    const metaData = await this.find({'product_id': product_id}, DBTables.products_meta);

    for (const item of metaData) {
      if(item.meta_key == 'download_files' && item.meta_value != '') {
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

    return product;
  }

  getProducts = async (params) => {
    let sql = `SELECT p.*, c.title as category_name
              FROM ${DBTables.products} as p
              JOIN ${DBTables.product_categories} as c ON p.category_id = c.id`;

    let queryParams = ` WHERE p.status = 'publish'`;

    let values = [];

    // set order by
    let queryOrderby = '';
    if(params.orderby && params.orderby != ''){
      queryOrderby = ` ORDER BY ?`;
      values.push(params.orderby);

      if(params.order && params.order != ''){
        // TODO: do javascript validation
        queryOrderby += ` ${params.order}`;
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

    // set params
    if(params.params){
      const p = params.params;

      if(p.keyword && p.keyword != ''){
         // TODO: do javascript validation
        queryParams += ` AND ( p.title LIKE '%${p.keyword}%' OR p.description LIKE '%${p.keyword}%' )`;
      }

      if(p.category && p.category != ''){
        // TODO: do javascript validation
        queryParams += ` AND p.category_id = ${p.category}`;
      }

    }
    
    sql += `${queryParams}${queryOrderby}${queryLimit}`;

    
    
    return await query(sql, values);
  }

}

module.exports = new ShopModel;
