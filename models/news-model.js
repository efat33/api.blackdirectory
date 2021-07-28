const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class NewsModel {
    tableName = 'news';
    tableNameComments = 'news_comments';
    tableNameCategories = 'news_categories';
    tableNameTopNews = 'news_top_news';

    // createNews = async (params, currentUser) => {
    //     const current_date = commonfn.dateTimeNow();
    //     const user_id = currentUser.id;
    //     const output = {}

    //     const currentPackage = await this.getCurrentPackage(currentUser);

    //     const date = new Date();
    //     const expiry_date = commonfn.dateTime(new Date(date.setDate(date.getDate() + parseInt(currentPackage.currentPackage.news_expiry || 14))));

    //     let slug = await commonfn.generateSlug(params.title, this.tableName);

    //     // insert data into listings table
    //     const sql = `INSERT INTO ${this.tableName} 
    //         (user_id, title, slug, description, deadline, 
    //         news_sector_id, news_industry, news_apply_type, experience, salary, 
    //         address, latitude, longitude, attachment, urgent, 
    //         filled, status, views, expiry_date, featured, 
    //         applicants_number, news_type, created_at, updated_at) 
    //         VALUES (?,?,?,?,?,
    //         ?,?,?,?,?,
    //         ?,?,?,?,?,
    //         ?,?,?,?,?,
    //         ?,?,?,?)`;

    //     const result = await query(sql, [user_id, params.title, slug, params.description, new Date(params.deadline),
    //         params.news_sector_id, params.news_industry, params.news_apply_type, params.experience, params.salary,
    //         params.address, params.latitude, params.longitude, params.attachment, 0,
    //         0, 'approved', 0, expiry_date, 0,
    //         0, params.news_type, current_date, current_date]);


    //     if (result.insertId) {
    //         const news_id = result.insertId;

    //         // insert data into listings table
    //         const meta_sql = `INSERT INTO ${this.tableNameMeta} 
    //             (news_id, meta_key, meta_value)
    //             VALUES ?`;

    //         const meta_values = [];

    //         if (params.news_apply_email) {
    //             meta_values.push([news_id, 'news_apply_email', params.news_apply_email]);
    //         }

    //         if (params.external_url) {
    //             meta_values.push([news_id, 'external_url', params.external_url]);
    //         }

    //         if (meta_values.length > 0) {
    //             await query2(meta_sql, [meta_values]);
    //         }

    //         output.status = 200
    //         output.data = { 'news_id': news_id, 'slug': slug }
    //     }
    //     else {
    //         output.status = 401
    //     }

    //     return output;
    // }

    // updateNews = async (params) => {
    //     const current_date = commonfn.dateTimeNow();

    //     const sql = `UPDATE ${this.tableName} 
    //         SET title = ?, 
    //             description = ?, 
    //             deadline = ?, 
    //             news_sector_id = ?, 
    //             news_industry = ?, 
    //             news_apply_type = ?, 
    //             experience = ?, 
    //             salary = ?, 
    //             address = ?, 
    //             latitude = ?, 
    //             longitude = ?, 
    //             attachment = ?, 
    //             news_type = ?, 
    //             updated_at = ? 
    //         WHERE id = ${params.id}`;

    //     const values = [
    //         params.title,
    //         params.description,
    //         new Date(params.deadline),
    //         params.news_sector_id,
    //         params.news_industry,
    //         params.news_apply_type,
    //         params.experience,
    //         params.salary,
    //         params.address,
    //         params.latitude,
    //         params.longitude,
    //         params.attachment,
    //         params.news_type,
    //         current_date,
    //     ];

    //     const result = await query(sql, values);

    //     const meta_sql = `INSERT INTO ${this.tableNameMeta} (news_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY UPDATE meta_value=VALUES(meta_value)`;
    //     const meta_values = [];

    //     if (params.news_apply_email) {
    //         meta_values.push([params.id, 'news_apply_email', params.news_apply_email]);
    //     }

    //     if (params.external_url) {
    //         meta_values.push([params.id, 'external_url', params.external_url]);
    //     }

    //     if (meta_values.length) {
    //         await query2(meta_sql, [meta_values]);
    //     }

    //     return result;
    // }

    getNews = async (params, page = 1, limit = 10) => {
        let { sql, values } = this.getNewsSqlGenerate(params);

        sql += ` ORDER BY News.created_at DESC`;

        sql += ` LIMIT ${limit} OFFSET ${limit * (page - 1)}`;

        return await query(sql, [...values]);
    }

    createNewsCategory = async (params) => {
        let slug = await commonfn.generateSlug(params.name, this.tableNameCategories);
        let output = {};

        // insert data into listings table
        const sql = `INSERT INTO ${this.tableNameCategories} 
            (name, slug, category_order) 
            VALUES (?,?,?)`;

        const result = await query(sql, [params.name, slug, params.category_order]);


        if (result.insertId) {
            const news_category_id = result.insertId;

            output.status = 200
            output.data = { 'news_category_id': news_category_id, 'slug': slug }
        }
        else {
            output.status = 401
        }

        return output;
    }

    updateNewsCategory = async (categoryId, params) => {
        let sql = `UPDATE ${this.tableNameCategories} SET`;

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

    getNewsCategories = async () => {
        let sql = `SELECT *, (SELECT count(*) FROM ${this.tableName} WHERE category_id=${this.tableNameCategories}.id) as count 
            FROM ${this.tableNameCategories} 
            ORDER BY category_order`;

        return await query(sql);
    }

    getNewsCategory = async (categoryId) => {
        let sql = `SELECT * FROM ${this.tableNameCategories} WHERE id=?`;

        return await query(sql, [categoryId]);
    }

    deleteNewsCategory = async (categoryId) => {
        const sql = `DELETE FROM ${this.tableNameCategories} WHERE id=?`;
        const values = [categoryId];

        return await query(sql, values);
    }
}

module.exports = new NewsModel;