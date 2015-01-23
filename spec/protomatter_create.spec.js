describe('Protomatter.create()', function() {
  it('adds a create method to the prototype', function() {
    var proto = Protomatter.create({});
    expect(proto.create).to.be.a('function');
  });

  it('adds passed properties to the prototype', function() {
    var proto = Protomatter.create({var1: 'value1', var2: 'value2'});
    expect(proto.var1).to.equal('value1');
    expect(proto.var2).to.equal('value2');
  });

  it('leaves the private property off the prototype', function() {
    var proto = Protomatter.create({var1: 'value1', private: {}});
    expect(proto.var1).to.equal('value1');
    expect(proto.private).to.be.undefined;
  });

  describe('with a super prototype', function() {
    var proto,
        superProto = {superProperty: 'super value'},
        properties = {testProperty: 'test value'};

    beforeEach(function() {
      proto = Protomatter.create(properties, {superProto: superProto});
    });

    it("sets proto's prototype to superProto", function() {
      expect(Object.getPrototypeOf(proto)).to.equal(superProto);
    });

    it('preserves the original property values', function() {
      expect(proto.testProperty).to.equal('test value');
    });

    it('makes superProto properties available to proto', function() {
      expect(proto.superProperty).to.equal('super value');
    });

    it('adds a callSuper method to proto', function() {
      expect(proto.callSuper).to.be.a('function');
    });

    it('throws an error if superProto is not an object', function() {
      expect(function() {
        Protomatter.create({}, {superProto: 'darkside'});
      }).to.throw(Error, 'Given superProto is not an object.');
    });
  });

  it('creates an empty prototype if no properties are passed', function() {
    var proto = Protomatter.create();

    // Only three properties added by Protomatter.create().
    expect(Object.keys(proto).length).to.equal(3);
  });

  it('throws an error if protoProps.private is not an object', function() {
    expect(function() {
      Protomatter.create({private: 'darkside'});
    }).to.throw(Error);
  });
});
