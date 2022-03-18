const { param } = require('express-validator');
const { query, query2, query3 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');

class PagesModel {
  tableName = 'pages';
  tableFaqs = 'faqs';

  createPage = async (params) => {
    const current_date = commonfn.dateTimeNow();
    const slug = await commonfn.generateSlug(params.title, this.tableName);
    let output = {};

    const sql = `INSERT INTO ${this.tableName} 
        (title, slug, content, meta_title, meta_keywords, meta_desc, created_at, updated_at) 
        VALUES (?,?,?,?,?,?,?,?)`;

    const values = [
      params.title,
      slug,
      params.content,
      params.meta_title,
      params.meta_keywords,
      params.meta_desc,
      current_date,
      current_date
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

  updatePage = async (slug, params) => {
    const current_date = commonfn.dateTimeNow();
    let sql = `UPDATE ${this.tableName} SET `;

    const paramArray = [];
    let values = [];
    const acceptedParams = ['title', 'content', 'meta_title', 'meta_keywords', 'meta_desc'];

    for (let param in params) {
      if (acceptedParams.includes(param)) {
        paramArray.push(`${param} = ?`);
        values.push(params[param]);
      }
    }

    paramArray.push(`updated_at = ?`);
    values.push(current_date);

    sql += paramArray.join(', ');

    sql += ` WHERE slug = ?`;

    values = [
      ...values,
      slug
    ];

    const result = await query(sql, values);

    return result;
  }

  getPages = async (params = {}) => {
    let sql = `SELECT * FROM ${this.tableName}`;

    return await query(sql);
  }

  getPage = async (params = {}) => {
    let sql = `SELECT * FROM ${this.tableName}`;

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

    const result = await query(sql, [...values]);

    return result;
  }

  deletePage = async (slug) => {
    const sql = `DELETE FROM ${this.tableName} WHERE slug=?`;
    const values = [slug];

    return await query(sql, values);
  }

  
  createFaq = async (params) => {
    let output = {};

    const sql = `INSERT INTO ${this.tableFaqs} 
        (question, answer, faq_order) 
        VALUES (?,?,?)`;

    const values = [
      params.question,
      params.answer,
      params.faq_order,
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

  updateFaq = async (id, params) => {
    let sql = `UPDATE ${this.tableFaqs} SET `;

    const paramArray = [];
    let values = [];
    const acceptedParams = ['question', 'answer', 'faq_order'];

    for (let param in params) {
      if (acceptedParams.includes(param)) {
        paramArray.push(`${param} = ?`);
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

    return result;
  }

  getFaqs = async (params = {}) => {
    let sql = `SELECT * FROM ${this.tableFaqs} ORDER BY faq_order`;

    return await query(sql);
  }

  getFaq = async (params = {}) => {
    let sql = `SELECT * FROM ${this.tableFaqs}`;

    const { columnSet, values } = multipleColumnSet(params)
    sql += ` WHERE ${columnSet}`;

    const result = await query(sql, [...values]);

    return result;
  }

  deleteFaq = async (id) => {
    const sql = `DELETE FROM ${this.tableFaqs} WHERE id=?`;
    const values = [id];

    return await query(sql, values);
  }
}

module.exports = new PagesModel;
