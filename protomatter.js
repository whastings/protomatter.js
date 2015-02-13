/*!
 * Protomatter.js 0.2.0
 * https://github.com/whastings/protomatter.js
 * (c) 2015 Will Hastings
 * Protomatter.js may be freely distributed under the MIT license.
 */

(function(root) {
  'use strict';

  var Protomatter = {},
      slice = Array.prototype.slice,
      objProto = Object.prototype,
      globalContext = typeof global === 'undefined' ? window : global;

  var COMPOSE_NUM_ERROR = 'Pass two or more prototypes to compose them.',
      CONSTRUCTOR_ERROR = 'Constructor passed is not a function.',
      MIXIN_ALLOWED_ERROR = 'This object type does not accept mixins.',
      MIXIN_ERROR = 'Mixin passed is not an object',
      PRIVATE_METHOD_ERROR = 'Private methods passed must be in an object.',
      PROTO_OBJ_ERROR = 'Prototype passed is not an object.',
      SUPER_PROTO_ERROR = 'Given superProto is not an object.';

  /**
   * Creates a new Protomatter prototype.
   *
   * @param    {Object}  protoProps - The properties to add
   *                     to the new prototype. Can also be a function
   *                     that returns an object with properties.
   * @property {Object}  [protoProps.private] - Any private methods.
   * @param    {Object}  [options] - Configuration for the new prototype.
   * @property {Boolean} [options.allowMixins=true] - Whether to allow mixins
   *                     to be applied to instances.
   * @property {Object}  [options.superProto] - The prototype object for the
   *                     new prototype to inherit from.
   *
   * @throws   Error if superProto given is not an object.
   * @throws   Error if private key is not an object.
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
    protoProps = protoProps || {};

    if (isFunction(protoProps)) {
      protoProps = protoProps();
    }

    if (superProto) {
      if (!isObject(superProto)) {
        throw new Error(SUPER_PROTO_ERROR);
      }
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
      if (!isObject(privateMethods)) {
        throw new Error(PRIVATE_METHOD_ERROR);
      }
      /**
       * Adds prototype's private methods to another object
       * @private
       *
       * @param {Object}  context - The object to copy private methods to.
       * @param {Boolean} [softBind] - If true, softbind each method to the context.
       */
      proto._copyPrivate = function(context, softBind) {
        objForEach(privateMethods, function(method, name) {
          if (softBind) {
            context[name] = function protomatterPrivateWrapper() {
              var callContext = (this === globalContext || this === undefined) ?
                context : this;
              return method.apply(callContext, arguments);
            };
          } else {
            context[name] = method;
          }
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
          privateContext = preparePrivateContext(newObject, proto),
          args;

      privateContext.allowMixins = !!options.allowMixins;
      if (isFunction(proto.init)) {
        if (proto.hasOwnProperty('init')) {
          proto.init.apply(privateContext, arguments);
        } else {
          args = slice.call(arguments);
          args.unshift('init');
          proto.callSuper.apply(privateContext, args);
        }
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
     * @throws Error if mixin passed isn't an object.
     */
    proto.mixIn = mixIn;

    return proto;
  };

  /**
   * Creates a prototype from multiple objects.
   *
   * @param  {...Objects} - Objects to combine into a new prototype.
   *
   * @throws Error if less than two prototypes passed.
   * @return {Object} The new prototype.
   */
  Protomatter.compose = function() {
    var protos = arguments,
        length = protos.length,
        protoProps = {private: {}},
        initializers = [],
        proto,
        i;

    if (length < 2) {
      throw new Error(COMPOSE_NUM_ERROR);
    }

    for (i = 0; i < length; i++) {
      proto = protos[i];
      mixinProto(protoProps, proto);
      if (isFunction(proto.init)) {
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
   * @throws Error if constructor passed isn't a function.
   * @return {Object} The converted prototype.
   */
  Protomatter.convert = function(constructor, options) {
    var Proto;
    options = options || {};

    if (!isFunction(constructor)) {
      throw new Error(CONSTRUCTOR_ERROR);
    }

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
      if (isFunction(proto._copyPrivate)) {
        proto._copyPrivate(privateContext, true);
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
    var method,
        name;

    for (name in proto) {
      method = proto[name];
      // Don't bind methods on Object.prototype.
      if (!isFunction(method) || method === objProto[name]) {
        continue;
      }

      newObject[name] = (function(methodName) {
        return function protomatterPublicWrapper() {
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
    return function protomatterChainedInit() {
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
      var args, baseCallSuper, returnValue, ancestorProto;
      ancestorProto = findProto(superProto, function(testProto) {
        return testProto.hasOwnProperty(methodName) &&
          isFunction(testProto[methodName]);
      });

      if (!ancestorProto) {
        throw new Error('Method ' + methodName + ' is not defined.');
      }
      args = slice.call(arguments, 1);

      baseCallSuper = this.callSuper;
      this.callSuper = ancestorProto.callSuper;
      returnValue = ancestorProto[methodName].apply(this, args);
      this.callSuper = baseCallSuper;

      return returnValue;
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
   * Finds prototype in prototype chain that matches a given predicate function.
   * @private
   *
   * @param {Object}   proto - Prototype object to start at.
   * @param {Function} predicate - Predicate function to pass each prototype to.
   *
   * @return {Object|null} The matching prototype or null.
   */
  function findProto(proto, predicate) {
    while (proto) {
      if (predicate(proto)) {
        return proto;
      }
      proto = Object.getPrototypeOf(proto);
    }
    return null;
  }

  /**
   * Checks if value is a function.
   * @private
   *
   * @param {*} value - Value to check.
   *
   * @return {Boolean} True if value is a function.
   */
  function isFunction(value) {
    return typeof value === 'function';
  }

  /**
   * Checks if value is an object.
   * @private
   *
   * @param {*} value - Value to check.
   *
   * @return {Boolean} True if value is an object.
   */
  function isObject(value) {
    var type = typeof value;
    return type === 'object' || type === 'function';
  }

  /**
   * The implementation of proto.mixIn().
   * @private
   * @see {@link proto.mixIn}
   */
  function mixIn(mixin) {
    var destination;

    if (!this.allowMixins) {
      throw new Error(MIXIN_ALLOWED_ERROR);
    }

    if (!isObject(mixin)) {
      throw new Error(MIXIN_ERROR);
    }

    destination = typeof this.public === 'object' ? this.public : this;

    objForEach(mixin, function(prop, key) {
      if (isFunction(prop)) {
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
   *
   * @throws Error if prototype passed isn't an object.
   */
  function mixinProto(target, proto) {
    if (!isObject(proto)) {
      throw new Error(PROTO_OBJ_ERROR);
    }

    objForEach(proto, function(prop, key) {
      if (key !== 'initialize') {
        target[key] = prop;
      }
    });

    if (isFunction(proto._copyPrivate)) {
      proto._copyPrivate(target.private);
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
