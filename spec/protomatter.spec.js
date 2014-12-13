'use strict';

var Protomatter = require('../protomatter.js');

describe('Protomatter', function() {

  describe('.create', function() {

    it('adds a create method to the prototype', function() {
      var proto = Protomatter.create({});
      expect(typeof proto.create).toBe('function');
    });

    it('adds passed properties to the prototype', function() {
      var proto = Protomatter.create({var1: 'value1', var2: 'value2'});
      expect(proto.var1).toBe('value1');
      expect(proto.var2).toBe('value2');
    });

    it('leaves the private property off the prototype', function() {
      var proto = Protomatter.create({var1: 'value1', private: {}});
      expect(proto.var1).toBe('value1');
      expect(proto.private).toBeUndefined();
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
        getVar1: function() {
          return this.var1;
        },
        getVar2: function() {
          return this.var2;
        },
        initialize: function(var1, var2, var3) {
          this.var1 = var1;
          this.var2 = var2;
          this.public.var3 = var3;
        },
        private: {
          privateMethod: function() {
            return this.var1 + ' ' + this.var2;
          }
        },
        publicMethod: function() {
          return this.privateMethod();
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
      expect(newObject.getVar1()).toBe('value1');
      expect(newObject.getVar2()).toBe('value2');
    });

    it('protects instance variables from public access', function() {
      expect(newObject.var1).toBeUndefined();
      expect(newObject.var2).toBeUndefined();
    });

    it('allows access to instance variables explicitly made public', function() {
      expect(newObject.var3).toBe('value3');
    });

    it('protects private methods from being called externally', function() {
      expect(newObject.publicMethod()).toBe('value1 value2');
      expect(newObject.privateMethod).toBeUndefined();
    });

    describe('when private mode off', function() {
      beforeEach(function() {
        Proto = Protomatter.create({
          initialize: function(var1, var2) {
            this.var1 = var1;
            this.var2 = var2;
          }
        }, null, false);
        newObject = Proto.create('value1', 'value2');
      });

      it('does not prevent public access to instance variables', function() {
        expect(newObject.var1).toBe('value1');
        expect(newObject.var2).toBe('value2');
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

  describe('Proto.hasPrototype', function() {
    var GrandProto,
        object,
        ParentProto,
        Proto;

    beforeEach(function() {
      GrandProto = Protomatter.create({});
      ParentProto = Protomatter.create({}, GrandProto);
      Proto = Protomatter.create({}, ParentProto);
      object = Proto.create();
    });

    it('returns true for the immediate prototype', function() {
      expect(object.hasPrototype(Proto)).toBe(true);
    });

    it('returns true for the second prototype in the chain', function() {
      expect(object.hasPrototype(ParentProto)).toBe(true);
    });

    it('returns true for the third prototype in the chain', function() {
      expect(object.hasPrototype(GrandProto)).toBe(true);
    });

    it('returns false for a prototype that is not in the chain', function() {
      var OtherProto = Protomatter.create({});
      expect(object.hasPrototype(OtherProto)).toBe(false);
    });
  });

});
