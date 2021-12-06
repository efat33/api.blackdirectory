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

    createTopic = async (params, user) => {
        const current_date = commonfn.dateTimeNow();
        let slug = await commonfn.generateSlug(params.title, DBTables.topics);
        let output = {};

        const sql = `INSERT INTO ${this.tableName} 
            (user_id, forum_id, title, slug, status, notify_by_email, created_at, updated_at) 
            VALUES (?,?,?,?,?,?,?,?)`;

        const values = [user.id, params.forum_id, params.title, slug, params.status, params.notify_by_email, current_date, current_date];

        const result = await query(sql, values);


        if (result.insertId) {
            const topic_id = result.insertId;

            // get forum details 
            const forum = await this.findOne(DBTables.forums, {'id': params.forum_id});
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

        const basic_info = {
          'title': params.title,
          'forum_id': params.forum_id,
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

    deleteNews = async (id) => {
        const sql = `DELETE FROM ${this.tableName} WHERE id=?`;
        const values = [id];

        return await query(sql, values);
    }

}

module.exports = new TopicModel;
