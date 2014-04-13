/*!
 * Protomatter.js 0.1.0
 * https://github.com/whastings/protomatter.js
 * (c) 2014 Will Hastings
 * Protomatter.js may be freely distributed under the MIT license.
 */

(function(root) {
  "use strict";

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

  Protomatter.create = function(proto, superProto) {
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

    proto.create = function() {
      var newObject = Object.create(proto);
      if (typeof proto.initialize === 'function') {
        proto.initialize.apply(newObject, arguments);
      }
      return newObject;
    };

    proto.getPrototype = getPrototype;
    proto.hasPrototype = hasPrototype;

    return proto;
  };

})(this);
