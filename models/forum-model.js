const { query, query2 } = require('../server');
const { multipleColumnSet, DBTables } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class ForumModel {
    tableName = 'forums';
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

    createForum = async (params, user) => {
        const current_date = commonfn.dateTimeNow();
        let slug = await commonfn.generateSlug(params.title, DBTables.forums);
        let output = {};

        const sql = `INSERT INTO ${this.tableName} 
            (user_id, title, slug, description, status, created_at, updated_at) 
            VALUES (?,?,?,?,?,?,?)`;

        const values = [user.id, params.title, slug, params.description, params.status, current_date, current_date];

        const result = await query(sql, values);


        if (result.insertId) {
            const forum_id = result.insertId;

            output.status = 200
            output.data = { forum_id, slug }
        }
        else {
            output.status = 401
        }

        return output;
    }

    updateForum = async (id, params) => {
        const current_date = commonfn.dateTimeNow();

        const basic_info = {
          'title': params.title,
          'description': params.description,
          'status': params.status,
          'updated_at': current_date
        }
        
        const basic_colset = multipleColumnSet(basic_info, ',');
        
        const sql = `UPDATE ${DBTables.forums} SET ${basic_colset.columnSet} WHERE id = ?`;
        
        const result = await query(sql, [...basic_colset.values, id]);

        return result;
    }

    getForums = async (params = {}) => {
        const keyword = params.keyword ? params.keyword : '';


        const output = {}
        let values = [];

        let sql = `SELECT f.*, u.username, u.display_name FROM ${DBTables.forums} AS f LEFT JOIN ${DBTables.users} u ON f.user_id = u.id`;
        let queryParams = ` WHERE 1=1`;

        if(params.user_id){
            queryParams += ` AND f.user_id = ${encodeURI(params.user_id)}`;
        }
        if (keyword != '') {
            queryParams += ` AND ( f.title LIKE '%${encodeURI(keyword)}%' OR f.description LIKE '%${encodeURI(keyword)}%' )`;
        }
        if(params.status){
            queryParams += ` AND f.status = '${encodeURI(params.status)}'`;
        }

        let queryOrderby = ` ORDER BY f.created_at DESC`;

        let queryLimit = '';
        if(params.limit && params.limit == -1){
            queryLimit = ` `;
        }
        else if(params.page && params.page != '' && (params.limit && params.limit != -1)){
            const offset = (params.page - 1) * params.limit;
            queryLimit = ` LIMIT ?, ?`;
            values.push(offset);
            values.push(params.limit);
        }
        else{
            queryLimit = ` LIMIT 0, 12`;
        }

        const count_sql = `${sql}${queryParams}${queryOrderby}`;
        sql += `${queryParams}${queryOrderby}${queryLimit}`;

        // console.log(sql);
        const forums = await query(sql, values);
        let total_forums = 0;

        if(forums.length > 0){

            const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
            const resultCount = await query(count_sql_final, values);
            
            total_forums = resultCount[0].count;

        }

        output.status = 200;
        const data = {
            forums: forums,
            total_forums: total_forums
        }
        output.data = data;
        return output;
    }

    getSingleForum = async (params = {}) => {
        let sql = `SELECT News.*, NewsCategories.name as category 
            FROM ${this.tableName} as News
            LEFT JOIN ${this.tableNameCategories} as NewsCategories ON NewsCategories.id=News.category_id
            `;

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        const result = await query(sql, [...values]);

        if (result.length) {
            result[0].comments = await this.getNewsComments(result[0].id);
        }

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

module.exports = new ForumModel;
