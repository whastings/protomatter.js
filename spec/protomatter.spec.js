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

});
