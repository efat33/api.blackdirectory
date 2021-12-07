const { query, query2 } = require('../server');
const { multipleColumnSet, DBTables } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class ReplyModel {
    tableName = 'replies';
    tableNameComments = 'news_comments';
    tableNameCategories = 'news_categories';
    tableNameTopNews = 'news_top_news';
    tableNameComments = 'news_comments';
    tableNameCommentLikes = 'news_comment_likes';

    tableNameUsers = 'users';

    findOne = async (params, table = `${this.tableName}`, orderby = '') => {
        const { columnSet, values } = multipleColumnSet(params)

        let sql = `SELECT * FROM ${table} WHERE ${columnSet}`;

        if (orderby != '') sql += ` ${orderby}`;

        sql += ` LIMIT 1`;

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

    createReply = async (params, user) => {
        const current_date = commonfn.dateTimeNow();
        let output = {};

        // get topic details 
        const topic = await this.findOne({'id': params.topic_id}, DBTables.topics);

        // get forum details 
        const forum = await this.findOne({'id': topic.forum_id}, DBTables.forums);

        const sql = `INSERT INTO ${this.tableName} 
            (user_id, forum_id, topic_id, category_id, content, reply_to, created_at, updated_at) 
            VALUES (?,?,?,?,?,?,?,?)`;

        const values = [user.id, params.forum_id, params.topic_id, forum.category_id, params.content, params.reply_to, current_date, current_date];

        const result = await query(sql, values);


        if (result.insertId) {
            const reply_id = result.insertId;
            
            // update topic table data
            const t_updated_replies_no = parseInt(topic.replies_no) + 1;
            const participants = topic.participants ? JSON.parse(topic.participants) : [];
            const new_participant = user.id;
            if(participants.indexOf(new_participant) === -1) participants.push(new_participant);

            // update forum reply number
            const updated_replies_no = parseInt(forum.replies_no) + 1;

            /**
             * forum table : update -> last post data, topics_no, replies_no
             * */ 
            const uData_forum = {
              'last_activity_id': reply_id,
              'last_activity_time': current_date,
              'last_activity_type': 'reply',
              'replies_no': updated_replies_no,
              'updated_at': current_date
            }
            
            const uColset_forum = multipleColumnSet(uData_forum, ',');
            
            const sql = `UPDATE ${DBTables.forums} SET ${uColset_forum.columnSet} WHERE id = ?`;
            await query(sql, [...uColset_forum.values, topic.forum_id]);

            /**
             * topic table : update -> last post data, participants, replies_no
             * */ 
            const uData_topic = {
                'last_activity_id': reply_id,
                'last_activity_time': current_date,
                'participants': JSON.stringify(participants),
                'replies_no': t_updated_replies_no,
                'updated_at': current_date
              }
              
              const uColset_topic = multipleColumnSet(uData_topic, ',');
              
              const sql_topic = `UPDATE ${DBTables.topics} SET ${uColset_topic.columnSet} WHERE id = ?`;
              await query(sql_topic, [...uColset_topic.values, params.topic_id]);


            /**
             * update reply_notifications table 
             * */   
            if(params.notify_by_email){
                // get forum details 
                const user_details = await this.findOne({'id': user.id}, DBTables.users);

                const sql = `INSERT INTO ${DBTables.reply_notifications} (topic_id, user_id, user_email) VALUES ? ON DUPLICATE KEY 
                                        UPDATE user_email=VALUES(user_email)`;
                const values = [
                    [params.topic_id, user.id, user_details.email]
                ];
                
                await query2(sql, [values]);
            }

            // get user meta  
            const user_meta = await this.find({'user_id': user.id}, DBTables.users_meta);

            /**
             * user_meta table : update -> replies_no, forum_last_activity
             * */ 
            let user_replies_no = 1;
            const current_reply_no = user_meta.find(element => element.meta_key == 'replies_no');
            if (current_reply_no && Object.keys(current_reply_no).length > 0) {
                user_replies_no = parseInt(current_reply_no.meta_value) + 1;
            }

            const sqlMeta = `INSERT INTO ${DBTables.users_meta} (user_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY 
                                    UPDATE meta_value=VALUES(meta_value)`;
            const valuesMeta = [
                [user.id, 'replies_no', user_replies_no],
                [user.id, 'forum_last_activity', current_date]
            ];
            
            await query2(sqlMeta, [valuesMeta]);

            output.status = 200
            output.data = { reply_id }
        }
        else {
            output.status = 401
        }

        return output;
    }

    updateReply = async (id, params) => {
        const current_date = commonfn.dateTimeNow();

        const basic_info = {
          'content': params.content,
          'updated_at': current_date
        }
        
        const basic_colset = multipleColumnSet(basic_info, ',');
        
        const sql = `UPDATE ${DBTables.replies} SET ${basic_colset.columnSet} WHERE id = ?`;
        
        const result = await query(sql, [...basic_colset.values, id]);

        return result;
    }

    getReplies = async (params = {}) => {
        const keyword = params.keyword ? params.keyword : '';


        const output = {}
        let values = [];
        let topic = '';

        let sql = `SELECT r.*, u.username, u.display_name, u.profile_photo FROM ${DBTables.replies} AS r 
                    LEFT JOIN ${DBTables.users} u ON r.user_id = u.id`;

        let queryParams = ` WHERE 1=1`;

        if(params.user_id){
            queryParams += ` AND r.user_id = ${encodeURI(params.user_id)}`;
        }
        if (keyword != '') {
            queryParams += ` AND ( r.content LIKE '%${encodeURI(keyword)}%'`;
        }

        if(params.slug){
            // get forum details
            const topic_found = await this.findOne({'slug': params.slug}, DBTables.topics);
            if (Object.keys(topic_found).length > 0) {
                topic = topic_found;
                queryParams += ` AND r.topic_id = ${encodeURI(topic.id)}`;
            }
            
        }

        let queryOrderby = ` ORDER BY r.created_at ASC`;

        let queryLimit = '';
        

        const count_sql = `${sql}${queryParams}${queryOrderby}`;
        sql += `${queryParams}${queryOrderby}${queryLimit}`;

        // console.log(sql);
        const replies = await query(sql, values);
        let total_replies = 0;

        if(replies.length > 0){

            const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
            const resultCount = await query(count_sql_final, values);
            
            total_replies = resultCount[0].count;

        }

        output.status = 200;
        const data = {
            replies: replies,
            total_replies: total_replies,
            topic: topic
        }
        output.data = data;
        return output;
    }

    getUserReplies = async (params = {}) => {
        const keyword = params.keyword ? params.keyword : '';

        const output = {}
        let values = [];
        let topic = '';

        let sql = `SELECT r.*, u.username, u.display_name, u.profile_photo FROM ${DBTables.replies} AS r 
                    LEFT JOIN ${DBTables.users} u ON r.user_id = u.id`;

        let queryParams = ` WHERE 1=1`;

        if(params.user_id){
            queryParams += ` AND r.user_id = ${encodeURI(params.user_id)}`;
        }
        if (keyword != '') {
            queryParams += ` AND ( r.content LIKE '%${encodeURI(keyword)}%'`;
        }

        let queryOrderby = ` ORDER BY r.created_at ASC`;

        let queryLimit = '';
        

        const count_sql = `${sql}${queryParams}${queryOrderby}`;
        sql += `${queryParams}${queryOrderby}${queryLimit}`;

        // console.log(sql);
        const replies = await query(sql, values);
        let total_replies = 0;

        if(replies.length > 0){
            const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
            const resultCount = await query(count_sql_final, values);
            
            total_replies = resultCount[0].count;

            const topic_ids = [];
            for (let index = 0; index < replies.length; index++) {
                const item = replies[index];
                if(topic_ids.indexOf(item.topic_id) === -1){
                    topic_ids.push(item.topic_id)
                }
            }

            const sql_topics = `SELECT * FROM ${DBTables.topics} WHERE id IN (?)`;
            const topics = await query2(sql_topics, [topic_ids]);
            
            for (let index = 0; index < replies.length; index++) {
                replies[index].topic = topics.find(element => element.id == replies[index].topic_id);
            }
        }
        output.status = 200;
        const data = {
            replies: replies,
            total_replies: total_replies
        }
        output.data = data;
        return output;
    }

    deleteReply = async (reply) => {
        const current_date = commonfn.dateTimeNow();
        const reply_id = reply.id;
        const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
        const values = [reply_id];

        const result = await query(sql, values);

        if(result.affectedRows > 0){
            // get topic details 
            const topic = await this.findOne({'id': reply.topic_id}, DBTables.topics);
            let t_updated_replies_no = 0;
            if(topic.replies_no > 0){
                t_updated_replies_no = parseInt(topic.replies_no) - 1;
            }

            // check any reply available with the same user  |  get the last reply of the same user
            const user_replies = await this.find({'user_id': reply.user_id}, DBTables.replies, 'ORDER BY created_at DESC');
            const user_topic_last = await this.findOne({'user_id': reply.user_id}, DBTables.topics, 'ORDER BY created_at DESC');

            let participants = topic.participants ? JSON.parse(topic.participants) : [];
            let removeReplyNotification = false;
            if(user_replies.length === 0){
                if (participants.indexOf(reply.user_id) !== -1) {
                    participants.splice(reply.user_id, 1);

                    removeReplyNotification = true;
                }
            }

            let user_last_reply_time = null;
            let user_last_topic_time = null;
            let user_last_activity_time = null;

            if(user_replies.length > 0){
                user_last_reply_time = user_replies[0].created_at;
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
            if(forum.replies_no > 0){
                updated_replies_no = parseInt(forum.replies_no) - 1;
            }

             /**
             * forum table : update -> last post data, topics_no, replies_no
             * */ 
            const uData_forum = {
                'last_activity_id': forum_last_activity_id,
                'last_activity_time': forum_last_activity_time,
                'last_activity_type': forum_last_activity_type,
                'replies_no': updated_replies_no,
                'updated_at': current_date
            }
              
            const uColset_forum = multipleColumnSet(uData_forum, ',');
            
            const sql = `UPDATE ${DBTables.forums} SET ${uColset_forum.columnSet} WHERE id = ?`;
            await query(sql, [...uColset_forum.values, topic.forum_id]);
  

            // get topic last reply 
            const topic_last_reply = await this.findOne({'topic_id': reply.topic_id}, DBTables.replies, 'ORDER BY created_at DESC');
            let topic_last_reply_time = null;
            let topic_last_activity_id = null;
            let topic_last_activity_time = null;

            if (Object.keys(topic_last_reply).length > 0) {
                topic_last_reply_time = topic_last_reply.created_at;
            }
            if(topic_last_reply_time){
                topic_last_activity_id = topic_last_reply.id;
                topic_last_activity_time = topic_last_reply_time;
            }

            /**
             * topic table : update -> last post data, participants, replies_no
             * */ 
            const uData_topic = {
                'last_activity_id': topic_last_activity_id,
                'last_activity_time': topic_last_activity_time,
                'participants': JSON.stringify(participants),
                'replies_no': t_updated_replies_no,
                'updated_at': current_date
            }
            
            const uColset_topic = multipleColumnSet(uData_topic, ',');
            
            const sql_topic = `UPDATE ${DBTables.topics} SET ${uColset_topic.columnSet} WHERE id = ?`;
            await query(sql_topic, [...uColset_topic.values, reply.topic_id]);

            // remove user from notification table
            if(removeReplyNotification){
                const sql = `DELETE FROM ${DBTables.reply_notifications} WHERE topic_id=? AND user_id=?`;
                const values = [reply.topic_id, reply.user_id];
        
                await query(sql, values);
            }

            /**
             * user_meta table : update -> replies_no, forum_last_activity
             * */ 
            let user_replies_no = user_replies.length;

            const sqlMeta = `INSERT INTO ${DBTables.users_meta} (user_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY 
                                    UPDATE meta_value=VALUES(meta_value)`;
            const valuesMeta = [
                [reply.user_id, 'replies_no', user_replies_no],
                [reply.user_id, 'forum_last_activity', user_last_activity_time]
            ];
            
            await query2(sqlMeta, [valuesMeta]);
            
        }

        return result;
    }

}

module.exports = new ReplyModel;
