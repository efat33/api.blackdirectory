const { query } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');

class DealsModel {
  tableName = 'deals';
  tableNameDealers = 'dealers';

  createDeal = async (params) => {
    const current_date = commonfn.dateTimeNow();
    let slug = await commonfn.generateSlug(params.title, this.tableName);
    let output = {};

    const sql = `INSERT INTO ${this.tableName} 
      (
        title, 
        slug, 
        description, 
        short_description, 
        price_description, 
        image, 
        deal_link,
        dealer_id, 
        free_shipping, 
        discount_code, 
        expiry_date, 
        meta_title, 
        meta_keywords, 
        meta_desc, 
        created_at,
        updated_at
      ) 
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
      params.title,
      slug,
      params.description,
      params.short_description,
      params.price_description,
      params.image,
      params.deal_link,
      params.dealer_id,
      params.free_shipping,
      params.discount_code,
      params.expiry_date ? commonfn.dateTime(new Date(params.expiry_date)) : null,
      params.meta_title,
      params.meta_keywords,
      params.meta_desc,
      current_date,
      current_date
    ];

    const result = await query(sql, values);


    if (result.insertId) {
      const deal_id = result.insertId;

      output.status = 200
      output.data = { deal_id, slug }
    }
    else {
      output.status = 401
    }

    return output;
  }

  updateDeal = async (id, params) => {
    const current_date = commonfn.dateTimeNow();
    let sql = `UPDATE ${this.tableName} SET`;

    const paramArray = [];
    for (let param in params) {
      paramArray.push(` ${param} = ?`);
    }

    paramArray.push(` updated_at = ?`);

    sql += paramArray.join(', ');

    sql += ` WHERE id = ?`;

    const values = [
      ...Object.values(params),
      current_date,
      id
    ];

    const result = await query(sql, values);

    return result;
  }

  getDeals = async (params = {}, page = 1, limit = -1, count = false) => {
    let sql = `SELECT Deal.*, Dealer.name as dealer_name, Dealer.id as dealer_id, Dealer.slug as dealer_slug 
            FROM ${this.tableName} as Deal
            LEFT JOIN ${this.tableNameDealers} as Dealer ON Dealer.id=Deal.dealer_id
            `;

    if (count) {
      sql = `SELECT COUNT(*) as count
        FROM ${this.tableName} as Deal
        LEFT JOIN ${this.tableNameDealers} as Dealer ON Dealer.id=Deal.dealer_id
        `;
    }

    const paramArray = [];
    const values = [];

    for (let param in params) {
      if (param.startsWith('dealer')) {
        if(params[param] != ''){
          paramArray.push(`Dealer.${param.substring(7)} = ?`);
          values.push(params[param]);
        }
      } else if(param == 'title')  {
        paramArray.push(`Deal.${param} LIKE ?`);
        values.push(`%${params[param]}%`);
      } else  {
        paramArray.push(`Deal.${param} = ?`);
        values.push(params[param]);
      }
    }

    if (paramArray.length) {
      sql += ` WHERE ${paramArray.join(' AND ')}`;
    }

    if (!count) {
      sql += ` ORDER BY Deal.created_at DESC`;
  
      if (limit > 0) {
        sql += ` LIMIT ${limit} OFFSET ${limit * (page - 1)}`;
      }
    }

    return await query(sql, values);
  }

  getDeal = async (params = {}) => {
    let sql = `SELECT Deal.*, Dealer.name as dealer_name, Dealer.id as dealer_id, Dealer.slug as dealer_slug  
            FROM ${this.tableName} as Deal
            LEFT JOIN ${this.tableNameDealers} as Dealer ON Dealer.id=Deal.dealer_id
            `;

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

    const result = await query(sql, [...values]);

    return result;
  }

  deleteDeal = async (id) => {
    const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
    const values = [id];

    return await query(sql, values);
  }

  createDealer = async (params) => {
    let slug = await commonfn.generateSlug(params.name, this.tableNameDealers);
    let output = {};

    const sql = `INSERT INTO ${this.tableNameDealers} (name, slug) VALUES (?, ?)`;

    const result = await query(sql, [params.name, slug]);

    if (result.insertId) {
      const dealer_id = result.insertId;

      output.status = 200
      output.data = { 'dealer_id': dealer_id, 'slug': slug }
    }
    else {
      output.status = 401
    }

    return output;
  }

  updateDealer = async (dealerId, params) => {
    let sql = `UPDATE ${this.tableNameDealers} SET`;

    const paramArray = [];
    for (let param in params) {
      paramArray.push(` ${param} = ?`);
    }

    sql += paramArray.join(', ');

    sql += ` WHERE id = ?`;

    const values = [
      ...Object.values(params),
      dealerId
    ];

    const result = await query(sql, values);

    return result;
  }

  getDealers = async () => {
    let sql = `SELECT *
            FROM ${this.tableNameDealers} 
            ORDER BY name`;

    return await query(sql);
  }

  getDealer = async (dealerId) => {
    let sql = `SELECT * FROM ${this.tableNameDealers} WHERE id=?`;

    return await query(sql, [dealerId]);
  }

  deleteDealer = async (dealerId) => {
    const sql = `DELETE FROM ${this.tableNameDealers} WHERE id=?`;
    const values = [dealerId];

    return await query(sql, values);
  }
}

module.exports = new DealsModel;
