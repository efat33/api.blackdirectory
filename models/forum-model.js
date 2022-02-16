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

    find = async (params = {}, table = `${DBTables.forums}`, orderby = '') => {
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

    createForum = async (params, user) => {
        const current_date = commonfn.dateTimeNow();
        let slug = await commonfn.generateSlug(params.title, DBTables.forums);
        let output = {};

        const sql = `INSERT INTO ${this.tableName} 
            (user_id, category_id, title, slug, description, status, created_at, updated_at) 
            VALUES (?,?,?,?,?,?,?,?)`;

        const values = [user.id, params.category_id, params.title, slug, params.description, params.status, current_date, current_date];

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
        if(params.cat_id){
            queryParams += ` AND f.category_id = ${encodeURI(params.cat_id)}`;
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

            // prepare last post data
            const topic_ids = [];
            const reply_ids = [];
            let result_replies = [];
            let result_topics = [];

            for (let index = 0; index < forums.length; index++) {
                const item = forums[index];
                if(item.last_activity_type == 'topic'){
                    topic_ids.push(item.last_activity_id);
                }
                else if(item.last_activity_type == 'reply'){
                    reply_ids.push(item.last_activity_id);
                }
            }

            if(reply_ids.length > 0){
                const sql_replies = `SELECT * FROM ${DBTables.replies} WHERE id IN (?)`;
                result_replies = await query2(sql_replies, [reply_ids]);
    
                for (let index = 0; index < result_replies.length; index++) {
                    const item = result_replies[index];
                    topic_ids.push(item.topic_id);
                }
            }
            
            if(topic_ids.length > 0){
                const sql_topics = `SELECT * FROM ${DBTables.topics} WHERE id IN (?)`;
                result_topics = await query2(sql_topics, [topic_ids]);
            }
            

            for (let index = 0; index < forums.length; index++) {
                const item = forums[index];
                if(item.last_activity_type == 'topic' && result_topics.length > 0){
                    const found = result_topics.find(element => element.id == item.last_activity_id);
                    const tmp = {
                        'topic': found,
                    }
                    forums[index]['last_post'] = tmp;
                }
                else if(item.last_activity_type == 'reply' && result_replies.length > 0){
                    const found_reply = result_replies.find(element => element.id == item.last_activity_id);
                    const found_topic = result_topics.find(element => element.id == found_reply.topic_id);
                    const tmp = {
                        'reply': found_reply,
                        'topic': found_topic,
                    }
                    forums[index]['last_post'] = tmp;
                }
            }
            
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

    deleteForum = async (forum) => {
        const current_date = commonfn.dateTimeNow();
        const forum_id = forum.id;
        const user_id = forum.user_id;

        const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
        const result = await query(sql, [forum_id]);

        if(result.affectedRows > 0){
            
             // get all the associated topic ids
            const sql_topic_ids = `SELECT id FROM ${DBTables.topics} WHERE forum_id = ?`;
            const result_topic_ids = await query(sql_topic_ids, [forum_id]);
            const topic_ids = [];
            if(result_topic_ids.length > 0){
                for (let index = 0; index < result_topic_ids.length; index++) {
                    const element = result_topic_ids[index];
                    topic_ids.push(element.id);
                }
            }

            // delete all the associate replies
            if(topic_ids.length > 0){
                const sql_delete_reply = `DELETE FROM ${DBTables.replies} WHERE topic_id IN (?)`;
                const result_delete_reply = await query2(sql_delete_reply, [topic_ids]);
            }

            // delete all the associate topics
            const sql_delete_topic = `DELETE FROM ${DBTables.topics} WHERE forum_id = ?`;
            const result_delete_topic = await query(sql_delete_topic, [forum_id]);


            // update user last activity
            const user_last_reply = await this.findOne({'user_id': user_id}, DBTables.replies, 'ORDER BY created_at DESC');
            const user_topic_last = await this.findOne({'user_id': user_id}, DBTables.topics, 'ORDER BY created_at DESC');

            let user_last_reply_time = null;
            let user_last_topic_time = null;
            let user_last_activity_time = '';

            if (Object.keys(user_last_reply).length > 0) {
                user_last_reply_time = user_last_reply.created_at;
            }
            if (Object.keys(user_topic_last).length > 0) {
                user_last_topic_time = user_topic_last.created_at;
            }

            if(user_last_reply_time && user_last_topic_time){
                const time1 = new Date(user_last_reply_time);
                const time2 = new Date(user_last_topic_time);
                
                const difference =  time1 - time2;  

                if(difference > 0){
                    user_last_activity_time = user_last_reply_time;
                }
                else{
                    user_last_activity_time = user_last_topic_time;
                }
            }
            else if(user_last_reply_time){
                user_last_activity_time = user_last_reply_time;
            }
            else if(user_last_topic_time){
                user_last_activity_time = user_last_topic_time;
            }

            // get user total topic no
            const sql_count_topic = `SELECT COUNT(id) AS user_total_topic FROM ${DBTables.topics} WHERE user_id = ?`;
            const result_count_topic = await query(sql_count_topic, [user_id]);

            let user_topic_no = 0;
            if (result_count_topic.length > 0) {
                user_topic_no = result_count_topic[0].user_total_topic;
            }
            
            // get user total reply no
            const sql_count_reply = `SELECT COUNT(id) AS user_total_reply FROM ${DBTables.replies} WHERE user_id = ?`;
            const result_count_reply = await query(sql_count_reply, [user_id]);

            let user_reply_no = 0;
            if (result_count_reply.length > 0) {
                user_reply_no = result_count_reply[0].user_total_reply;
            }

            const sqlMeta = `INSERT INTO ${DBTables.users_meta} (user_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY 
                                    UPDATE meta_value=VALUES(meta_value)`;
            const valuesMeta = [
                [user_id, 'topics_no', user_topic_no],
                [user_id, 'replies_no', user_reply_no],
                [user_id, 'forum_last_activity', user_last_activity_time]
            ];
            
            await query2(sqlMeta, [valuesMeta]);
        }

        return result;
    }

    /**
     *  Category
     * */ 

    getCategory = async (categoryId) => {
        let sql = `SELECT * FROM ${DBTables.forum_categories} WHERE id=?`;
  
        return await query(sql, [categoryId]);
    }

    newCategory = async (params) => {

        const current_date = commonfn.dateTimeNow();
        const output = {}
    
        const sql = `INSERT INTO ${DBTables.forum_categories} (title) VALUES (?)`;
        const values = [params.title];
    
        const result = await query(sql, values);
    
        if (result.insertId) {
          output.status = 200;
          output.data = result.insertId;
        }
        return output;
    }

    updateCategory = async (categoryId, params) => {
        let sql = `UPDATE ${DBTables.forum_categories} SET`;
  
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
  
    deleteCategory = async (categoryId) => {
        const sql = `DELETE FROM ${DBTables.forum_categories} WHERE id=?`;
        const values = [categoryId];
  
        return await query(sql, values);
    }

}

module.exports = new ForumModel;
