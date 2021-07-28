const { query, query2, query3 } = require('../server');
const AppError = require("../utils/appError");


exports.DBTables = {
  'listing_reviews': 'listing_reviews'
};

exports.multipleColumnSet = (object, joinBy = 'AND') => {
  if (typeof object !== 'object') {
    throw new Error('Invalid input');
  }

  const keys = Object.keys(object);
  const values = Object.values(object);

  if (joinBy == ',') {
    columnSet = keys.map(key => `${key} = ?`).join(`${joinBy} `);
  }
  else {
    columnSet = keys.map(key => `${key} = ?`).join(` ${joinBy} `);
  }


  return {
    columnSet,
    values
  }
}

exports.dateTimeNow = () => {
  const currentdate = new Date();

  const year = currentdate.getUTCFullYear();
  const month = (currentdate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = currentdate.getUTCDate().toString().padStart(2, '0');
  const hour = currentdate.getUTCHours().toString().padStart(2, '0');
  const min = currentdate.getUTCMinutes().toString().padStart(2, '0');
  const sec = currentdate.getUTCSeconds().toString().padStart(2, '0');

  const datetime = `${year}-${month}-${day} ${hour}:${min}:${sec}`;

  return datetime;
};

exports.dateTime = (date) => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hour = date.getUTCHours().toString().padStart(2, '0');
  const min = date.getUTCMinutes().toString().padStart(2, '0');
  const sec = date.getUTCSeconds().toString().padStart(2, '0');

  const datetime = `${year}-${month}-${day} ${hour}:${min}:${sec}`;

  return datetime;
};

exports.currentTimestamp = () => {
  const currentdate = new Date().getTime();

  return currentdate;
};

exports.randomString = (length) => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$&*';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


exports.filterPostMetaItems = (arr, post_id, meta_key) => {
  const fitered_obj = arr.find((obj) => {
    return (obj.post_id == post_id) && (obj.meta_key == meta_key);
  });

  if (typeof fitered_obj != 'undefined') {
    return fitered_obj.meta_value;
  }

  return null;
}

exports.filterUserMetaItems = (arr, user_id, meta_key) => {
  const fitered_obj = arr.find((obj) => {
    return (obj.user_id == user_id) && (obj.meta_key == meta_key);
  });

  if (typeof fitered_obj != 'undefined') {
    return fitered_obj.meta_value;
  }

  return null;
}

exports.prepareSlug = (str) => {
  let slug = str.replace(/[^a-zA-Z0-9 ]/g, "");
  slug = slug.toLowerCase().trim();
  slug = slug.replace(/ /g, '-');

  return slug;
}

exports.generateSlug = async (str, table) => {
  let slug = this.prepareSlug(str);

  // search for exact match
  const sql = `SELECT * FROM ${table}  WHERE slug = ?`;
  const exactMatch = await query(sql, [slug]);
  if (exactMatch.length == 0) return slug;

  // search for partial match
  const sqlPartial = `SELECT * FROM ${table}  WHERE slug LIKE ?`;
  const partialMatch = await query(sqlPartial, [`${slug}%`]);
  const slugNumber = partialMatch.length + 1;
  slug = `${slug}-${slugNumber}`;

  return slug;
}

exports.isEmployer = () => {
  return async function (req, res, next) {
    try {
      if (req.currentUser.role === 'employer') {
        next();
      } else {
        throw new AppError(401, "401_notEmployer");
      }
    } catch (e) {
      e.status = 401;
      next(e);
    }
  };
};

exports.isAdmin = () => {
  return async function (req, res, next) {
    try {
      if (req.currentUser.role === 'admin') {
        next();
      } else {
        throw new AppError(401, "401_notAdmin");
      }
    } catch (e) {
      e.status = 401;
      next(e);
    }
  };
};

exports.generateMetaObject = (metaValues) => {
  const metaObject = {};
  
  metaValues.forEach(value => {
    metaObject[value.meta_key] = value.meta_value;
  });

  return metaObject;
};


