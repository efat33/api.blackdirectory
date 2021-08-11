const { query, query2, query3 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');
const { DBTables } = require('../utils/common');
const moment = require('moment');
const e = require('express');

class EventModel {
    findOne = async (params, table = `${DBTables.events}`) => {
        const { columnSet, values } = multipleColumnSet(params)

        const sql = `SELECT * FROM ${table}
        WHERE ${columnSet} LIMIT 1`;

        const result = await query(sql, [...values]);

        // return back the first row (user)
        return result[0] ? result[0] : {};

    }

    find = async (params = {}, table = `${DBTables.events}`, orderby = '') => {
        let sql = `SELECT * FROM ${table}`;

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params)
        sql += ` WHERE ${columnSet}`;

        if (orderby != '') sql += ` ${orderby}`;

        return await query(sql, [...values]);
        }

    findMatchAny = async (params = {}, table = `${DBTables.events}`) => {
        let sql = `SELECT * FROM ${table}`;

        if (!Object.keys(params).length) {
            return await query(sql);
        }

        const { columnSet, values } = multipleColumnSet(params, 'OR')
        sql += ` WHERE ${columnSet}`;

        return await query(sql, [...values]);
    }

    newEvent = async (params, currentUser) => {

        const current_date = commonfn.dateTimeNow();
        const user_id = currentUser.id;
        const user_role = currentUser.role;
        const output = {}

        let slug = await commonfn.generateSlug(params.title, DBTables.events);
        const is_virtual = params.is_virtual ? params.is_virtual : 0;

        // first insert into event table
        const sql = `INSERT INTO ${DBTables.events} 
                    (title, slug, description, start_time, end_time, 
                        featured_img, address, latitude, longitude, website_url, 
                        youtube_url, featured, is_virtual, created_at, updated_at) 
                    VALUES (?,?,?,?,?,
                        ?,?,?,?,?,
                        ?,?,?,?,?)`;
        const values = [
                        params.title, slug, params.description, params.start_time, params.end_time, params.featured_img, 
                        params.address, params.latitude, params.longitude, params.website_url, params.youtube_url, 
                        0, is_virtual, current_date, current_date
                    ];
        
        const result = await query(sql, values);

        if (result.insertId) {
            const event_id = result.insertId;

            // insert data to event_category_relationships table
            if (params.category_id.length > 0) {
                const sql = `INSERT INTO ${DBTables.event_category_relationships} (event_id, category_id) VALUES ?`;
                const values = [];

                for (let x of params.category_id) {
                    const tmp = [event_id, x];
                    values.push(tmp);
                }

                await query2(sql, [values]);

            }

            // insert data to event_tag_relationships table
            if (params.tag_id.length > 0) {
                const sql = `INSERT INTO ${DBTables.event_tag_relationships} (event_id, tag_id) VALUES ?`;
                const values = [];

                for (let x of params.tag_id) {
                    const tmp = [event_id, x];
                    values.push(tmp);
                }

                await query2(sql, [values]);

            }

            // insert data to event_organiser_relationships table
            if (params.organizers.length > 0) {
                const sql = `INSERT INTO ${DBTables.event_organiser_relationships} (event_id, organizer_id) VALUES ?`;
                const values = [];

                for (let x of params.organizers) {
                    const tmp = [event_id, x];
                    values.push(tmp);
                }

                await query2(sql, [values]);

            }

            // insert data to tickets table
            if (params.tickets.length > 0) {
                const sql = `INSERT INTO ${DBTables.event_tickets} (event_id, type, title, price, capacity, available, start_sale, end_sale, created_at, updated_at) VALUES ?`;
                const values = [];

                for (let item of params.tickets) {
                    const price = item.price ? item.price : 0;
                    const capacity = item.capacity ? item.capacity : null;
                    const start_sale = item.start_sale ? item.start_sale : null;
                    const end_sale = item.end_sale ? item.end_sale : null;
                    const tmp = [event_id, 'ticket', item.title, price, capacity, capacity, start_sale, end_sale, current_date, current_date];
                    values.push(tmp);
                }

                await query2(sql, [values]);

            }

            // insert data to rsvp table
            if (params.rsvp.length > 0) {
                const sql = `INSERT INTO ${DBTables.event_tickets} (event_id, type, title, price, capacity, available, start_sale, end_sale, created_at, updated_at) VALUES ?`;
                const values = [];

                for (let item of params.rsvp) {
                    const capacity = item.capacity ? item.capacity : null;
                    const start_sale = item.start_sale ? item.start_sale : null;
                    const end_sale = item.end_sale ? item.end_sale : null;
                    const tmp = [event_id, 'rsvp', item.title, 0, capacity, capacity, start_sale, end_sale, current_date, current_date];
                    values.push(tmp);
                }

                await query2(sql, [values]);

            }

            output.status = 200
            output.data = { 'event_id': event_id, 'slug': slug }
        }
        else{
            output.status = 403
        }
        return output;
    }

    // get single event details
    getEvent = async (slug) => {
        const current_date = commonfn.dateTimeNow();
        const event = await this.findOne({slug});
        
        if(event){
            const event_id = event.id;

            // fetch categories
            const sqlCat = `SELECT ec.event_id, ec.category_id, c.title
                                FROM ${DBTables.event_category_relationships} ec
                                JOIN ${DBTables.event_categories} c ON ec.category_id = c.id  
                                WHERE ec.event_id = ?`;
            event.categories = await query(sqlCat, [event_id]);

            // fetch tags
            const sqlTag = `SELECT et.event_id, et.tag_id, t.title
                                FROM ${DBTables.event_tag_relationships} et
                                JOIN ${DBTables.event_tags} t ON et.tag_id = t.id  
                                WHERE et.event_id = ?`;
            event.tags = await query(sqlTag, [event_id]);

            // fetch organisers
            const sqlOrgan = `SELECT eo.event_id, eo.organizer_id, o.name, o.phone, o.website, o.email
                        FROM ${DBTables.event_organiser_relationships} eo
                        JOIN ${DBTables.event_organisers} o ON eo.organizer_id = o.id  
                        WHERE eo.event_id = ?`;
            event.organisers = await query(sqlOrgan, [event_id]);

            // fetch tickets
            const sqlTicket = `SELECT * 
                        FROM ${DBTables.event_tickets} 
                        WHERE event_id = ? AND type = ? AND end_sale > NOW()`;
            event.tickets = await query(sqlTicket, [event_id, 'ticket']);

            // fetch tickets
            const sqlRsvp = `SELECT * 
                        FROM ${DBTables.event_tickets} 
                        WHERE event_id = ? AND type = ? AND end_sale > NOW()`;
            event.rsvp = await query(sqlRsvp, [event_id, 'rsvp']);
        }
        
        return event;
    }

    // get related events
    getRelatedEvents = async (id) => {
        const event_id = id;
        
        const sqlCat = `SELECT category_id
                            FROM ${DBTables.event_category_relationships} 
                            WHERE event_id = ?`;
        const catArr = await query(sqlCat, [event_id]);
        let categories = catArr.map(c => c.category_id);

        // fetch tags
        const sqlTag = `SELECT tag_id
                FROM ${DBTables.event_tag_relationships} 
                WHERE event_id = ?`;
        const tagArr = await query(sqlTag, [event_id]);

        let tags = [];
        if(tagArr && tagArr.length > 0) tags = tagArr.map(t => t.tag_id);

        // fetch organisers
        const sqlOrgan = `SELECT organizer_id
                FROM ${DBTables.event_organiser_relationships} 
                WHERE event_id = ?`;
        const orgArr = await query(sqlOrgan, [event_id]);
        let organisers = orgArr.map(o => o.organizer_id);
        
        const sql = `SELECT e.* FROM ${DBTables.events} e 
                    LEFT JOIN ${DBTables.event_category_relationships} c ON c.event_id = e.id  
                    LEFT JOIN ${DBTables.event_tag_relationships} t ON t.event_id = e.id 
                    LEFT JOIN ${DBTables.event_organiser_relationships} o ON o.event_id = e.id`;

        let queryParams = ` WHERE e.id != ${event_id} AND (c.category_id IN (${categories.join()}) OR o.organizer_id IN (${organisers.join()})`            

        if(tags.length > 0) queryParams += ` OR t.tag_id IN (${tags.join()}))`;

        const final_sql = `${sql}${queryParams} GROUP BY(e.id) LIMIT 3`;
        const events = await query(final_sql);

        return events;
    }

    // get loggedin user tickets
    getUserTickets = async (event_id, user_id) => {
        const result = await this.find({event_id, user_id}, DBTables.event_ticket_attendees);
        return result;
    }

    // get loggedin user rsvp
    getUserRsvp = async (event_id, user_id) => {
        const result = await this.find({event_id, user_id}, DBTables.event_rsvp_attendees);
        return result;
    }

    // rsvp application form submitted
    rsvpApply = async (params, currentUser, rsvp ) => {

        const current_date = commonfn.dateTimeNow();
        const user_id = currentUser.id;
        const event_id = rsvp.event_id;
        const output = {}
        
        // first insert into ticket order table
        const sqlOrder = `INSERT INTO ${DBTables.event_ticket_orders} (event_id, user_id, type, name, email, date, status, ticket_count, total, created_at, updated_at) 
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
        const valuesOrder = [event_id, user_id, 'rsvp', params.name, params.email, current_date, 'approved', params.guest_no, 0, current_date, current_date];
        
        const resultOrder = await query(sqlOrder, valuesOrder);

        if (resultOrder.insertId) {
            const order_id = resultOrder.insertId;

            // insert into order meta table
            const sqlOMeta = `INSERT INTO ${DBTables.event_ticket_order_meta} (event_ticket_order_id, event_tickets_id, quantity, amount) VALUES (?,?,?,?)`;
            const valuesOMeta = [order_id, params.rsvp_id, params.guest_no, 0];
            
            await query(sqlOMeta, valuesOMeta);

            // insert into rsvp attendee table
            const sqlAttende = `INSERT INTO ${DBTables.event_rsvp_attendees} (event_ticket_order_id, event_ticket_id, event_id, user_id, name, email, code) VALUES ?`;
            const insertData = [];
            
            for (let index = 0; index < params.guest_no; index++) {
                // generate code
                const ranStr2 = commonfn.randomCode(8);
                const code = `${order_id}${ranStr2}`;

                const tmp = [order_id, params.rsvp_id, event_id, user_id, params.name, params.email, code];
                insertData.push(tmp);
            }
            
            await query2(sqlAttende, [insertData]);


            // finally update available rsvp
            const updated_available = rsvp.available - params.guest_no;
            const basic_info = {
              'available': updated_available,
              'updated_at': current_date
            }
            
            const basic_colset = multipleColumnSet(basic_info, ',');
            const sql = `UPDATE ${DBTables.event_tickets} SET ${basic_colset.columnSet} WHERE id = ?`;
            
            const result = await query(sql, [...basic_colset.values, rsvp.id]);
            

            output.status = 200;

        }
        return output;
    }

    newOrganiser = async (params) => {

        const current_date = commonfn.dateTimeNow();
        const output = {}
        
        const sql = `INSERT INTO ${DBTables.event_organisers} (name, phone, website, email, created_at, updated_at) VALUES (?,?,?,?,?,?)`;
        const values = [params.name, params.phone, params.website, params.email, current_date, current_date];
        
        const result = await query(sql, values);

        if (result.insertId) {
            output.status = 200;
            output.data = result.insertId;
        }
        return output;
    }

    newCategory = async (params) => {

        const current_date = commonfn.dateTimeNow();
        const output = {}
        
        const sql = `INSERT INTO ${DBTables.event_categories} (title) VALUES (?)`;
        const values = [params.title];
        
        const result = await query(sql, values);

        if (result.insertId) {
            output.status = 200;
            output.data = result.insertId;
        }
        return output;
    }

    newTag = async (params) => {

        const current_date = commonfn.dateTimeNow();
        const output = {}
        
        const sql = `INSERT INTO ${DBTables.event_tags} (title) VALUES (?)`;
        const values = [params.title];
        
        const result = await query(sql, values);

        if (result.insertId) {
            output.status = 200;
            output.data = result.insertId;
        }
        return output;
    }
}

module.exports = new EventModel;