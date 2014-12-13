/*!
 * Protomatter.js 0.1.0
 * https://github.com/whastings/protomatter.js
 * (c) 2014 Will Hastings
 * Protomatter.js may be freely distributed under the MIT license.
 */

/* global exports:true */
(function(root) {
  'use strict';

  var Protomatter = {},
      slice = Array.prototype.slice,
      baseProto;

  baseProto = {
    getPrototype: function() {
      return Object.getPrototypeOf(this);
    },

    hasPrototype: function(proto) {
      // TODO: Replace w/ Object.prototype.isPrototypeOf().
      var thisProto = Object.getPrototypeOf(this);
      if (thisProto === proto) {
        return true;
      }
      if (thisProto === Object.prototype) {
        return false;
      }
      return baseProto.hasPrototype.call(thisProto, proto);
    }
  };

  Protomatter.create = function(protoProps, superProto, privateMode) {
    var privateMethods,
        proto;

    if (typeof privateMode === 'undefined') {
      privateMode = true;
    }

    if (superProto) {
      proto = Object.create(superProto);
      proto.callSuper = createCallSuper(superProto);
    } else {
      proto = Object.create(baseProto);
    }

    objForEach(protoProps, function(prop, key) {
      if (key !== 'private') {
        proto[key] = prop;
      }
    });

    if (privateMode) {
      privateMethods = protoProps.private;
    }

    proto.create = function() {
      var newObject = Object.create(proto),
          privateContext,
          initContext;

      if (privateMode) {
        privateContext = preparePrivateContext(newObject, privateMethods, proto);
      }

      if (typeof proto.initialize === 'function') {
        initContext = privateMode ? privateContext : newObject;
        proto.initialize.apply(initContext, arguments);
      }
      return newObject;
    };

    return proto;
  };

  function createCallSuper(superProto) {
    return function callSuper(methodName) {
      var args;
      if (typeof superProto[methodName] !== 'function') {
        throw new Error('Method ' + methodName + ' is not defined.');
      }
      args = slice.call(arguments, 1);
      return superProto[methodName].apply(this, args);
    };
  }

  function objForEach(object, callback) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        callback(object[key], key);
      }
    }
  }

  function preparePrivateContext(newObject, methods, proto) {
    var privateContext = Object.create(newObject);
    privateContext.public = newObject;

    objForEach(methods, function(method, name) {
      privateContext[name] = method;
    });

    objForEach(proto, function(method, name) {
      if (typeof method === 'function') {
        newObject[name] = method.bind(privateContext);
      }
    });

    return privateContext;
  }

  // Export properly in Node.js/Browserify:
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Protomatter;
    }
    exports.Protomatter = Protomatter;
  } else {
    root.Protomatter = Protomatter;
  }
})(this);
