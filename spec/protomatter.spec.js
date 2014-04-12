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

});
