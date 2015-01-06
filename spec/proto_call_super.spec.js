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
});
