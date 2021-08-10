const { param } = require('express-validator');
const { query, query2, query3 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');

class MobilesModel {
  tableName = 'mobiles';
  tableProvider = 'mobile_providers';
  tableTopMobiles = 'mobile_top_mobiles';

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

  createMobile = async (params) => {
    const current_date = commonfn.dateTimeNow();
    let output = {};

    const sql = `INSERT INTO ${this.tableName} 
        (description, link, provider_id, cost, data, minutes, texts, contract_length, category, created_at) 
        VALUES (?,?,?,?,?,?,?,?,?,?)`;

    const values = [
      params.description,
      params.link,
      params.provider_id,
      params.cost,
      params.data,
      params.minutes,
      params.texts,
      params.contract_length,
      params.category,
      current_date
    ];

    const result = await query(sql, values);


    if (result.insertId) {
      const mobile_id = result.insertId;

      output.status = 200
      output.data = { mobile_id }

      if (params.top_pick) {
        await this.updateTopMobile(mobile_id, params.category);
      }
    }
    else {
      output.status = 401
    }

    return output;
  }

  updateMobile = async (id, params) => {
    let sql = `UPDATE ${this.tableName} SET`;

    const paramArray = [];
    let values = [];
    const acceptedParams = ['description', 'link', 'provider_id', 'cost', 'data', 'minutes', 'texts', 'contract_length', 'category'];

    for (let param in params) {
      if (acceptedParams.includes(param)) {
        paramArray.push(` ${param} = ?`);
        values.push(params[param]);
      }
    }

    sql += paramArray.join(', ');

    sql += ` WHERE id = ?`;

    values = [
      ...values,
      id
    ];

    const result = await query(sql, values);
    
    if (params.top_pick) {
      await this.updateTopMobile(id, params.category);
    }

    return result;
  }

  getMobiles = async (params = {}, page = 1, limit = -1) => {
    let sql = `SELECT Mobile.*, MobileProviders.title as provider_title, MobileProviders.logo as provider_logo 
        FROM ${this.tableName} as Mobile 
        LEFT JOIN ${this.tableProvider} as MobileProviders ON MobileProviders.id=Mobile.provider_id 
        `;

    const paramArray = [];
    const values = [];

    // for (let param in params) {
    //   paramArray.push(`Mobile.${param} = ?`);
    //   values.push(params[param])
    // }

    if (params.category) {
      paramArray.push(`Mobile.category = ?`);
      values.push(params.category);
    }

    if (params.cost) {
      const costRange = params.cost.split(',');

      paramArray.push(`(Mobile.cost >= ? AND Mobile.cost <= ?)`);
      values.push(costRange[0]);
      values.push(costRange[1]);
    }

    if (params.data) {
      const dataRange = params.data.split(',');

      paramArray.push(`(Mobile.data >= ? AND Mobile.data <= ?)`);
      values.push(dataRange[0]);
      values.push(dataRange[1]);
    }

    if (params.minutes) {
      const minutesRange = params.minutes.split(',');

      paramArray.push(`(Mobile.minutes >= ? AND Mobile.minutes <= ?)`);
      values.push(minutesRange[0]);
      values.push(minutesRange[1]);
    }

    if (params.texts) {
      const textsRange = params.texts.split(',');

      paramArray.push(`(Mobile.texts >= ? AND Mobile.texts <= ?)`);
      values.push(textsRange[0]);
      values.push(textsRange[1]);
    }

    if (params.providers) {
      const ids = encodeURI(params.providers);
      paramArray.push(`Mobile.provider_id IN (${ids})`);
    }

    if (params.contracts && params.contracts !== 'any') {
      const ids = encodeURI(params.contracts);
      paramArray.push(`Mobile.contract_length IN (${ids})`);
    }

    if (paramArray.length) {
      sql += ` WHERE ${paramArray.join(' AND ')}`;
    }

    if (params.orderBy === 'cost') {
      sql += ` ORDER BY Mobile.cost ASC`;
    } else if (params.orderBy === 'data') {
      sql += ` ORDER BY Mobile.data DESC`;
    } else if (params.orderBy === 'contract') {
      sql += ` ORDER BY Mobile.contract_length ASC`;
    } else {
      sql += ` ORDER BY Mobile.created_at DESC`;
    }

    if (limit > 0) {
      sql += ` LIMIT ${limit} OFFSET ${limit * (page - 1)}`;
    }

    return await query(sql, values);
  }

  getMobile = async (params = {}) => {
    let sql = `SELECT Mobile.*, MobileProviders.title as provider_title, MobileProviders.logo as provider_logo 
        FROM ${this.tableName} as Mobile
        LEFT JOIN ${this.tableProvider} as MobileProviders ON MobileProviders.id=Mobile.provider_id
        `;

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

    const result = await query(sql, [...values]);

    return result;
  }

  deleteMobile = async (id) => {
    const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
    const values = [id];

    return await query(sql, values);
  }

  getTopMobiles = async () => {
    let sql = `SELECT Mobiles.*, MobileProviders.title as provider_title, MobileProviders.logo as provider_logo 
      FROM ${this.tableTopMobiles} as TopMobiles
      LEFT JOIN ${this.tableName} as Mobiles ON Mobiles.id=TopMobiles.mobile_id
      LEFT JOIN ${this.tableProvider} as MobileProviders ON MobileProviders.id=Mobiles.provider_id 
    `;

    return await query(sql);
  }

  updateTopMobile = async (mobile_id, category) => {
    const sql = `INSERT INTO ${this.tableTopMobiles} (category, mobile_id) VALUES ? ON DUPLICATE KEY UPDATE mobile_id=VALUES(mobile_id)`;
    const values = [[category, mobile_id]];

    await query2(sql, [values]);
  }

  createMobilesProvider = async (params) => {
    const current_date = commonfn.dateTimeNow();
    let slug = await commonfn.generateSlug(params.title, this.tableProvider);
    let output = {};

    const sql = `INSERT INTO ${this.tableProvider} 
      (title, slug, logo, created_at) 
      VALUES (?,?,?,?)`;

    const result = await query(sql, [params.title, slug, params.logo, current_date]);

    if (result.insertId) {
      const mobiles_provider_id = result.insertId;

      output.status = 200
      output.data = { 'mobiles_provider_id': mobiles_provider_id }
    }
    else {
      output.status = 401
    }

    return output;
  }

  updateMobilesProvider = async (providerId, params) => {
    let sql = `UPDATE ${this.tableProvider} SET`;

    const paramArray = [];
    for (let param in params) {
      paramArray.push(` ${param} = ?`);
    }

    sql += paramArray.join(', ');

    sql += ` WHERE id = ?`;

    const values = [
      ...Object.values(params),
      providerId
    ];

    const result = await query(sql, values);

    return result;
  }

  getMobilesProviders = async () => {
    let sql = `SELECT * FROM ${this.tableProvider} ORDER BY title ASC`;

    return await query(sql);
  }

  getMobilesProvider = async (providerId) => {
    let sql = `SELECT * FROM ${this.tableProvider} WHERE id=?`;

    return await query(sql, [providerId]);
  }

  deleteMobilesProvider = async (providerId) => {
    const sql = `DELETE FROM ${this.tableProvider} WHERE id=?`;
    const values = [providerId];

    return await query(sql, values);
  }


}

module.exports = new MobilesModel;
