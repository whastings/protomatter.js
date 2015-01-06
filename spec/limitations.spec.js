describe('limitations', function() {
  var Proto;

  beforeEach(function() {
    Proto = Protomatter.create({
      init: function() {
        this.foo = 'bar';
      }
    });
  });

  it('methods added after instantiation cannot access private context', function() {
    var instance = Proto.create();
    instance.getFoo = function() {
      return this.foo;
    };

    expect(instance.getFoo()).to.be.undefined;
  });

  it('methods added to prototype after instantiation cannot access private context', function() {
    var instance = Proto.create();
    Proto.getFoo = function() {
      return this.foo;
    };

    expect(instance.getFoo()).to.be.undefined;
  });

  describe('instanceof', function() {
    var Proto2,
        instance;

    beforeEach(function() {
      Proto2 = Proto.extend({});
      instance = Proto2.create();
    });

    it('throws an error when passed a prototype', function() {
      expect(function() {
        instance instanceof Proto2;
      }).to.throw(Error);
    });

    it('can be replaced with isPrototypeOf()', function() {
      expect(Proto2.isPrototypeOf(instance)).to.be.true;
      expect(Proto.isPrototypeOf(instance)).to.be.true;
    });
  });
});
