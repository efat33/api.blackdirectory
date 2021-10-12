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
                    (user_id, title, slug, description, start_time, end_time, 
                        featured_img, address, latitude, longitude, website_url, 
                        youtube_url, featured, is_virtual, created_at, updated_at) 
                    VALUES (?,?,?,?,?,?,
                        ?,?,?,?,?,
                        ?,?,?,?,?)`;
    const values = [
      user_id, params.title, slug, params.description, params.start_time, params.end_time, params.featured_img,
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
          const start_sale = item.start_sale ? item.start_sale : params.start_time;
          const end_sale = item.end_sale ? item.end_sale : params.end_time;
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
          const start_sale = item.start_sale ? item.start_sale : params.start_time;
          const end_sale = item.end_sale ? item.end_sale : params.end_time;
          const tmp = [event_id, 'rsvp', item.title, 0, capacity, capacity, start_sale, end_sale, current_date, current_date];
          values.push(tmp);
        }

        await query2(sql, [values]);

      }

      output.status = 200
      output.data = { 'event_id': event_id, 'slug': slug }
    }
    else {
      output.status = 403
    }
    return output;
  }

  editEvent = async (params, currentUser) => {

    const current_date = commonfn.dateTimeNow();
    const user_id = currentUser.id;
    const user_role = currentUser.role;
    const output = {}

    const is_virtual = params.is_virtual ? params.is_virtual : 0;

    // first update the event table 
    const basic_info = {
      'title': params.title,
      'description': params.description,
      'start_time': params.start_time,
      'end_time': params.end_time,
      'featured_img': params.featured_img,
      'address': params.address,
      'latitude': params.latitude,
      'longitude': params.longitude,
      'website_url': params.website_url,
      'youtube_url': params.youtube_url,
      'is_virtual': is_virtual,
      'updated_at': current_date
    }

    const basic_colset = multipleColumnSet(basic_info, ',');

    const sql = `UPDATE ${DBTables.events}  SET ${basic_colset.columnSet} WHERE id = ?`;

    const result = await query(sql, [...basic_colset.values, params.id]);


    if (result.affectedRows == 1) {
      const event_id = params.id;

      // first delete the existing categories
      const sqlDCat = `DELETE FROM ${DBTables.event_category_relationships} WHERE event_id IN (?)`;
      await query(sqlDCat, [event_id]);

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

      // first delete the existing tags
      const sqlDTag = `DELETE FROM ${DBTables.event_tag_relationships} WHERE event_id IN (?)`;
      await query(sqlDTag, [event_id]);

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

      // first delete the existing organisers
      const sqlDOrg = `DELETE FROM ${DBTables.event_organiser_relationships} WHERE event_id IN (?)`;
      await query(sqlDOrg, [event_id]);

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

      // update data in tickets table
      if (params.tickets.length > 0) {
        
        const new_tickets = params.tickets.filter(item => item.id == null);
        const existing_tickets = params.tickets.filter(item => item.id != null);
        const existing_tickets_ids = existing_tickets.map(item => item.id);

        // update existing tickets
        if(existing_tickets.length > 0){
          // fetch tickets
          let sqlTicket = '';
          sqlTicket = `SELECT COUNT(*) AS sold, event_ticket_id FROM ${DBTables.event_ticket_attendees} WHERE event_ticket_id IN (${existing_tickets_ids.join()}) GROUP BY event_ticket_id`;

          const ticketsD = await query(sqlTicket);

          const sql = `INSERT INTO ${DBTables.event_tickets} (id, title, price, capacity, available, start_sale, end_sale, updated_at) VALUES ? ON DUPLICATE KEY 
          UPDATE title=VALUES(title), price=VALUES(price), capacity=VALUES(capacity), available=VALUES(available), start_sale=VALUES(start_sale), end_sale=VALUES(end_sale), updated_at=VALUES(updated_at)`;
          const values = [];

          for (let item of existing_tickets) {
            const price = item.price ? item.price : 0;
            const capacity = item.capacity ? item.capacity : null;
            const start_sale = item.start_sale ? item.start_sale : params.start_time;
            const end_sale = item.end_sale ? item.end_sale : params.end_time;

            // calculate available
            let available = null;
            if(capacity){
              const ticketDsingle = ticketsD.find(element => element.event_ticket_id == item.id);
              if(ticketDsingle){
                if(capacity > ticketDsingle.sold){
                  available = capacity - ticketDsingle.sold;
                }
                else{
                  available = 0;
                }
              }
              else{
                available = capacity;
              }
            }
            
            const tmp = [item.id, item.title, price, capacity, available, start_sale, end_sale, current_date];
            values.push(tmp);
          }

          await query2(sql, [values]);

        }

        // insert new tickets
        if(new_tickets.length > 0){
          const sql = `INSERT INTO ${DBTables.event_tickets} (event_id, type, title, price, capacity, available, start_sale, end_sale, created_at, updated_at) VALUES ?`;
          const values = [];
  
          for (let item of new_tickets) {
            const price = item.price ? item.price : 0;
            const capacity = item.capacity ? item.capacity : null;
            const start_sale = item.start_sale ? item.start_sale : params.start_time;
            const end_sale = item.end_sale ? item.end_sale : params.end_time;
            const tmp = [event_id, 'ticket', item.title, price, capacity, capacity, start_sale, end_sale, current_date, current_date];
            values.push(tmp);
          }
  
          await query2(sql, [values]);
        }
        

      }

      // remove tickets
      if (params.removedTickets && JSON.parse(params.removedTickets) && JSON.parse(params.removedTickets).length > 0) {
        const removedTickets = JSON.parse(params.removedTickets);

        const sql = `DELETE FROM ${DBTables.event_tickets} WHERE id IN (?)`;

        const values = [];
        for (const item of removedTickets) {
          if (item.id != '') values.push(item.id);
        }

        await query2(sql, [values]);
      }

      // update data in rsvp table
      if (params.rsvp.length > 0) {

        const new_rsvp = params.rsvp.filter(item => item.id == null);
        const existing_rsvp = params.rsvp.filter(item => item.id != null);

        const existing_rsvp_ids = existing_rsvp.map(item => item.id);

        // update existing rsvp
        if(existing_rsvp.length > 0){

          // fetch rsvp
          let sqlRsvp = '';
          sqlRsvp = `SELECT COUNT(*) AS sold, event_ticket_id FROM ${DBTables.event_rsvp_attendees} WHERE event_ticket_id IN (${existing_rsvp_ids.join()}) GROUP BY event_ticket_id`;

          const rsvpD = await query(sqlRsvp);

          const sql = `INSERT INTO ${DBTables.event_tickets} (id, title, capacity, available, start_sale, end_sale, updated_at) VALUES ? ON DUPLICATE KEY 
                    UPDATE title=VALUES(title), capacity=VALUES(capacity), available=VALUES(available), start_sale=VALUES(start_sale), end_sale=VALUES(end_sale), updated_at=VALUES(updated_at)`;
          const values = [];

          for (let item of existing_rsvp) {
            const capacity = item.capacity ? item.capacity : null;
            const start_sale = item.start_sale ? item.start_sale : params.start_time;
            const end_sale = item.end_sale ? item.end_sale : params.end_time;

            // calculate available
            let available = null;
            if(capacity){
              const rsvpDsingle = rsvpD.find(element => element.event_ticket_id == item.id);
              if(rsvpDsingle){
                if(capacity > rsvpDsingle.sold){
                  available = capacity - rsvpDsingle.sold;
                }
                else{
                  available = 0;
                }
              }
              else{
                available = capacity;
              }
            }

            const tmp = [item.id, item.title, capacity, available, start_sale, end_sale, current_date];
            values.push(tmp);
          }

          await query2(sql, [values]);
        }

        // insert new rsvp
        if(new_rsvp.length > 0){
          const sql = `INSERT INTO ${DBTables.event_tickets} (event_id, type, title, price, capacity, available, start_sale, end_sale, created_at, updated_at) VALUES ?`;
          const values = [];
  
                  
          for (let item of new_rsvp) {
            const capacity = item.capacity ? item.capacity : null;
            const start_sale = item.start_sale ? item.start_sale : params.start_time;
            const end_sale = item.end_sale ? item.end_sale : params.end_time;
            const tmp = [event_id, 'rsvp', item.title, 0, capacity, capacity, start_sale, end_sale, current_date, current_date];
            values.push(tmp);
          }
  
          await query2(sql, [values]);
        }
        

      }

      // remove rsvp
      if (params.removedRsvp && JSON.parse(params.removedRsvp) && JSON.parse(params.removedRsvp).length > 0) {
        const removedRsvp = JSON.parse(params.removedRsvp);

        const sql = `DELETE FROM ${DBTables.event_tickets} WHERE id IN (?)`;

        const values = [];
        for (const item of removedRsvp) {
          if (item.id != '') values.push(item.id);
        }

        await query2(sql, [values]);
      }

      output.status = 200
      output.data = { 'event_id': event_id }
    }
    else {
      output.status = 403
    }
    return output;
  }

  // get single event details
  getEvent = async (params) => {
    const current_date = commonfn.dateTimeNow();
    const event = await this.findOne({ slug: params.slug });

    if (event) {
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
      let sqlTicket = '';
      if (params.edit) {
        sqlTicket = `SELECT * 
                        FROM ${DBTables.event_tickets} 
                        WHERE event_id = ? AND type = ?`;
      }
      else {
        sqlTicket = `SELECT * 
                        FROM ${DBTables.event_tickets} 
                        WHERE event_id = ? AND type = ?`;
      }

      event.tickets = await query(sqlTicket, [event_id, 'ticket']);

      // fetch rsvp
      let sqlRsvp = '';
      if (params.edit) {
        sqlRsvp = `SELECT * 
                        FROM ${DBTables.event_tickets} 
                        WHERE event_id = ? AND type = ?`;
      }
      else {
        sqlRsvp = `SELECT * 
                        FROM ${DBTables.event_tickets} 
                        WHERE event_id = ? AND type = ? AND start_sale < NOW() AND end_sale > NOW() AND (available > 0 OR available IS NULL) `;
      }

      event.rsvp = await query(sqlRsvp, [event_id, 'rsvp']);

      event.comments = await this.getEventComments(event.id); 
    }

    return event;
  }


  searchEvents = async (params = {}) => {

    const keyword = params.keyword ? params.keyword : '';
    const input_lat = params.lat ? params.lat : '';
    const input_lng = params.lng ? params.lng : '';

    const output = {}
    let values = [];

    let sql = '';
    let queryDistance = ''

    if (params.lat && params.lng) {
      sql = `SELECT e.*, ( 6371 * acos( cos( radians('${encodeURI(input_lat)}') ) * cos( radians( e.latitude ) ) * cos( radians( e.longitude ) - radians('${encodeURI(input_lng)}') ) + sin( radians('${encodeURI(input_lat)}') ) * sin( radians( e.latitude ) ) ) ) as event_distance 
          FROM ${DBTables.events} AS e`;

      queryDistance = ` HAVING event_distance < 10`;
    }
    else {
      sql = `SELECT e.* FROM ${DBTables.events} AS e`;
    }

    let queryParams = ``;

    if (params.start_time && params.end_time) {
      queryParams += ` WHERE e.start_time >= '${encodeURI(params.start_time)}' AND e.start_time <= '${encodeURI(params.end_time)}'`;
    }
    else {
      if (params.past_event) {
        queryParams += ` WHERE e.end_time < NOW()`;
      }
      else {
        queryParams += ` WHERE e.end_time > NOW()`;
      }
    }

    if(params.user_id){
      queryParams += ` AND e.user_id = ${encodeURI(params.user_id)}`;
    }


    let queryJoinCat = '';
    if (params.category && params.category != '') {
      queryJoinCat += ` JOIN ${DBTables.event_category_relationships} ec ON ec.event_id = e.id`;
      queryParams += ` AND ec.category_id IN (${encodeURI(params.category)})`;
    }

    let queryJoinTag = '';
    if (params.tag && params.tag != '') {
      queryJoinTag += ` JOIN ${DBTables.event_tag_relationships} et ON et.event_id = e.id`;
      queryParams += ` AND et.tag_id IN (${encodeURI(params.tag)})`;
    }

    let queryJoinOrg = '';
    if (params.organisers && params.organisers != '') {
      queryJoinOrg += ` JOIN ${DBTables.event_organiser_relationships} eo ON eo.event_id = e.id`;
      queryParams += ` AND eo.organizer_id IN (${encodeURI(params.organisers)})`;
    }

    if (keyword != '') {
      queryParams += ` AND ( e.title LIKE '%${encodeURI(keyword)}%' OR e.description LIKE '%${encodeURI(keyword)}%' )`;
    }
    if (params.featured) {
      queryParams += ` AND e.featured = 1`;
    }
    if (params.is_virtual) {
      queryParams += ` AND e.is_virtual = 1`;
    }

    // if(params.price && params.price != ''){
    //   queryParams += ` AND l.price_range = ?`;
    //   values.push(params.price);
    // }



    // set order by
    let queryOrderby = ``;
    if (params.past_event) {
      queryOrderby = ` ORDER BY e.start_time DESC`;
    }
    else {
      queryOrderby = ` ORDER BY e.start_time ASC`;
    }
    // if(params.orderby && params.orderby != ''){
    //   queryOrderby = ` ORDER BY ${encodeURI(params.orderby)}`;

    //   if(params.order && params.order != ''){
    //     queryOrderby += ` ${encodeURI(params.order)}`;
    //   }
    // }

    // set limit 
    let queryLimit = '';
    if (params.limit) {
      queryLimit = ` LIMIT ?, ?`;
      values.push(params.offset || 0);
      values.push(params.limit);
    }

    const count_sql = `${sql}${queryJoinCat}${queryJoinTag}${queryJoinOrg}${queryParams}${queryDistance}${queryOrderby}`;
    sql += `${queryJoinCat}${queryJoinTag}${queryJoinOrg}${queryParams}${queryDistance}${queryOrderby}${queryLimit}`;

    // console.log(sql);
    const events = await query(sql, values);
    let total_events = 0;

    if (events.length > 0) {

      const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
      const resultCount = await query(count_sql_final, values);

      total_events = resultCount[0].count;

      const event_ids = events.map((e) => e['id']);


      // get categories
      //   const sqlListCat = `SELECT lc.listing_id, lc.listing_categories_id, c.title, c.image 
      //                         FROM ${this.tableListingCategories} lc
      //                         JOIN ${this.tableCategories} c ON lc.listing_categories_id = c.id  
      //                         WHERE lc.listing_id IN (${listing_ids.join()})`;
      //   const categories = await query(sqlListCat);


      //   for (const item of listings) {
      //     item.categories = categories.filter((c) => c.listing_id == item.id);
      //   }
    }

    output.status = 200;
    const data = {
      events: events,
      total_events: total_events
    }
    output.data = data;

    return output;
  }

  getAttendees = async (params = {}) => {

    const keyword = params.keyword ? params.keyword : '';

    const output = {}
    let values = [];

    let sql = '';
 

    let queryParams = ``;

    if(params.attendee_type == 'rsvp'){
      sql = `SELECT a.* FROM ${DBTables.event_rsvp_attendees} AS a`;
    }
    else {
      sql = `SELECT a.* FROM ${DBTables.event_ticket_attendees} AS a`;
    }

    queryParams += ` WHERE a.event_id = ${encodeURI(params.event_id)}`;

    if (keyword != '') {
      queryParams += ` AND ( a.name LIKE '%${encodeURI(keyword)}%' OR a.email LIKE '%${encodeURI(keyword)}%' OR a.code LIKE '%${encodeURI(keyword)}%' )`;
    }

    if(params.params && params.params.checked_in){
      queryParams += ` AND a.checked_in IS NOT NULL `;
    }

    let queryOrderby = ` ORDER BY a.id DESC`;

    // set limit 
    let queryLimit = '';
    if (params.limit) {
      queryLimit = ` LIMIT ?, ?`;
      const offset = (params.page - 1) * params.limit;
      values.push(offset);
      values.push(params.limit);
    }

    const count_sql = `${sql}${queryParams}`;
    sql += `${queryParams}${queryOrderby}${queryLimit}`;
    
    const attendees = await query(sql, values);
    let total_attendees = 0;

    if (attendees.length > 0) {

      const count_sql_final = `SELECT COUNT(*) as count FROM (${count_sql}) as custom_table`;
      const resultCount = await query(count_sql_final, values);

      total_attendees = resultCount[0].count;

    }

    output.status = 200;
    const data = {
      attendees: attendees,
      total_attendees: total_attendees
    }
    output.data = data;

    return output;

  
  }

  getAttendeeEvent = async (code, table) => {
    const sql = `SELECT a.*, e.user_id as event_user_id
                          FROM ${table} a
                          JOIN ${DBTables.events} e ON e.id = a.event_id  
                          WHERE a.code = ? limit 1`;
    const event = await query(sql, [code]);

    return event[0];
  }

  // get related events
  getRelatedEvents = async (id) => {
    const event_id = id;

    const event = await this.findOne({ id });

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
    if (tagArr && tagArr.length > 0) tags = tagArr.map(t => t.tag_id);

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

    let queryParams = ` WHERE e.id != ${event_id}`; // exclude the current page event

    queryParams += ` AND e.end_time > NOW()`; // remove expired events

    if (event.is_virtual == 1) {
      queryParams += ` AND e.is_virtual = 1`;
    }
    else {
      queryParams += ` AND e.is_virtual = 0`;
    }

    queryParams += ` AND (c.category_id IN (${categories.join()}) OR o.organizer_id IN (${organisers.join()})`;

    if (tags.length > 0) {
      queryParams += ` OR t.tag_id IN (${tags.join()}))`;
    }
    else {
      queryParams += ` )`;
    }

    const final_sql = `${sql}${queryParams} GROUP BY(e.id) LIMIT 3`;
    const events = await query(final_sql);

    return events;
  }

  // get loggedin user tickets
  getUserTickets = async (event_id, user_id) => {
    const result = await this.find({ event_id, user_id }, DBTables.event_ticket_attendees);
    return result;
  }

  // get loggedin user rsvp
  getUserRsvp = async (event_id, user_id) => {
    const result = await this.find({ event_id, user_id }, DBTables.event_rsvp_attendees);
    return result;
  }

  // get all rsvp tickets of an event
  getRsvpTickets = async (event_id) => {
    const result = await this.find({ event_id }, DBTables.event_tickets);
    return result;
  }

  // rsvp application form submitted
  rsvpApply = async (params, currentUser, rsvp) => {

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
      const updated_sold = rsvp.sold + parseInt(params.guest_no);
      const basic_info = {
        'sold': updated_sold,
        'updated_at': current_date
      }
      if(rsvp.available){
        const updated_available = rsvp.available - parseInt(params.guest_no);
        basic_info.available = updated_available;
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

  getOrganiser = async (organizerId) => {
      let sql = `SELECT * FROM ${DBTables.event_organisers} WHERE id=?`;

      return await query(sql, [organizerId]);
  }

  updateOrganiser = async (organizerId, params) => {
      const current_date = commonfn.dateTimeNow();
      let sql = `UPDATE ${DBTables.event_organisers} SET`;

      const paramArray = [];
      for (let param in params) {
          paramArray.push(` ${param} = ?`);
      }

      paramArray.push(` updated_at = ?`);

      sql += paramArray.join(', ');

      sql += ` WHERE id = ?`;

      const values = [
          ...Object.values(params),
          current_date,
          organizerId
      ];

      const result = await query(sql, values);

      return result;
  }

  deleteOrganiser = async (organizerId) => {
      const sql = `DELETE FROM ${DBTables.event_organisers} WHERE id=?`;
      const values = [organizerId];

      return await query(sql, values);
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

  getCategory = async (categoryId) => {
      let sql = `SELECT * FROM ${DBTables.event_categories} WHERE id=?`;

      return await query(sql, [categoryId]);
  }

  updateCategory = async (categoryId, params) => {
      let sql = `UPDATE ${DBTables.event_categories} SET`;

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
      const sql = `DELETE FROM ${DBTables.event_categories} WHERE id=?`;
      const values = [categoryId];

      return await query(sql, values);
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

  getTag = async (tagId) => {
    let sql = `SELECT * FROM ${DBTables.event_tags} WHERE id=?`;

    return await query(sql, [tagId]);
  }

  updateTag = async (tagId, params) => {
      let sql = `UPDATE ${DBTables.event_tags} SET`;

      const paramArray = [];
      for (let param in params) {
          paramArray.push(` ${param} = ?`);
      }

      sql += paramArray.join(', ');

      sql += ` WHERE id = ?`;

      const values = [
          ...Object.values(params),
          tagId
      ];

      const result = await query(sql, values);

      return result;
  }

  deleteTag = async (tagId) => {
      const sql = `DELETE FROM ${DBTables.event_tags} WHERE id=?`;
      const values = [tagId];

      return await query(sql, values);
  }

  createEventComment = async (params, currentUser) => {
    const current_date = commonfn.dateTimeNow();
    let output = {};

    const sql = `INSERT INTO ${DBTables.event_comments} 
          (event_id, user_id, comment, parent_id, created_at) 
          VALUES (?,?,?,?,?)`;

    const values = [params.event_id, currentUser.id, params.comment, params.parent_id, current_date];

    const result = await query(sql, values);

    if (result.insertId) {
      output.status = 200

      await this.updateEventCommentCount(params.event_id);

      const comment = await this.getEventComment(result.insertId);
      output.data = comment[0];
    }
    else {
      output.status = 401
    }

    return output;
  }

  getEventComments = async (eventId) => {
    let sql = `SELECT Comment.*, User.username as username, User.display_name as display_name, User.profile_photo as profile_photo 
      FROM ${DBTables.event_comments} as Comment
      LEFT JOIN ${DBTables.users} as User ON User.id=Comment.user_id
      WHERE Comment.event_id=?
      ORDER BY Comment.created_at ASC
      `;

    return await query(sql, [eventId]);
  }

  getEventComment = async (commentId) => {
    let sql = `SELECT Comment.*, User.username as username, User.display_name as display_name, User.profile_photo as profile_photo 
      FROM ${DBTables.event_comments} as Comment
      LEFT JOIN ${DBTables.users} as User ON User.id=Comment.user_id
      WHERE Comment.id=?
      `;

    return await query(sql, [commentId]);
  }

  updateEventComment = async (commentId, comment) => {
    let sql = `UPDATE ${DBTables.event_comments} 
          SET comment = ?
          WHERE id = ?`;

    const result = await query(sql, [comment, commentId]);

    return result;
  }

  updateEventCommentCount = async (eventId) => {
    let sql = `UPDATE ${DBTables.events} 
          SET total_comments = (
              SELECT count(*) FROM ${DBTables.event_comments} WHERE event_id = ?
          ) 
          WHERE id = ?`;


    const result = await query(sql, [eventId, eventId]);

    return result;
  }

  deleteEventComment = async (commentId, eventId) => {
    const sql = `DELETE FROM ${DBTables.event_comments} WHERE id=? OR parent_id=?`;
    const values = [commentId, commentId];

    await query(sql, values);
    await this.updateEventCommentCount(eventId);
  }

  getTickets = async (ticketIds) => {
    const ids = encodeURI(ticketIds.join(','));
    const sqlTicket = `SELECT * 
      FROM ${DBTables.event_tickets} 
      WHERE id IN (${ids})`;

    return await query(sqlTicket);
  }

  
  buyEventTickets = async (items, event_id, user_id) => {
    const current_date = commonfn.dateTimeNow();
    const output = {}

    event_id = parseInt(event_id);
    user_id = parseInt(user_id);

    let total = 0;
    let ticket_count = 0;

    for (const item of items) {
      total += item.price * item.quantity;
      ticket_count += item.quantity;
    }

    // first insert into ticket order table
    const sqlOrder = `INSERT INTO ${DBTables.event_ticket_orders} (event_id, user_id, type, date, status, ticket_count, total, created_at, updated_at) 
                    VALUES (?,?,?,?,?,?,?,?,?)`;
    const valuesOrder = [event_id, user_id, 'ticket', current_date, 'approved', ticket_count, total, current_date, current_date];

    const resultOrder = await query(sqlOrder, valuesOrder);

    if (resultOrder.insertId) {
      const order_id = resultOrder.insertId;

      // insert into order meta table
      const sqlOMeta = `INSERT INTO ${DBTables.event_ticket_order_meta} (event_ticket_order_id, event_tickets_id, quantity, amount) VALUES ?`;
      const meta_values = [];

      for (const item of items) {
        const value = [order_id, item.ticketId, item.quantity, item.price];
        meta_values.push(value);
      }

      await query2(sqlOMeta, [meta_values]);

      // insert into ticket attendee table
      const sqlAttende = `INSERT INTO ${DBTables.event_ticket_attendees} (event_ticket_order_id, event_ticket_id, event_id, user_id, code) VALUES ?`;
      const insertData = [];

      console.log("🚀 ~ file: event-model.js ~ line 840 ~ EventModel ~ buyEventTickets= ~ items", items)
      for (const item of items) {
        for (let index = 0; index < item.quantity; index++) {
          // generate code
          const ranStr2 = commonfn.randomCode(8);
          const code = `${order_id}${ranStr2}`;

          const tmp = [order_id, item.ticketId, event_id, user_id, code];
          insertData.push(tmp);
        }
      }

      await query2(sqlAttende, [insertData]);


      // finally update available ticket
      const ids = items.map(ticket => ticket.ticketId);
      const tickets = await this.getTickets(ids);

      for (const ticket of tickets) {

        const item = items.find(t => t.ticketId === ticket.id);

        const updated_sold = ticket.sold + parseInt(item.quantity);
        const basic_info = {
          'sold': updated_sold,
          'updated_at': current_date
        }
        if (ticket.available != null) {
          const updated_available = ticket.available - item.quantity;
          basic_info.available = updated_available;
        }
        const basic_colset = multipleColumnSet(basic_info, ',');
        const sql = `UPDATE ${DBTables.event_tickets} SET ${basic_colset.columnSet} WHERE id = ?`;
    
        const result = await query(sql, [...basic_colset.values, ticket.id]);
      }

      output.status = 200;

    }
    return output;
  }

  attendeeCheckin = async (params) => {
    const basic_info = {
      'checked_in': params.checked_in
    }
    
    const basic_colset = multipleColumnSet(basic_info, ',');
    
    const sql = `UPDATE ${params.table} SET ${basic_colset.columnSet} WHERE id = ?`;
    
    const result = await query(sql, [...basic_colset.values, params.id]);
    
    return result;
    
  }
}

module.exports = new EventModel;