describe('Proto.mixIn()', function() {
  var Proto,
      instance,
      mixin;

  beforeEach(function() {
    Proto = Protomatter.create({});
    instance = Proto.create();
    mixin = {
      getThing: function() {
        return this.thing;
      },
      setThing: function(thing) {
        this.thing = thing;
      }
    };
  });

  it('mixes in functions, binding them to instance private context', function() {
    instance.mixIn(mixin);

    instance.setThing('foo');
    expect(instance.thing).to.be.undefined;
    expect(instance.getThing()).to.equal('foo');
  });

  it('throws an error if proto disallows mixins', function() {
    Proto = Protomatter.create({}, {allowMixins: false});
    instance = Proto.create();
    function tryMixin() {
      instance.mixIn(mixin);
    }

    expect(tryMixin).to.throw(Error);
    expect(instance.getThing).to.be.undefined;
    expect(instance.setThing).to.be.undefined;
  });
});
