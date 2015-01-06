describe('Protomatter.convert()', function() {
  var Constructor;

  beforeEach(function() {
    Constructor = function(foo, bar) {
      this.foo = foo;
      this.bar = bar;
    };

    Constructor.prototype.double = function(num) {
      return num * 2;
    };
    Constructor.prototype.getBar = function() {
      return this.bar;
    };
    Constructor.prototype.getFoo = function() {
      return this.foo;
    };
  });

  it('takes a constructor and returns a prototype based on its prototype', function() {
    var ConvertedProto = Protomatter.convert(Constructor),
        instance = ConvertedProto.create();

    expect(instance.double(3)).to.equal(6);
  });

  it('invokes the constructor when creating an instance', function() {
    var ConvertedProto = Protomatter.convert(Constructor),
        instance = ConvertedProto.create('baz', 'qux');

    expect(instance.getBar()).to.equal('qux');
    expect(instance.getFoo()).to.equal('baz');
  });

  it('returns a prototype that can be extended', function() {
    var Proto2 = Protomatter.convert(Constructor).extend({
      init: function(name, foo, bar) {
        this.callSuper('init', foo, bar);
        this.name = name;
      },
      getName: function() {
        return this.name;
      }
    });
    var instance = Proto2.create('bob', 'baz', 'qux');

    expect(instance.getBar()).to.equal('qux');
    expect(instance.getFoo()).to.equal('baz');
    expect(instance.getName()).to.equal('bob');
  });

  it('passes along any prototype options', function() {
    var ConvertedProto = Protomatter.convert(Constructor, {allowMixins: false}),
        instance = ConvertedProto.create();

    expect(function() {
      instance.mixIn({});
    }).to.throw(Error);
  });
});
