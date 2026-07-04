import { WebApp } from 'meteor/webapp';
import { Router } from './router.js';

// Conditional body parser. WebApp.express exists from Meteor 3.0 (webapp 2.0,
// Express 4.18); Meteor 3.1 upgraded it to Express 5. express.json/urlencoded/
// text behave the same for our purposes on both, so feature-detect rather
// than version-check.
if (typeof WebApp !== 'undefined' && WebApp.express && typeof WebApp.express.json === 'function') {
  // Meteor 3.0+ - use the Express body parsers Meteor ships
  Router.bodyParser = {
    json: function(options) {
      return WebApp.express.json(options);
    },
    urlencoded: function(options) {
      return WebApp.express.urlencoded(options);
    },
    text: function(options) {
      return WebApp.express.text(options);
    }
  };
} else {
  // Meteor < 3.0 - use external body-parser package
  Router.bodyParser = Npm.require('body-parser');
}
