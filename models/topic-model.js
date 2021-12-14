const { query, query2 } = require('../server');
const { multipleColumnSet, DBTables } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class TopicModel {
    tableName = 'topics';
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

    find = async (params = {}, table = `${DBTables.replies}`, orderby = '') => {
        let sql = `SELECT * FROM ${table}`;
    
        if (!Object.keys(params).length) {
          return await query(sql);
        }
    
        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;
    
        if (orderby != '') sql += ` ${orderby}`;
    
        return await query(sql, [...values]);
    }

    createTopic = async (params, user) => {
        const current_date = commonfn.dateTimeNow();
        let slug = await commonfn.generateSlug(params.title, DBTables.topics);
        let output = {};

        // get forum details 
        const forum = await this.findOne({'id': params.forum_id}, DBTables.forums );

        const sql = `INSERT INTO ${this.tableName} 
            (user_id, forum_id, category_id, title, slug, status, notify_by_email, created_at, updated_at) 
            VALUES (?,?,?,?,?,?,?,?,?)`;

        const values = [user.id, params.forum_id, forum.category_id, params.title, slug, params.status, params.notify_by_email, current_date, current_date];

        const result = await query(sql, values);


        if (result.insertId) {
            const topic_id = result.insertId;

            const updated_topic_no = forum.topics_no + 1;
            
            // forum table : update -> last post data, topics_no
            const basic_info = {
              'last_activity_id': topic_id,
              'last_activity_time': current_date,
              'last_activity_type': 'topic',
              'topics_no': updated_topic_no,
              'updated_at': current_date
            }
            
            const basic_colset = multipleColumnSet(basic_info, ',');
            
            const sql = `UPDATE ${DBTables.forums} SET ${basic_colset.columnSet} WHERE id = ?`;
            await query(sql, [...basic_colset.values, params.forum_id]);

            // get user meta  
            const user_meta = await this.find({'user_id': user.id}, DBTables.users_meta);

            /**
             * user_meta table : update -> replies_no, forum_last_activity
             * */ 
            let user_topics_no = 1;
            const current_topics_no = user_meta.find(element => element.meta_key == 'topics_no');
            if (current_topics_no && Object.keys(current_topics_no).length > 0) {
                user_topics_no = parseInt(current_topics_no.meta_value) + 1;
            }

            const sqlMeta = `INSERT INTO ${DBTables.users_meta} (user_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY 
                                    UPDATE meta_value=VALUES(meta_value)`;
            const valuesMeta = [
                [user.id, 'topics_no', user_topics_no],
                [user.id, 'forum_last_activity', current_date]
            ];
            
            await query2(sqlMeta, [valuesMeta]);

            output.status = 200
            output.data = { topic_id, slug }
        }
        else {
            output.status = 401
        }

        return output;
    }

    updateTopic = async (id, params) => {
        const current_date = commonfn.dateTimeNow();

        // get forum details 
        const forum = await this.findOne({'id': params.forum_id}, DBTables.forums );

        const basic_info = {
          'title': params.title,
          'forum_id': params.forum_id,
          'category_id': forum.category_id,
          'status': params.status,
          'notify_by_email': params.notify_by_email,
          'updated_at': current_date
        }
        
        const basic_colset = multipleColumnSet(basic_info, ',');
        
        const sql = `UPDATE ${DBTables.topics} SET ${basic_colset.columnSet} WHERE id = ?`;
        
        const result = await query(sql, [...basic_colset.values, id]);

        return result;
    }

    getTopics = async (params = {}) => {
        const keyword = params.keyword ? params.keyword : '';


        const output = {}
        let values = [];
        let forum = '';

        let sql = `SELECT t.*, u.username, u.display_name, f.title as forum_title FROM ${DBTables.topics} AS t LEFT JOIN ${DBTables.users} u ON t.user_id = u.id 
                    LEFT JOIN ${DBTables.forums} f ON f.id = t.forum_id`;

        let queryParams = ` WHERE 1=1`;

        if(params.user_id){
            queryParams += ` AND t.user_id = ${encodeURI(params.user_id)}`;
        }
        if (keyword != '') {
            queryParams += ` AND ( t.title LIKE '%${encodeURI(keyword)}%' OR t.description LIKE '%${encodeURI(keyword)}%' )`;
        }
        if(params.status){
            queryParams += ` AND t.status = '${encodeURI(params.status)}'`;
        }
        if(params.slug){
            // get forum details
            const forum_found = await this.findOne({'slug': params.slug}, DBTables.forums);
            if (Object.keys(forum_found).length > 0) {
                forum = forum_found;
                queryParams += ` AND t.forum_id = ${encodeURI(forum.id)}`;
            }
        }
        if(params.cat_id){
            queryParams += ` AND t.category_id = ${encodeURI(params.cat_id)}`;
        }

        let queryOrderby = ` ORDER BY t.created_at DESC`;

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
        const topics = await query(sql, values);
        let total_topics = 0;

        if(topics.length > 0){

            const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
            const resultCount = await query(count_sql_final, values);
            
            total_topics = resultCount[0].count;

        }

        output.status = 200;
        const data = {
            topics: topics,
            total_topics: total_topics,
            forum: forum
        }
        output.data = data;
        return output;
    }

    deleteTopic = async (topic) => {
        const current_date = commonfn.dateTimeNow();
        const topic_id = topic.id;
        const forum_id = topic.forum_id;
        const user_id = topic.user_id;
        
        const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
        const values = [topic_id];

        const result = await query(sql, values);

        if(result.affectedRows > 0){
            // delete all the associate replies
            const sql_delete_reply = `DELETE FROM ${DBTables.replies} WHERE topic_id = ?`;
            const result_delete_reply = await query(sql_delete_reply, [topic_id]);

            const no_of_deleted_reply = result_delete_reply.affectedRows;

            // get forum last topic and reply 
            const forum_last_topic = await this.findOne({'forum_id': topic.forum_id}, DBTables.topics, 'ORDER BY created_at DESC');
            const forum_last_reply = await this.findOne({'forum_id': topic.forum_id}, DBTables.replies, 'ORDER BY created_at DESC');
            let forum_last_topic_time = null;
            let forum_last_reply_time = null;
            let forum_last_activity_time = null;
            let forum_last_activity_id = null;
            let forum_last_activity_type = null;

            if (Object.keys(forum_last_topic).length > 0) {
                forum_last_topic_time = forum_last_topic.created_at;
            }
            if (Object.keys(forum_last_reply).length > 0) {
                forum_last_reply_time = forum_last_reply.created_at;
            }

            if(forum_last_topic_time && forum_last_reply_time){
                const time1 = new Date(forum_last_topic_time);
                const time2 = new Date(forum_last_reply_time);
                
                const difference =  time1 - time2;  

                if(difference > 0){
                    forum_last_activity_time = forum_last_topic_time;
                    forum_last_activity_id = forum_last_topic.id;
                    forum_last_activity_type = 'topic';
                }
                else{
                    forum_last_activity_time = forum_last_reply_time;
                    forum_last_activity_id = forum_last_reply.id;
                    forum_last_activity_type = 'reply';
                }
            }
            else if(forum_last_topic_time){
                forum_last_activity_time = forum_last_topic_time;
                forum_last_activity_id = forum_last_topic.id;
                forum_last_activity_type = 'topic';
            }
            else if(user_last_topic_time){
                forum_last_activity_time = forum_last_reply_time;
                forum_last_activity_id = forum_last_reply.id;
                forum_last_activity_type = 'reply';
            }

            // get forum details 
            const forum = await this.findOne({'id': topic.forum_id}, DBTables.forums);
            let updated_replies_no = 0;
            let updated_topic_no = 0;
            if(forum.replies_no > 0){
                updated_replies_no = parseInt(forum.replies_no) - parseInt(no_of_deleted_reply);
            }
            if(forum.topics_no > 0){
                updated_topic_no = parseInt(forum.topics_no) - 1;
            }

             /**
             * forum table : update -> last post data, topics_no, replies_no
             * */ 
            const uData_forum = {
                'last_activity_id': forum_last_activity_id,
                'last_activity_time': forum_last_activity_time,
                'last_activity_type': forum_last_activity_type,
                'replies_no': updated_replies_no >= 0 ? updated_replies_no : 0,
                'topics_no': updated_topic_no,
                'updated_at': current_date
            }
              
            const uColset_forum = multipleColumnSet(uData_forum, ',');
            
            const sql = `UPDATE ${DBTables.forums} SET ${uColset_forum.columnSet} WHERE id = ?`;
            await query(sql, [...uColset_forum.values, topic.forum_id]);


            // update user last activity
            const user_last_reply = await this.findOne({'user_id': user_id}, DBTables.replies, 'ORDER BY created_at DESC');
            const user_topic_last = await this.findOne({'user_id': user_id}, DBTables.topics, 'ORDER BY created_at DESC');

            let user_last_reply_time = null;
            let user_last_topic_time = null;
            let user_last_activity_time = null;

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

}

module.exports = new TopicModel;
