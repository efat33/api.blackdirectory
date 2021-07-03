const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class JobModel {
    tableName = 'jobs';
    tableNameMeta = 'jobs_meta';
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

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        return await query(sql, [...values]);
    }

    getSectors = async () => {
        const sql = `SELECT * FROM ${this.tableSectors} ORDER BY title`;
        const result = await query(sql);

        return result;
    }

    deleteJob = async (id) => {
        const sql = `DELETE FROM ${this.tableName} WHERE id IN (?)`;

        return await query(sql, [id]);
    }
}

module.exports = new JobModel;