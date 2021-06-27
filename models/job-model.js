const {query, query2} = require('../server');
const { multipleColumnSet } = require('../utils/common');
const PHPUnserialize = require('php-unserialize');
const commonfn = require('../utils/common');

class JobModel {
  tableName = 'users';
  tableNameMeta = 'users_meta';
  tableSectors = 'job_sectors';

  

  getSectors = async () => {

    const sql = `SELECT * FROM ${this.tableSectors} ORDER BY title`;
    const result  = await query(sql);
    
    return result;
  }


}

module.exports = new JobModel;