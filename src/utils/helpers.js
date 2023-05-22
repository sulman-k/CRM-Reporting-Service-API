const moduleName = "[Helper]",
  // request = require("request"),
  logger = require(`${__utils}/logger/logger`)(moduleName),
  // parseString = require('xml2js').parseString;
  jwt_decode = require("jwt-decode"),
  _ = require("lodash");
exports.getSOAPKeySubstring = async (string) => {
  let str = Object.keys(string);
  for (let s of str) {
    if (s.includes(":tenantId")) {
      str = s.split(":")[0];
      break;
    }
  }
  return str;
};

// exports.Request = async (options) => {
//     return new Promise(resolve => {
//         request(options, function (error, response, body) {
//             if (error) {
//                 logger.error("[POSTRequest][Error]", error);
//                 throw new Error(error.message);
//             }
//             else if (response.statusCode === 401) {
//                 logger.error("[POSTRequest][Error]", "Unauthorized User.");
//                 throw new Error('Unauthorized User.');
//             }
//             else resolve({ response, body })
//         });
//     });
// }

// exports.parse = async (string) => {
//     return new Promise(resolve => {
//         parseString(string, { explicitArray: false }, async function (err, result) {
//             if (err) throw new Error(err)
//             else resolve(result);
//         });
//     });
// }

exports.mapCountryName = async (allVerifications, countries) => {
  try {
    for (let v of allVerifications) {
      let cObj = countries.find((c) => c.dialing_code == v.dialing_code);
      v.country_name = cObj.name;
    }
    return allVerifications;
  } catch (e) {
    logger.error("[Map Region Country Name Function][error]", e);
    return {
      success: false,
      msg: e.message,
    };
  }
};

exports.mapOperatorName = async (data, opt) => {
  try {
    for (let d of data) {
      for (let o of opt) {
        let _obj = o.code.find((c) => c.code == d.operator_code);
        if (_obj) {
          d.operator_name = o.name;
          console.log(d);
        }
      }
    }

    return data;
  } catch (e) {
    logger.error("[Map Operator Name Function][error]", e);
    return {
      success: false,
      msg: e.message,
    };
  }
};
exports.getUserProfile = (req, token = {}) => {
  const CLAIM_URI = "http://wso2.org/claims";
  const user_profile = jwt_decode(token);

  req.headers.enduser = user_profile[CLAIM_URI + "/enduser"];
  req.headers.scope = user_profile["scope"];
  req.headers.enduser ? null : (req.headers.enduser = "admin@glo.com");

  const is_admin = req.headers.scope.includes("admin_access");
  req.headers.is_admin = is_admin;

  return;
};
exports.compareKeys = async (req_key = [], has_keys = [], res) => {
  const result = _.difference(req_key, has_keys);
  return result.length;
};
//end
