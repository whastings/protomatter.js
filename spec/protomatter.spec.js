"use strict";

var Protomatter = require('../protomatter.js');

describe('Protomatter', function() {

  describe('.create', function() {

    it('adds a create method to the prototype', function() {
      var proto = Protomatter.create({testProperty: 'test value'});
      expect(typeof proto.create).toBe('function');
    });

    describe('with a super prototype', function() {
      var proto,
          superProto = {superProperty: 'super value'},
          properties = {testProperty: 'test value'};

      beforeEach(function() {
        proto = Protomatter.create(properties, superProto);
      });

      it("sets proto's prototype to superProto", function() {
        expect(Object.getPrototypeOf(proto)).toBe(superProto);
      });

      it('preserves the original property values', function() {
        expect(proto.testProperty).toBe('test value');
      });

      it('makes superProto properties available to proto', function() {
        expect(proto.superProperty).toBe('super value');
      });

      it('adds a callSuper method to proto', function() {
        expect(typeof proto.callSuper).toBe('function');
      });
    });
  });

  describe('Proto.create', function() {
    var newObject,
        Proto;

    beforeEach(function() {
      Proto = Protomatter.create({
        initialize: function(var1, var2, var3) {
          this.var1 = var1;
          this.var2 = var2;
          this.var3 = var3;
        },
        testProperty: 'test value'
      });
      newObject = Proto.create('value1', 'value2', 'value3');
    });

    it('returns an object with proto as its prototype', function() {
      expect(Object.getPrototypeOf(newObject)).toBe(Proto);
    });

    it('returns an object that can access its properties', function() {
      expect(newObject.testProperty).toBe('test value');
    });

    it('invokes its initialize function to set initial state', function() {
      [1, 2, 3].forEach(function(num) {
        expect(newObject['var' + num]).toBe('value' + num);
      });
    });
  });

  describe('Proto.callSuper', function() {
    var context,
        object,
        Proto,
        SuperProto;

    beforeEach(function() {
      SuperProto = Protomatter.create({
        superMethod: function() {
          context = this;
          return 'super method';
        }
      });
      spyOn(SuperProto, 'superMethod');
      Proto = Protomatter.create({
        protoMethod: function() {
          return this.callSuper('superMethod', 'an argument');
        }
      }, SuperProto);
      var object = Proto.create();
      object.protoMethod();
    });

    it('calls the specified method in the super prototype', function() {
      expect(SuperProto.superMethod).toHaveBeenCalled();
    });

    it('calls the super prototype method with the passed args', function() {
      expect(SuperProto.superMethod).toHaveBeenCalledWith('an argument');
    });

    it('throws an error if asked to call a non-existing method', function() {
      var badSuperCall = function() {
        object.callSuper('missingMethod');
      };
      expect(badSuperCall).toThrow();
    });

    it('calls the super prototype method with the right context', function() {
      expect(context).toBe(object);
    });
  });

  describe('Proto.getPrototype', function() {
    var object,
        Proto;

    beforeEach(function() {
      Proto = Protomatter.create({});
      object = Proto.create();
    });

    it('returns the prototype for an instance', function() {
      expect(object.getPrototype()).toBe(Proto);
    });
  });

});
