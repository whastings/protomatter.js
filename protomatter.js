/*!
 * Protomatter.js 0.1.0
 * https://github.com/whastings/protomatter.js
 * (c) 2014 Will Hastings
 * Protomatter.js may be freely distributed under the MIT license.
 */

(function(root) {
  'use strict';

  var Protomatter = {};

  // Export properly in Node.js/Browserify:
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Protomatter;
    }
    exports.Protomatter = Protomatter;
  } else {
    root.Protomatter = Protomatter;
  }

  // Convert object properties to property descriptors.
  var getDescriptors = function(object) {
    var properties = {};
    for (var property in object) {
      if (!object.hasOwnProperty(property)) {
        continue;
      }
      properties[property] = { value: object[property] };
    }
    return properties;
  };

  var getPrototype = function() {
    return Object.getPrototypeOf(this);
  };

  var hasPrototype = function(proto) {
    var thisProto = Object.getPrototypeOf(this);
    if (thisProto === proto) {
      return true;
    }
    if (thisProto === Object.prototype) {
      return false;
    }
    return hasPrototype.call(thisProto, proto);
  };

  Protomatter.create = function(proto, superProto, privateMode) {
    var privateMethods;

    if (typeof privateMode === 'undefined') {
      privateMode = true;
    }

    if (superProto) {
      proto = Object.create(superProto, getDescriptors(proto));
      proto.callSuper = function(methodName) {
        if (typeof superProto[methodName] !== 'function') {
          throw new Error('Method ' + methodName + ' is not defined.');
        }
        var args = Array.prototype.slice.call(arguments, 1);
        return superProto[methodName].apply(this, args);
      };
    }

    if (privateMode) {
      privateMethods = proto.private;
      delete proto.private;
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

    proto.getPrototype = getPrototype;
    proto.hasPrototype = hasPrototype;

    return proto;
  };

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
        if (name === 'hasPrototype' || name === 'getPrototype') {
          return;
        }
        newObject[name] = method.bind(privateContext);
      }
    });

    return privateContext;
  }

})(this);
