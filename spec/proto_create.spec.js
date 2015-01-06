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
});
