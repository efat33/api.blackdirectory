const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class JobModel {
    tableName = 'jobs';
    tableNameMeta = 'job_meta';
    tableSectors = 'job_sectors';
    tableJobApplications = 'job_applications';
    tableJobNotifications = 'job_notifications';
    tableSavedCandidates = 'job_saved_candidates';
    tableFavoriteJobs = 'job_favorites';
    tableJobPackages = 'job_packages';
    tableJobPackagePrices = 'job_package_prices';
    tableUsers = 'users';
    tableUsersMeta = 'users_meta';

    createJob = async (params, currentUser) => {
        const current_date = commonfn.dateTimeNow();
        const user_id = currentUser.id;
        const output = {}

        const currentPackage = await this.getCurrentPackage(currentUser);

        const date = new Date();
        const expiry_date = commonfn.dateTime(new Date(date.setDate(date.getDate() + parseInt(currentPackage.currentPackage.job_expiry || 14))));

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

        const result = await query(sql, [user_id, params.title, slug, params.description, new Date(params.deadline),
            params.job_sector_id, params.job_industry, params.job_apply_type, params.experience, params.salary,
            params.address, params.latitude, params.longitude, params.attachment, 0,
            0, 'approved', 0, expiry_date, 0,
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
            new Date(params.deadline),
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

        if (meta_values.length) {
            await query2(meta_sql, [meta_values]);
        }

        return result;
    }

    getJobs = async (params, page = 1, limit = 10) => {
        let { sql, values } = this.getJobSqlGenerate(params);

        sql += ` ORDER BY Job.created_at DESC`;

        sql += ` LIMIT ${limit} OFFSET ${limit * (page - 1)}`;

        return await query(sql, [...values]);
    }

    getJobSqlGenerate(params = {}) {
        let {
            status = 'approved',
            datePosted = null,
            jobType = null,
            keyword = null,
            loc_radius = 50,
            latitude = null,
            longitude = null,
            salary = null,
            sector = null
        } = params;

        let sql = `SELECT Job.id as id, Job.title as title, Job.slug as slug, Job.job_type as job_type, 
                JobSector.title as job_sector, Job.filled as filled, Job.address as address, 
                Users.username as username, Users.display_name as user_display_name, Users.profile_photo as user_profile_photo, 
                Job.created_at as created_at 
                FROM ${this.tableName} as Job 
                LEFT JOIN ${this.tableSectors} as JobSector ON Job.job_sector_id=JobSector.id 
                LEFT JOIN ${this.tableUsers} as Users ON Job.user_id=Users.id 
                `;

        if (latitude && longitude) {
            sql = `SELECT Job.id as id, Job.title as title, Job.slug as slug, Job.job_type as job_type, 
                        JobSector.title as job_sector, Job.filled as filled, Job.address as address, 
                        Users.username as username, Users.display_name as user_display_name, Users.profile_photo as user_profile_photo, 
                        Job.created_at as created_at, 
                        ( 6371 * acos( cos( radians('${latitude}') ) * cos( radians( Job.latitude ) ) * cos( radians( Job.longitude ) - radians('${longitude}') ) + sin( radians('${latitude}') ) * sin( radians( Job.latitude ) ) ) ) as listing_distance 
                        FROM ${this.tableName} as Job 
                        LEFT JOIN ${this.tableSectors} as JobSector ON Job.job_sector_id=JobSector.id 
                        LEFT JOIN ${this.tableUsers} as Users ON Job.user_id=Users.id 
                        `;
        }

        const values = [];
        const conditions = [];

        conditions.push('Job.expiry_date > CURDATE()');
        conditions.push('Job.filled = 0');

        if (status) {
            conditions.push('Job.status = ?');
            values.push(status)
        }

        if (keyword) {
            conditions.push(`(Job.title LIKE '%${keyword}%' OR Job.description LIKE '%${keyword}%')`);
        }

        if (jobType) {
            conditions.push('Job.job_type = ?');
            values.push(jobType)
        }

        if (sector) {
            conditions.push('Job.job_sector_id = ?');
            values.push(sector)
        }

        if (salary) {
            conditions.push('(Job.salary >= ? AND Job.salary <= ?)');
            values.push(salary[0]);
            values.push(salary[1]);
        }

        sql += ' WHERE ' + conditions.join(' AND ');

        if (datePosted) {
            if (datePosted === '1hour') {
                sql += ' AND Job.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) AND Job.created_at <= NOW()';
            }
            else if (datePosted === '24hours') {
                sql += ' AND Job.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY) AND Job.created_at <= NOW()';
            }
            else if (datePosted === '7days') {
                sql += ' AND Job.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) AND Job.created_at <= NOW()';
            }
            else if (datePosted === '14days') {
                sql += ' AND Job.created_at > DATE_SUB(NOW(), INTERVAL 14 DAY) AND Job.created_at <= NOW()';
            }
            else if (datePosted === '30days') {
                sql += ' AND Job.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY) AND Job.created_at <= NOW()';
            }
        }

        if (latitude && longitude) {
            sql += ` HAVING listing_distance < ?`
            values.push(loc_radius);
        }

        return { sql, values };
    }

    getJobCount = async (params = {}) => {
        let { sql, values } = this.getJobSqlGenerate(params, true);

        sql = `SELECT COUNT(*) as count FROM (${sql}) as custom_table`;

        return await query(sql, [...values]);
    }

    updateJobProperty = async (id, params = {}) => {
        const current_date = commonfn.dateTimeNow();
        const sqlParamsArr = [];
        const values = [];

        Object.entries(params).forEach( ([key, val]) => {
            sqlParamsArr.push(`${key} = ?`);
            values.push(val);
        });
        
        sqlParamsArr.push(`updated_at = ?`);
        values.push(current_date);

        const sqlParams = sqlParamsArr.join(',');
        
        const sql = `UPDATE ${this.tableName} SET ${sqlParams} WHERE id=?`;
        values.push(id);

        return await query(sql, values);
    }

    getUserJobs = async (params = {}) => {
        let sql = `SELECT Job.id as id, Job.title as title, Job.slug as slug, Job.deadline as deadline, Job.job_apply_type as job_apply_type, 
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

    getJobsByIds = async (jobIds) => {
        const sql = `SELECT * FROM ${this.tableName} WHERE id IN (?)`;

        return await query2(sql, [jobIds]);
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


    createJobApplication = async (params, currentUser) => {
        const current_date = commonfn.dateTimeNow();
        const user_id = currentUser.id;
        const output = {}

        // insert data into listings table
        const sql = `INSERT INTO ${this.tableJobApplications} 
            (job_id, user_id, employer_id, cover_letter, shortlisted, rejected, viewed, created_at) 
            VALUES (?,?,?,?,?,?,?,?)`;

        const values = [params.job_id, user_id, params.employer_id, params.cover_letter, 0, 0, 0, current_date];

        const result = await query(sql, values);

        if (result.insertId) {
            output.status = 200

            const sqlIncrementTotal = `UPDATE ${this.tableName} SET applicants_number = applicants_number + 1 WHERE id = ?`;
            await query(sqlIncrementTotal, [params.job_id]);
        }
        else {
            output.status = 401
        }

        return output;
    }

    getJobApplications = async (params = {}) => {
        let sql = `SELECT Applications.*, Jobs.title as job_title, 
            Users.username as user_username, Users.display_name as user_display_name, 
            Users.email as user_email, Users.profile_photo as user_profile_photo  
            FROM ${this.tableJobApplications} as Applications
            LEFT JOIN ${this.tableUsers} as Users ON Users.id=Applications.user_id 
            LEFT JOIN ${this.tableName} as Jobs ON Jobs.id=Applications.job_id 
        `;

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE Jobs.job_apply_type='internal' AND ${columnSet}`;

        sql += ` ORDER BY created_at DESC`;

        return await query(sql, [...values]);
    }

    getJobApplication = async (application_id) => {
        let sql = `SELECT * 
            FROM ${this.tableJobApplications} 
            WHERE id=?
        `;

        return await query(sql, [application_id]);
    }

    getAppliedJobs = async (params = {}) => {
        let sql = `SELECT Jobs.title as job_title, Jobs.slug as slug, JobSector.title as job_sector, 
            Users.username as employer_username, Users.display_name as employer_display_name, Users.profile_photo as employer_profile_photo, 
            Applications.created_at as applied_at 
            FROM ${this.tableJobApplications} as Applications
            LEFT JOIN ${this.tableUsers} as Users ON Users.id=Applications.employer_id 
            LEFT JOIN ${this.tableName} as Jobs ON Jobs.id=Applications.job_id 
            LEFT JOIN ${this.tableSectors} as JobSector ON Jobs.job_sector_id=JobSector.id 
        `;

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        sql += ` ORDER BY applied_at DESC`;

        return await query(sql, [...values]);
    }

    getUserJobApplication = async (params = {}) => {
        let sql = `SELECT * FROM ${this.tableJobApplications}`;

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        return await query(sql, [...values]);
    }

    updateJobApplication = async (applicationId, params) => {
        let sql = `UPDATE ${this.tableJobApplications} SET`;
        
        const paramArray = [];
        for (let param in params) {
            paramArray.push(` ${param} = ?`);
        }

        sql += paramArray.join(', ');
        
        sql += ` WHERE id = ?`;

        const values = [
            ...Object.values(params),
            applicationId
        ];

        const result = await query(sql, values);

        return result;
    }
    
    saveCandidate = async (params, currentUser) => {
        const current_date = commonfn.dateTimeNow();
        const user_id = currentUser.id;
        const output = {}

        // insert data into listings table
        const sql = `INSERT INTO ${this.tableSavedCandidates} 
            (candidate_id, employer_id, created_at) 
            VALUES ? ON DUPLICATE KEY UPDATE id=id`;

        const values = [params.candidate_id, user_id, current_date];

        const result = await query2(sql, [[values]]);

        if (result.insertId) {
            output.status = 200
        }
        else {
            output.status = 401
        }

        return output;
    }

    getSavedCandidates = async (currentUser) => {
        let sql = `SELECT Saved.*, Users.username as candidate_username, 
            Users.display_name as candidate_display_name, Users.profile_photo as candidate_profile_photo  
            FROM ${this.tableSavedCandidates} as Saved 
            LEFT JOIN ${this.tableUsers} as Users ON Users.id=Saved.candidate_id 
            WHERE Saved.employer_id=${currentUser.id}`;

        return await query(sql);
    }

    deleteSavedCandidate = async (candidate_id, currentUser) => {
        const sql = `DELETE FROM ${this.tableSavedCandidates} WHERE employer_id=? AND candidate_id=?`;
        const values = [currentUser.id, candidate_id];

        return await query(sql, values);
    }
    
    saveFavoriteJob = async (params, currentUser) => {
        const current_date = commonfn.dateTimeNow();
        const user_id = currentUser.id;
        const output = {}

        // insert data into listings table
        const sql = `INSERT INTO ${this.tableFavoriteJobs} 
            (user_id, job_id, created_at) 
            VALUES ? ON DUPLICATE KEY UPDATE id=id`;

        const values = [user_id, params.job_id, current_date];

        const result = await query2(sql, [[values]]);

        if (result.insertId) {
            output.status = 200
        }
        else {
            output.status = 401
        }

        return output;
    }

    getFavoriteJobs = async (currentUser) => {
        let sql = `SELECT FavoriteJobs.*, Jobs.id as job_id, Jobs.title as job_title, 
            Jobs.slug as job_slug, Jobs.created_at as job_created_at, 
            Users.username as employer_username, Users.display_name as employer_display_name, 
            Users.profile_photo as employer_profile_photo  
            FROM ${this.tableFavoriteJobs} as FavoriteJobs 
            LEFT JOIN ${this.tableName} as Jobs ON Jobs.id=FavoriteJobs.job_id 
            LEFT JOIN ${this.tableUsers} as Users ON Users.id=Jobs.user_id 
            WHERE FavoriteJobs.user_id=${currentUser.id}`;

        return await query(sql);
    }

    deleteFavoriteJob = async (job_id, currentUser) => {
        const sql = `DELETE FROM ${this.tableFavoriteJobs} WHERE user_id=? AND job_id=?`;
        const values = [currentUser.id, job_id];

        return await query(sql, values);
    }

    getJobPackages = async () => {
        let sql = `SELECT * FROM ${this.tableJobPackages} as Packages ORDER BY Packages.order`;

        return await query(sql);
    }

    getJobPackage = async (id) => {
        let sql = `SELECT * FROM ${this.tableJobPackages} WHERE id=?`;

        const result = await query(sql, [id]);

        return result[0];
    }

    getJobPackagePrices = async () => {
        let sql = `SELECT * FROM ${this.tableJobPackagePrices}`;

        return await query(sql);
    }

    getJobPackagePrice = async (id) => {
        let sql = `SELECT * FROM ${this.tableJobPackagePrices} WHERE id=?`;

        const result = await query(sql, [id]);

        return result[0];
    }

    getCurrentPackage = async (currentUser) => {
        let output = {};

        let sql = `SELECT * FROM ${this.tableUsersMeta} WHERE user_id=? AND meta_key in ('package', 'package_price', 'package_purchase_date', 'package_expire_date')`;

        const meta_values = await query(sql, [currentUser.id]);

        output.meta_values = meta_values;

        if (meta_values.length > 0) {
            const packageId = meta_values.find(value => value.meta_key === 'package').meta_value;

            if (packageId) {
                output.currentPackage = await this.getJobPackage(packageId);
            }

            const purchaseDate = meta_values.find(value => value.meta_key === 'package_purchase_date').meta_value;

            const date = new Date();
            const last30Days = commonfn.dateTime(new Date(date.setMonth(date.getMonth() - 1)));

            const jobSql = `SELECT * FROM ${this.tableName} WHERE user_id=? AND created_at >= '${purchaseDate}' AND created_at >= '${last30Days}'`;
            const jobs = await query(jobSql, [currentUser.id]);

            output.jobs = jobs;
        } else {
            const jobSql = `SELECT * FROM ${this.tableName} WHERE user_id=?`;
            const jobs = await query(jobSql, [currentUser.id]);

            output.jobs = jobs;
        }

        if (!output.currentPackage) {
            let freePackageSql = `SELECT * FROM ${this.tableJobPackages} WHERE title='Free'`;
            const result = await query(freePackageSql);
            
            output.currentPackage = result[0];
        }

        return output;
    }
}

module.exports = new JobModel;