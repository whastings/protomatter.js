describe('Proto.callSuper()', function() {
  var sandbox,
      object,
      Proto,
      returnVal,
      SuperProto,
      spy;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    SuperProto = Protomatter.create({
      superMethod: function() {}
    });

    spy = sandbox.stub(SuperProto, 'superMethod');
    spy.returns('return value');

    Proto = SuperProto.extend({
      protoMethod: function() {
        return this.callSuper('superMethod', 'an argument');
      }
    });
    object = Proto.create();
    returnVal = object.protoMethod();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('calls the specified method in the super prototype', function() {
    expect(spy.calledOnce).to.be.true;
  });

  it('calls the super prototype method with the passed args', function() {
    expect(spy.calledWith('an argument')).to.be.true;
  });

  it('returns the return value of the super prototype method', function() {
    expect(returnVal).to.equal('return value');
  });

  it('throws an error if asked to call a non-existing method', function() {
    var badSuperCall = function() {
      object.callSuper('missingMethod');
    };
    expect(badSuperCall).to.throw(Error);
  });

  it('calls up multiple levels of inheritance', function() {
    var superCalled = false,
        callCount = 0;
    var Proto = Protomatter.create({
      init: function() {
        superCalled = true;
        callCount += 1;
      }
    });
    var Proto2 = Proto.extend({
      init: function() {
        this.callSuper('init');
        callCount += 1;
      }
    });
    var Proto3 = Proto2.extend({});
    var instance = Proto3.create();

    expect(superCalled).to.be.true;
    expect(callCount).to.equal(2);
  });

  it('calls method in the appropriate next level', function() {
    var Proto = Protomatter.create({
      topMethod: sandbox.spy()
    });
    var Proto2 = Proto.extend({
      middleMethod: function() {
        this.callSuper('topMethod');
      },
      topMethod: function() {}
    });
    var Proto3 = Proto2.extend({});
    var Proto4 = Proto3.extend({
      bottomMethod: function() {
        this.callSuper('middleMethod');
      }
    });
    var instance = Proto4.create();
    instance.bottomMethod();

    expect(Proto.topMethod.calledOnce).to.be.true;
  });
});
