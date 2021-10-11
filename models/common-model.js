const { query, query2 } = require('../server');
const { multipleColumnSet } = require('../utils/common');
const commonfn = require('../utils/common');
const { DBTables } = require('../utils/common');

class CommonModel {

    findOne = async (params, table = `${DBTables.hero_slider}`) => {
        const { columnSet, values } = multipleColumnSet(params)

        const sql = `SELECT * FROM ${table}
      WHERE ${columnSet} LIMIT 1`;

        const result = await query(sql, [...values]);

        // return back the first row
        return result[0] ? result[0] : {};

    }

    getHeroSlides = async () => {
        let sql = `SELECT * FROM ${DBTables.hero_slider}`;
    
        return await query(sql);
    }

    createHeroSlide = async (params) => {
        let output = {};
    
        const sql = `INSERT INTO ${DBTables.hero_slider} 
          (title, image) 
          VALUES (?,?)`;
    
        const result = await query(sql, [params.title, params.image]);
    
        if (result.insertId) {
          const slide_id = result.insertId;
    
          output.status = 200
          output.data = { 'slide_id': slide_id }
        }
        else {
          output.status = 401
        }
    
        return output;
    }

    updateHeroSlide = async (slideId, params) => {
        let sql = `UPDATE ${DBTables.hero_slider} SET`;
    
        const paramArray = [];
        for (let param in params) {
          paramArray.push(` ${param} = ?`);
        }
    
        sql += paramArray.join(', ');
    
        sql += ` WHERE id = ?`;
    
        const values = [
          ...Object.values(params),
          slideId
        ];
    
        const result = await query(sql, values);
    
        return result;
    }

    deleteHeroSlide = async (slideId) => {
        const sql = `DELETE FROM ${DBTables.hero_slider} WHERE id=?`;
        const values = [slideId];
    
        return await query(sql, values);
    }
    
}

module.exports = new CommonModel;
