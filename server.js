const dotenv = require("dotenv");
const mysql2 = require("mysql2");

dotenv.config({ path: "./config.env" });

let dbConfig;
if (process.env.NODE_ENV === "development") {
  dbConfig = {
    host: process.env.DB_LOCAL_HOST,
    user: process.env.DB_LOCAL_USER,
    password: "",
    database: process.env.DB_LOCAL_NAME,
    multipleStatements: true,
    timezone: 'Z'
  };
} else {
  dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true,
    timezone: 'Z'
  };
}

class DBConnection {
  constructor() {
    this.db = mysql2.createPool(dbConfig);
    this.checkConnection();
  }

  checkConnection() {
    this.db.getConnection((err, connection) => {
      if (err) {
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          console.error("Database connection was closed.");
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
          console.error("Database has too many connections.");
        }
        if (err.code === "ECONNREFUSED") {
          console.error("Database connection was refused.");
        }
      }
      if (connection) {
        console.log("connection successful...");
        connection.release();
      }
      return;
    });

  }

  query = async (sql, values) => {
    return new Promise((resolve, reject) => { 
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };

      // replace 'undefined' with 'null' to avoid SQL error
      if (values) {
        values = values.map((value) => value === undefined ? null : value);
      }
      
      // execute will internally call prepare and query
      this.db.execute(sql, values, callback);
    }).catch((err) => {
      console.log(err);
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };

  query2 = async (sql, values) => {
    return new Promise((resolve, reject) => { 
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      
      this.db.query(sql, values, callback);
    }).catch((err) => {
      console.log(err);
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };

  query3 = async (sql) => {
    return new Promise((resolve, reject) => { 
      // const sql = "UPDATE users_meta SET meta_value = '22' WHERE user_id = '33' AND meta_key = 'facebook_link'; UPDATE users_meta SET meta_value = 'eee' WHERE user_id = '33' AND meta_key = 'twitter_link';";
      
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
     
      this.db.query(sql, callback);

    }).catch((err) => {
      console.log(err);
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };

  


}

const HttpStatusCodes = Object.freeze({
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: 422,
  ER_DUP_ENTRY: 409,
});


const dbConnection = new DBConnection();

exports.query = dbConnection.query;
exports.query2 = dbConnection.query2;
exports.query3 = dbConnection.query3;









