const HttpServer = require('httpserver');
const querystring = require('querystring');
const crypto = require('crypto');
const URL = require('url');

class VkAppsApiServer extends HttpServer {
  constructor({ appSecret = '', testValidation=false, ...serverOptions }) {
    super(serverOptions);

    this.appSecret = appSecret;
    this.testValidation = testValidation;
  }

  signVerify(urlParams, clientSecret) {
    const ordered = {};

    Object.keys(urlParams).sort().forEach((key) => {
      if (key.slice(0, 3) === 'vk_') {
        ordered[key] = urlParams[key];
      }
    });

    const stringParams = querystring.stringify(ordered);
    const paramsHash = crypto
      .createHmac('sha256', clientSecret)
      .update(stringParams)
      .digest()
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=$/, '');

    return (paramsHash === urlParams.sign);
  }

  validateRequest(req, res) {
    const url = new URL.parse(req.url, true);
    const search = (url.search || '').substr(1);
    const urlParams = querystring.parse(search);
    const validSign = this.signVerify(search, this.appSecret);

    if (!(validSign || (this.testValidation && urlParams.testValidation === '1'))) {
      throw {
        code: 401,
        description: 'Unauthorized',
        request_params: urlParams,
      };
    }
  }

  printResponse(req, res, response) {
    res.close(JSON.stringify({ response }), 200);
  }

  printError(req, res, error) {
    console.error(error);
    res.close(JSON.stringify({ error }), 200);
  }

  onPayload(req, res, payload) {
    const url = new URL.parse(req.url, true);
    const query = { ...payload, ...url.query };
    const user_id = parseInt(query.vk_user_id, 10);
    const method = url.pathname
      .replace(/[^?]*\//, '')
      .replace('.', '_');
    const methodId = 'api_' + method;

    if (typeof this[methodId] === 'function') {
      return Promise.resolve().then(() => {
        return this[methodId](user_id, query);
      }).catch((error) => {
        if (error && error.request_params) {
          throw error;
        }

        throw {
          code: 500,
          description: 'Server error',
          request_params: query,
        };
      });
    }

    return Promise.reject({
      code: 404,
      description: 'Invalid method',
      request_params: query,
      method
    });
  }
}

module.exports = VkAppsApiServer;
