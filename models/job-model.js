const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class JobModel {
    tableName = 'jobs';
    tableNameMeta = 'job_meta';
    tableSectors = 'job_sectors';

    createJob = async (params, currentUser) => {
        const current_date = commonfn.dateTimeNow();
        const user_id = currentUser.id;
        const output = {}

        let slug = await commonfn.generateSlug(params.title, this.tableName);

        // insert data into listings table
        const sql = `INSERT INTO ${this.tableName} 
            (user_id, title, slug, description, deadline, 
            job_sector_id, job_industry, job_apply_type, experience, salary, 
            address, latitude, longitude, attachment, urgent, 
            filled, status, views, expiry_date, featured, 
            applicants_number, job_type, created_at, updated_at) 
            VALUES (?,?,?,?,?,
            ?,?,?,?,?,
            ?,?,?,?,?,
            ?,?,?,?,?,
            ?,?,?,?)`;

        const result = await query(sql, [user_id, params.title, slug, params.description, params.deadline,
            params.job_sector_id, params.job_industry, params.job_apply_type, params.experience, params.salary,
            params.address, params.latitude, params.longitude, params.attachment, 0,
            0, 'approved', 0, params.expiry_date, 0,
            0, params.job_type, current_date, current_date]);


        if (result.insertId) {
            const job_id = result.insertId;

            // insert data into listings table
            const meta_sql = `INSERT INTO ${this.tableNameMeta} 
                (job_id, meta_key, meta_value)
                VALUES ?`;

            const meta_values = [];

            if (params.job_apply_email) {
                meta_values.push([job_id, 'job_apply_email', params.job_apply_email]);
            }
            
            if (params.external_url) {
                meta_values.push([job_id, 'external_url', params.external_url]);
            }

            if (meta_values.length > 0) {
                await query2(meta_sql, [meta_values]);
            }

            output.status = 200
            output.data = { 'job_id': job_id, 'slug': slug }
        }
        else {
            output.status = 401
        }

        return output;
    }

    updateJob = async (params) => {
        const current_date = commonfn.dateTimeNow();

        const sql = `UPDATE ${this.tableName} 
            SET title = ?, 
                description = ?, 
                deadline = ?, 
                job_sector_id = ?, 
                job_industry = ?, 
                job_apply_type = ?, 
                experience = ?, 
                salary = ?, 
                address = ?, 
                latitude = ?, 
                longitude = ?, 
                attachment = ?, 
                job_type = ?, 
                updated_at = ? 
            WHERE id = ${params.id}`;

        const values = [
            params.title,
            params.description,
            params.deadline,
            params.job_sector_id,
            params.job_industry,
            params.job_apply_type,
            params.experience,
            params.salary,
            params.address,
            params.latitude,
            params.longitude,
            params.attachment,
            params.job_type,
            current_date,
        ];

        const result = await query(sql, values);

        const meta_sql = `INSERT INTO ${this.tableNameMeta} (job_id, meta_key, meta_value) VALUES ? ON DUPLICATE KEY UPDATE meta_value=VALUES(meta_value)`;
        const meta_values = [];

        if (params.job_apply_email) {
            meta_values.push([params.id, 'job_apply_email', params.job_apply_email]);
        }
        
        if (params.external_url) {
            meta_values.push([params.id, 'external_url', params.external_url]);
        }
        
        await query2(meta_sql, [meta_values]);

        return result;
    }

    getJobs = async (params = {}) => {
        let sql = `SELECT Job.id as id, Job.title as title, Job.slug as slug, Job.deadline as deadline, 
        JobSector.title as job_sector, Job.filled as filled, Job.status as status, Job.views as views, 
        Job.expiry_date as expiry_date, Job.featured as featured, Job.applicants_number as applicants_number,
        Job.created_at as created_at  
        FROM ${this.tableName} as Job 
        LEFT JOIN ${this.tableSectors} as JobSector ON Job.job_sector_id=JobSector.id 
        `;

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        sql += ` ORDER BY Job.created_at DESC`;

        return await query(sql, [...values]);
    }

    getJob = async (params = {}) => {
        let sql = `SELECT * FROM ${this.tableName}`;

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        const result = await query(sql, [...values]);

        if (result.length > 0) {
            let meta_sql = `SELECT * FROM ${this.tableNameMeta} WHERE job_id = ?`;
            let result_meta = await query(meta_sql, [result[0].id]);

            result[0]['job_meta'] = commonfn.generateMetaObject(result_meta);
        }

        return result;
    }

    getSectors = async () => {
        const sql = `SELECT * FROM ${this.tableSectors} ORDER BY title`;
        const result = await query(sql);

        return result;
    }

    getSector = async (params = {}) => {
        let sql = `SELECT * FROM ${this.tableSectors}`;

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        return await query(sql, [...values]);
    }

    deleteJob = async (id) => {
        const sql = `DELETE FROM ${this.tableName} WHERE id IN (?)`;

        return await query(sql, [id]);
    }
}

module.exports = new JobModel;