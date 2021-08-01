const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class NewsModel {
    tableName = 'news';
    tableNameComments = 'news_comments';
    tableNameCategories = 'news_categories';
    tableNameTopNews = 'news_top_news';

    createNews = async (params) => {
        let slug = await commonfn.generateSlug(params.title, this.tableName);
        let output = {};

        const sql = `INSERT INTO ${this.tableName} 
            (title, slug, content, short_content, featured_image, category_id, featured) 
            VALUES (?,?,?,?,?,?,?)`;

        const values = [params.title, slug, params.content, params.short_content, params.featured_image, params.category_id, params.featured];
        
        const result = await query(sql, values);


        if (result.insertId) {
            const news_id = result.insertId;

            output.status = 200
            output.data = { news_id, slug }
        }
        else {
            output.status = 401
        }

        return output;
    }
    
    updateNews = async (id, params) => {
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

    getNews = async (params = {}, page = 1, limit = -1) => {
        let sql = `SELECT News.*, NewsCategories.name as category 
            FROM ${this.tableName} as News
            LEFT JOIN ${this.tableNameCategories} as NewsCategories ON NewsCategories.id=News.category_id
            `;

        const paramArray = [];
        const values = [];

        for (let param in params) {
            if (param === 'exclude') {
                const ids = encodeURI(params.exclude.join(','));
                paramArray.push(`News.id NOT IN (${ids})`);
            } else {
                paramArray.push(`News.${param} = ?`);
                values.push(params[param])
            }
        }

        if (paramArray.length) {
            sql += ` WHERE ${paramArray.join(' AND ')}`;
        }
        
        sql += ` ORDER BY News.created_at DESC`;
        
        if (limit > 0) {
            sql += ` LIMIT ${limit} OFFSET ${limit * (page - 1)}`;
        }

        return await query(sql, values);
    }

    getSingleNews = async (params = {}) => {
        let sql = `SELECT News.*, NewsCategories.name as category 
            FROM ${this.tableName} as News
            LEFT JOIN ${this.tableNameCategories} as NewsCategories ON NewsCategories.id=News.category_id
            `;

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        const result = await query(sql, [...values]);

        return result;
    }

    deleteNews = async (id) => {
        const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
        const values = [id];

        return await query(sql, values);
    }

    createNewsCategory = async (params) => {
        let slug = await commonfn.generateSlug(params.name, this.tableNameCategories);
        let output = {};

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

    getTopNews = async () => {
        let sql = `SELECT * FROM ${this.tableNameTopNews}`;

        return await query(sql);
    }

    updateTopNews = async (params) => {
        const sql = `INSERT INTO ${this.tableNameTopNews} (category_id, news_id) VALUES ? ON DUPLICATE KEY UPDATE news_id=VALUES(news_id)`;
        const values = [];

        for (const categoryId in params) {
            values.push([categoryId, params[categoryId]]);
        }

        if (values.length) {
            await query2(sql, [values]);
        }
    }
}

module.exports = new NewsModel;