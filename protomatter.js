/*!
 * Protomatter.js 0.1.0
 * https://github.com/whastings/protomatter.js
 * (c) 2015 Will Hastings
 * Protomatter.js may be freely distributed under the MIT license.
 */

/* global exports:true */
(function(root) {
  'use strict';

  var Protomatter = {},
      slice = Array.prototype.slice,
      objProto = Object.prototype;

  var MIXIN_ERROR = 'This object type does not accept mixins.';

  /**
   * Creates a new Protomatter prototype.
   *
   * @param    {Object}  protoProps - The properties to add
   *                     to the new prototype.
   * @property {Object}  [protoProps.private] - Any private methods.
   * @param    {Object}  [options] - Configuration for the new prototype.
   * @property {Boolean} [options.allowMixins=true] - Whether to allow mixins
   *                     to be applied to instances.
   * @property {Object}  [options.superProto] - The prototype object for the
   *                     new prototype to inherit from.
   *
   * @return   {Object} - The new prototype.
   */
  Protomatter.create = function(protoProps, options) {
    var privateMethods,
        proto,
        superProto;

    options = options || {};
    options.allowMixins = options.allowMixins === undefined ?
      true : options.allowMixins;
    superProto = options.superProto;

    if (superProto) {
      proto = Object.create(superProto);
      /**
       * Invokes a method on the parent prototype.
       *
       * @param {String} methodName - Name of the method to invoke.
       * @param {...*} - Any args to pass to the invoked method.
       *
       * @throws Error if method doesn't exist.
       * @return {*} Return value of the called method.
       */
      proto.callSuper = createCallSuper(superProto);
    } else {
      proto = {};
    }

    objForEach(protoProps, function(prop, key) {
      if (key !== 'private') {
        proto[key] = prop;
      }
    });

    privateMethods = protoProps.private;
    if (privateMethods) {
      /**
       * Adds prototype's private methods to another object
       * @private
       *
       * @param {Object} context - The object to copy private methods to.
       */
      proto._bindPrivate = function(context) {
        objForEach(privateMethods, function(method, name) {
          context[name] = method;
        });
      };
    }

    /**
     * Creates a new instance of the prototype.
     *
     * @param  {...*} - Arguments to pass to init for the instance.
     *
     * @return {Object} The new prototype instance.
     */
    proto.create = function() {
      var newObject = Object.create(proto),
          privateContext = preparePrivateContext(newObject, proto);

      privateContext.allowMixins = !!options.allowMixins;
      if (typeof proto.init === 'function') {
        proto.init.apply(privateContext, arguments);
      }
      return newObject;
    };

    /**
     * Creates a new prototype that inherits from this prototype,
     * passing protoProps and options to Protomatter.create();
     * @see {@link Protomatter.create}
     */
    proto.extend = extend;
    /**
     * Mixes in new properties to a Protomatter prototype instance.
     *
     * @param {Object} mixin - Object with the properties to mix in.
     *
     * @throws Error if instance's prototype has allowMixins set to false.
     */
    proto.mixIn = mixIn;

    return proto;
  };

  /**
   * Creates a prototype from multiple objects.
   *
   * @param  {...Objects} - Objects to combine into a new prototype.
   *
   * @return {Object} The new prototype.
   */
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
      if (typeof proto.init === 'function') {
        initializers.push(proto.init);
      }
    }

    if (initializers.length > 0) {
      protoProps.init = chainInitializers(initializers);
    }

    return this.create(protoProps);
  };

  /**
   * Converts a constructor function to a Protomatter prototype.
   *
   * @param {Function} constructor - The constructor to convert.
   * @param {Object}   options - The options to pass to Protomatter.create().
   *
   * @return {Object} The converted prototype.
   */
  Protomatter.convert = function(constructor, options) {
    var Proto;
    options = options || {};
    if (constructor.prototype !== objProto) {
      options.superProto = Object.getPrototypeOf(constructor.prototype);
    }

    Proto = Protomatter.create(constructor.prototype, options);
    Proto.init = constructor;
    return Proto;
  };

  /**
   * Binds private methods to a new instance's private context.
   * @private
   *
   * @param {Object} privateContext - The instance's private context.
   * @param {Object} proto - The new instance's prototype.
   */
  function bindPrivateMethods(privateContext, proto) {
    while (proto && proto !== objProto) {
      if (typeof proto._bindPrivate === 'function') {
        proto._bindPrivate(privateContext);
      }
      proto = Object.getPrototypeOf(proto);
    }
  }

  /**
   * Binds public methods to new instance with private context as their context.
   * @private
   *
   * @param {Object} proto - The instance's prototype.
   * @param {Object} newObject - The new instance.
   * @param {Object} privateContext - The new instance's private context
   */
  function bindPublicMethods(proto, newObject, privateContext) {
    var globalContext = typeof global === 'undefined' ? window : global,
        method,
        name;

    for (name in proto) {
      method = proto[name];
      // Don't bind methods on Object.prototype.
      if (typeof method !== 'function' || method === objProto[name]) {
        continue;
      }

      newObject[name] = (function(methodName) {
        return function() {
          var usePrivateContext, context;
          // Allow context to be overriden by apply() or call(),
          // but prevent context to be global scope or undefined.
          usePrivateContext = this === newObject || this === globalContext ||
            this === undefined;
          context = usePrivateContext ? privateContext : this;
          // Look up method again to allow late-binding.
          return proto[methodName].apply(context, arguments);
        };
      })(name);
    }
  }

  /**
   * Wraps multiple functions in one that will invoke them with its arguments.
   * @private
   *
   * @param {Array}     initializers - The init functions to chain.
   *
   * @return {Function} The wrapper function.
   */
  function chainInitializers(initializers) {
    return function() {
      for (var i = 0, length = initializers.length; i < length; i++) {
        initializers[i].apply(this, arguments);
      }
    };
  }

  /**
   * Creates the callSuper method for a new prototype.
   * @private
   *
   * @param   {Object} superProto - The prototype to invoke methods from.
   *
   * @return  {Function} The callSuper method linked to superProto.
   */
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

  /**
   * The implementation of proto.extend()
   * @private
   * @see {@link proto.extend}
   */
  function extend(protoProps, options) {
    options = options || {};
    options.superProto = this;
    return Protomatter.create(protoProps, options);
  }

  /**
   * The implementation of proto.mixIn().
   * @private
   * @see {@link proto.mixIn}
   */
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

  /**
   * Copies the properties of one prototype into another.
   * @private
   *
   * @param {Object} target - The object to copy the properties to.
   * @param {Object} proto - The object to copy the properties from.
   */
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

  /**
   * Applies a callback to the own properties of an object.
   * @private
   *
   * @param {Object}   object - The object to iterate over.
   * @param {Function} callback - The function to call with each value and key.
   */
  function objForEach(object, callback) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        callback(object[key], key);
      }
    }
  }

  /**
   * Creates the private context for a new prototype instance.
   * @private
   *
   * @param  {Object} newObject - The new instance.
   * @param  {Object} proto - The new instance's prototype.
   *
   * @return {Object} The new instance's private context.
   */
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
