const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');
const logger = require("../logger");

class NewsModel {
    tableName = 'news';
    tableNameComments = 'news_comments';
    tableNameCategories = 'news_categories';
    tableNewsCatRel = 'news_category_relationships';
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

    createNews = async (params) => {
        let slug = await commonfn.generateSlug(params.title, this.tableName);
        let output = {};

        const sql = `INSERT INTO ${this.tableName} 
            (title, slug, content, short_content, featured_image, featured, meta_title, meta_keywords, meta_desc) 
            VALUES (?,?,?,?,?,?,?,?,?)`;

        const values = [params.title, slug, params.content, params.short_content, params.featured_image, params.featured, params.meta_title, params.meta_keywords, params.meta_desc];

        const result = await query(sql, values);


        if (result.insertId) {
            const news_id = result.insertId;

            // insert data to listing categories table
            if (params.category_id.length > 0) {
                const sql_meta = `INSERT INTO ${this.tableNewsCatRel} (news_id, category_id) VALUES ?`;
                const values = [];

                for (let x of params.category_id) {
                    const tmp = [news_id, x];
                    values.push(tmp);
                }

                await query2(sql_meta, [values]);

            }

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
        logger.error('printsql');

        const paramArray = [];
        const values = [];
        for (let param in params) {
            if (param != 'category_id') {
                paramArray.push(` ${param} = ?`);
                values.push(params[param]);
            }
        }
        
        paramArray.push(` updated_at = ?`);

        sql += paramArray.join(', ');

        sql += ` WHERE id = ?`;

        values.push(current_date);
        values.push(id);
        
        logger.info(sql);
        const result = await query(sql, values);

        if (result.affectedRows == 1) {
            // insert data to listing categories table
            if (params.category_id.length > 0) {

                 // first delete the existing categories
                const sql_cat_del = `DELETE FROM ${this.tableNewsCatRel} WHERE news_id = ?`;
                await query(sql_cat_del, [id]);
                
                const sql_meta = `INSERT INTO ${this.tableNewsCatRel} (news_id, category_id) VALUES ?`;
                const values = [];

                for (let x of params.category_id) {
                    const tmp = [id, x];
                    values.push(tmp);
                }

                await query2(sql_meta, [values]);

            }
        }

        return result;
    }

    getNews = async (params = {}, page = 1, limit = -1) => {
        let sql = `SELECT DISTINCT News.*
            FROM ${this.tableName} as News 
            LEFT JOIN ${this.tableNewsCatRel} as ncr ON ncr.news_id = News.id`;

        const paramArray = [];
        const values = [];

        for (let param in params) {
            if (param === 'exclude') {
                const ids = encodeURI(params.exclude.join(','));
                paramArray.push(`News.id NOT IN (${ids})`);
            } else if(param === 'category_id') {
                paramArray.push(`ncr.${param} = ?`);
                values.push(params[param])
            } else if(param === 'keyword') {
                paramArray.push(`News.title LIKE ? OR News.content LIKE ? `);
                values.push(`%${params[param]}%`);
                values.push(`%${params[param]}%`);
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

        const news =  await query(sql, values);

        if(news.length > 0){
            const news_ids = news.map((n) => n['id']);

            // get categories
            const sqlListCat = `SELECT ncr.news_id, ncr.category_id, nc.name
                                FROM ${this.tableNewsCatRel} ncr
                                JOIN ${this.tableNameCategories} nc ON ncr.category_id = nc.id   
                                WHERE ncr.news_id IN (${news_ids.join()})`;
            const categories = await query(sqlListCat);


            for (const item of news) {
                item.categories = categories.filter((c) => c.news_id == item.id);
            }
        }
        
        return news;
    }

    getSingleNews = async (params = {}) => {
        let sql = `SELECT * FROM ${this.tableName}`;

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        const result = await query(sql, [...values]);
        
        if (result.length) {
            const news_id = result[0].id;

            // fetch categories
            const sqlCat = `SELECT ncr.news_id, ncr.category_id, nc.name
                    FROM ${this.tableNewsCatRel} ncr
                    JOIN ${this.tableNameCategories} nc ON ncr.category_id = nc.id  
                    WHERE ncr.news_id = ?`;

                    result[0].categories = await query(sqlCat, [news_id]);

            result[0].comments = await this.getNewsComments(result[0].id);
        }
        
        return result;
    }

    deleteNews = async (id) => {
        const sqlCat = `DELETE FROM ${this.tableNewsCatRel} WHERE news_id=?`;
        const valuesCat = [id];

        await query(sqlCat, valuesCat);

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
        let sql = `SELECT *, (SELECT count(*) FROM ${this.tableNewsCatRel} WHERE category_id=${this.tableNameCategories}.id) as count 
            FROM ${this.tableNameCategories} 
            ORDER BY name ASC`;

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

    createNewsComment = async (params, currentUser) => {
        let output = {};

        const sql = `INSERT INTO ${this.tableNameComments} 
            (news_id, user_id, comment, parent_id) 
            VALUES (?,?,?,?)`;

        const values = [params.news_id, currentUser.id, params.comment, params.parent_id || null];

        const result = await query(sql, values);

        if (result.insertId) {
            output.status = 200

            await this.updateNewsCommentCount(params.news_id);

            const comment = await this.getNewsComment(result.insertId);
            output.data = comment[0];
        }
        else {
            output.status = 401
        }

        return output;
    }

    getNewsComments = async (newsId) => {
        let sql = `SELECT Comment.*, User.username as username, User.display_name as display_name, User.profile_photo as profile_photo 
        FROM ${this.tableNameComments} as Comment
        LEFT JOIN ${this.tableNameUsers} as User ON User.id=Comment.user_id
        WHERE Comment.news_id=?
        ORDER BY Comment.created_at ASC
        `;

        return await query(sql, [newsId]);
    }

    getNewsComment = async (commentId) => {
        let sql = `SELECT Comment.*, User.username as username, User.display_name as display_name, User.profile_photo as profile_photo 
        FROM ${this.tableNameComments} as Comment
        LEFT JOIN ${this.tableNameUsers} as User ON User.id=Comment.user_id
        WHERE Comment.id=?
        `;

        return await query(sql, [commentId]);
    }

    updateNewsComment = async (commentId, comment) => {
        let sql = `UPDATE ${this.tableNameComments} 
            SET comment = ?
            WHERE id = ?`;

        const result = await query(sql, [comment, commentId]);

        return result;
    }

    updateNewsCommentCount = async (newsId) => {
        let sql = `UPDATE ${this.tableName} 
            SET total_comments = (
                SELECT count(*) FROM ${this.tableNameComments} WHERE news_id = ?
            ) 
            WHERE id = ?`;


        const result = await query(sql, [newsId, newsId]);

        return result;
    }

    updateNewsCommentLikeCount = async (newsCommentId) => {
        let sql = `UPDATE ${this.tableNameComments} 
            SET likes = (
                SELECT count(*) FROM ${this.tableNameCommentLikes} WHERE news_comment_id = ?
            ) 
            WHERE id = ?`;


        const result = await query(sql, [newsCommentId, newsCommentId]);

        return result;
    }

    deleteNewsComment = async (commentId, newsId) => {
        const sql = `DELETE FROM ${this.tableNameComments} WHERE id=? OR parent_id=?`;
        const values = [commentId, commentId];

        await query(sql, values);
        await this.updateNewsCommentCount(newsId);
    }

    updateNewsCommentLike = async (params = {}) => {
        const news_comment_id = params.news_comment_id;
        const user_id = params.user_id;

        const data = { news_comment_id, user_id }
        const likeExist = await this.findOne(data, this.tableNameCommentLikes);

        if (Object.keys(likeExist).length > 0) {
            // delete like
            const sql = `DELETE FROM ${this.tableNameCommentLikes} WHERE id = ?`;
            await query(sql, [likeExist.id]);

            this.updateNewsCommentLikeCount(news_comment_id);
        }
        else {
            // add like
            const sql = `INSERT INTO ${this.tableNameCommentLikes} (news_comment_id, news_id, user_id) VALUES (?,?,?)`;
            const values = [news_comment_id, params.news_id, user_id];

            await query(sql, values);

            this.updateNewsCommentLikeCount(news_comment_id);
        }

        return;
    }

    getUserCommentLikes = async (userId = '') => {
        let sql = `SELECT * FROM ${this.tableNameCommentLikes} WHERE user_id = ?`;

        return await query(sql, [userId]);
    }
}

module.exports = new NewsModel;
