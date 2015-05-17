describe('Proto.create()', function() {
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
      init: function(var1, var2, var3) {
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
      statics: {
        iAmStatic: function() {},
        pi: 3.14
      },
      testProperty: 'test value'
    });
    newObject = Proto.create('value1', 'value2', 'value3');
  });

  it('returns an object with proto as its prototype', function() {
    expect(Object.getPrototypeOf(newObject)).to.equal(Proto);
  });

  it('returns an object that can access its properties', function() {
    expect(newObject.testProperty).to.equal('test value');
  });

  it('invokes its init function to set initial state', function() {
    expect(newObject.getVar1()).to.equal('value1');
    expect(newObject.getVar2()).to.equal('value2');
  });

  it('protects instance variables from public access', function() {
    expect(newObject.var1).to.be.undefined;
    expect(newObject.var2).to.be.undefined;
  });

  it('allows access to instance variables explicitly made public', function() {
    expect(newObject.var3).to.equal('value3');
  });

  it('protects private methods from being called externally', function() {
    expect(newObject.publicMethod()).to.equal('value1 value2');
    expect(newObject.privateMethod).to.be.undefined;
  });

  it('allows changing context for public method', function() {
    var newContext = {var1: 'something else'};
    expect(newObject.getVar1.call(newContext)).to.equal('something else');
  });

  it('calls public methods using late-binding', function() {
    Proto.getVar1 = function() {
      return 'something else';
    };

    expect(newObject.getVar1()).to.equal('something else');
  });

  it('prevents public methods from executing w/ global context', function() {
    var method = newObject.getVar1;

    expect(method()).to.equal('value1');
  });

  it('prevents public methods from executing w/ undefined context', function() {
    var method = newObject.getVar1;

    expect(method.call(undefined)).to.equal('value1');
  });

  it('binds all public methods in prototype chain to private context', function() {
    var Proto2,
        Proto3;

    Proto2 = Proto.extend({
      getFoo: function() {
        return this.foo;
      }
    });
    Proto3 = Proto2.extend({
      getBar: function() {
        return this.bar;
      },
      init: function(var1, foo, bar) {
        this.var1 = var1;
        this.foo = foo;
        this.bar = bar;
      }
    });

    newObject = Proto3.create('value1', 'baz', 'qux');
    expect(newObject.getVar1()).to.equal('value1');
    expect(newObject.getFoo()).to.equal('baz');
    expect(newObject.getBar()).to.equal('qux');
  });

  it('binds all private methods in prototype chain to private context', function() {
    var Proto2 = Proto.extend({});
    newObject = Proto2.create('foo', 'bar', 'baz');

    expect(newObject.publicMethod()).to.equal('foo bar');
  });

  it('prevents private method from executing with global context', function() {
    Proto.callPrivate = function() {
      var privateMethod = this.privateMethod;
      return privateMethod();
    };
    newObject = Proto.create('foo', 'bar', 'baz');

    expect(newObject.callPrivate()).to.equal('foo bar');
  });

  it('prevents private method from executing with undefined context', function() {
    Proto.callPrivate = function() {
      return this.privateMethod.call(undefined);
    };
    newObject = Proto.create('foo', 'bar', 'baz');

    expect(newObject.callPrivate()).to.equal('foo bar');
  });

  it('allows changing context for private method', function() {
    Proto.callPrivate = function(context) {
      return this.privateMethod.call(context);
    };
    newObject = Proto.create('foo', 'bar', 'baz');

    expect(newObject.callPrivate({var1: 'baz', var2: 'qux'})).to.equal('baz qux');
  });

  describe('static props', function() {
    var specialProps = ['create', 'extend'],
        staticProps = ['iAmStatic', 'pi'];

    it('sets a non-enumerable, undefined var for each static/special prop on an instance', function() {
      staticProps.concat(specialProps).forEach(function(prop) {
        var propDescriptor;
        expect(newObject[prop]).to.be.undefined;
        if (Object.getOwnPropertyDescriptor) {
          propDescriptor = Object.getOwnPropertyDescriptor(newObject, prop);
          expect(propDescriptor.enumerable).to.be.false;
        }
      });
    });

    it('makes statics available on prototype', function() {
      expect(Proto.iAmStatic).to.be.a('function');
      expect(Proto.pi).to.equal(3.14);
    });
  });
});
