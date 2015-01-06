describe('Proto.extend()', function() {
  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('delegates to Protomatter.create() to set up inheritance', function() {
    var Proto = Protomatter.create({}),
        props = {},
        options = {foo: 'bar'},
        result = {},
        spy = sandbox.stub(Protomatter, 'create');
    spy.returns(result);

    expect(Proto.extend(props, options)).to.equal(result);
    expect(
      spy.calledWith(props, {foo: 'bar', superProto: Proto})
    ).to.be.true;
  });
});
