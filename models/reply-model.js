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

    findOne = async (params, table = `${this.tableName}`) => {
        const { columnSet, values } = multipleColumnSet(params)

        const sql = `SELECT * FROM ${table}
      WHERE ${columnSet} LIMIT 1`;

        const result = await query(sql, [...values]);

        // return back the first row
        return result[0] ? result[0] : {};

    }

    createReply = async (params, user) => {
        const current_date = commonfn.dateTimeNow();
        let output = {};

        const sql = `INSERT INTO ${this.tableName} 
            (user_id, topic_id, content, reply_to, created_at, updated_at) 
            VALUES (?,?,?,?,?,?)`;

        const values = [user.id, params.topic_id, params.content, params.reply_to, current_date, current_date];

        const result = await query(sql, values);


        if (result.insertId) {
            const reply_id = result.insertId;
            
            // get topic details 
            const topic = await this.findOne({'id': params.topic_id}, DBTables.topics);
            const t_updated_replies_no = parseInt(topic.replies_no) + 1;
            const participants = topic.participants ? JSON.parse(topic.participants) : [];
            const new_participant = user.id;
            if(participants.indexOf(new_participant) === -1) participants.push(new_participant);

            // get forum details 
            const forum = await this.findOne({'id': topic.forum_id}, DBTables.forums);
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

    deleteNews = async (id) => {
        const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
        const values = [id];

        return await query(sql, values);
    }

}

module.exports = new ReplyModel;
