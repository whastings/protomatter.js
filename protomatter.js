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
      objProto = Object.prototype;

  var MIXIN_ERROR = 'This object type does not accept mixins.';

  Protomatter.create = function(protoProps, options) {
    var privateMode,
        privateMethods,
        proto,
        superProto;

    options = options || {};
    options.allowMixins = options.allowMixins === undefined ?
      true : options.allowMixins;
    privateMode = options.privateMode === undefined ? true : options.privateMode;
    superProto = options.superProto;

    if (superProto) {
      proto = Object.create(superProto);
      proto.callSuper = createCallSuper(superProto);
    } else {
      proto = {};
    }

    objForEach(protoProps, function(prop, key) {
      if (key !== 'private') {
        proto[key] = prop;
      }
    });

    if (privateMode) {
      privateMethods = protoProps.private;
      if (privateMethods) {
        proto._bindPrivate = function(context) {
          objForEach(privateMethods, function(method, name) {
            context[name] = method;
          });
        };
      }
    }

    proto.create = function() {
      var newObject = Object.create(proto),
          privateContext,
          initContext;

      if (privateMode) {
        privateContext = preparePrivateContext(newObject, proto);
      }

      initContext = privateMode ? privateContext : newObject;
      initContext.allowMixins = !!options.allowMixins;
      if (typeof proto.initialize === 'function') {
        proto.initialize.apply(initContext, arguments);
      }
      return newObject;
    };

    proto.extend = extend;
    proto.mixIn = mixIn;

    return proto;
  };

  Protomatter.compose = function() {
    var protos = arguments,
        length = protos.length,
        protoProps = {private: {}},
        initializers = [],
        proto,
        i;

    for (i = 0; i < length; i++) {
      proto = protos[i];
      mixinProto(protoProps, proto);
      if (typeof proto.initialize === 'function') {
        initializers.push(proto.initialize);
      }
    }

    if (initializers.length > 0) {
      protoProps.initialize = chainInitializers(initializers);
    }

    return this.create(protoProps);
  };

  function bindPrivateMethods(privateContext, proto) {
    while (proto && proto !== objProto) {
      if (typeof proto._bindPrivate === 'function') {
        proto._bindPrivate(privateContext);
      }
      proto = Object.getPrototypeOf(proto);
    }
  }

  function bindPublicMethods(proto, newObject, privateContext) {
    var method,
        name;

    for (name in proto) {
      method = proto[name];
      // Don't bind methods on Object.prototype.
      if (typeof method !== 'function' || method === objProto[name]) {
        continue;
      }

      newObject[name] = (function(methodName) {
        return function() {
          // Allow context to be overriden by apply() or call().
          var context = this === newObject ? privateContext : this;
          // Look up method again to allow late-binding.
          return proto[methodName].apply(context, arguments);
        };
      })(name);
    }
  }

  function chainInitializers(initializers) {
    return function() {
      for (var i = 0, length = initializers.length; i < length; i++) {
        initializers[i].apply(this, arguments);
      }
    };
  }

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

  function extend(props, options) {
    options = options || {};
    options.superProto = this;
    return Protomatter.create(props, options);
  }

  function mixIn(mixin) {
    var destination;

    if (!this.allowMixins) {
      throw new Error(MIXIN_ERROR);
    }

    destination = typeof this.public === 'object' ? this.public : this;

    objForEach(mixin, function(prop, key) {
      if (typeof prop === 'function') {
        prop = prop.bind(this);
      }
      destination[key] = prop;
    }.bind(this));
  }

  function mixinProto(target, proto) {
    objForEach(proto, function(prop, key) {
      if (key !== 'initialize') {
        target[key] = prop;
      }
    });

    if (typeof proto._bindPrivate === 'function') {
      proto._bindPrivate(target.private);
    }
  }

  function objForEach(object, callback) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        callback(object[key], key);
      }
    }
  }

  function preparePrivateContext(newObject, proto) {
    var privateContext = Object.create(newObject);
    privateContext.public = newObject;

    bindPrivateMethods(privateContext, proto);
    bindPublicMethods(proto, newObject, privateContext);

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
