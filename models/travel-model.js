const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class TravelModel {
    tableName = 'travels';
    tableNameComments = 'news_comments';
    tableNameCategories = 'news_categories';
    tableNameTopNews = 'news_top_news';
    tableNameComments = 'news_comments';
    tableNameCommentLikes = 'news_comment_likes';

    tableNameUsers = 'users';

    findOne = async (params, table = `${this.tableName}`) => {
        const { columnSet, values } = multipleColumnSet(params)

        const sql = `SELECT * FROM ${table}
      WHERE ${columnSet} LIMIT 1`;

        const result = await query(sql, [...values]);

        // return back the first row
        return result[0] ? result[0] : {};

    }

    find = async (params = {}, table = `${DBTables.events}`, orderby = '') => {
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

    createTravel = async (params) => {
        let slug = await commonfn.generateSlug(params.title, this.tableName);
        let output = {};

        const sql = `INSERT INTO ${this.tableName} 
            (title, slug, content, featured_image) 
            VALUES (?,?,?,?)`;

        const values = [params.title, slug, params.content, params.featured_image];

        const result = await query(sql, values);


        if (result.insertId) {
            const travel_id = result.insertId;

            output.status = 200
            output.data = { travel_id, slug }
        }
        else {
            output.status = 401
        }

        return output;
    }

    updateTravel = async (id, params) => {
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

    getTravels = async (params = {}, page = 1, limit = -1) => {
        let sql = `SELECT *
            FROM ${this.tableName}`;

        const paramArray = [];
        const values = [];

        for (let param in params) {
            if (param == 'title' && params[param] != '') {
                paramArray.push(`${param} = ?`);
                values.push(params[param])
            }
        }

        if (paramArray.length) {
            sql += ` WHERE ${paramArray.join(' AND ')}`;
        }

        sql += ` ORDER BY created_at DESC`;

        const count_sql = `${sql}`;

        if (limit > 0) {
            sql += ` LIMIT ${limit} OFFSET ${limit * (page - 1)}`;
        }
        
        const travels = await query(sql, values);

        let total_travels = 0;

        if (travels.length > 0) {

            const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
            const resultCount = await query(count_sql_final, values);

            total_travels = resultCount[0].count;
        }

        const output = {}
        output.travels = travels;
        output.total_travels = total_travels;
        
        return output;
    }

    getSingleTravel = async (params = {}) => {
        let sql = `SELECT * 
            FROM ${this.tableName}`;

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        const result = await query(sql, [...values]);

        return result;
    }

    deleteTravel = async (id) => {
        const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
        const values = [id];

        return await query(sql, values);
    }

    
}

module.exports = new TravelModel;
