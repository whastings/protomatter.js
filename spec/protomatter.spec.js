'use strict';

var expect,
    Protomatter,
    sinon;

if (typeof require === 'function') {
  expect = require('chai').expect;
  Protomatter = require('../protomatter');
  sinon = require('sinon');
} else {
  expect = window.chai.expect;
  Protomatter = window.Protomatter;
  sinon = window.sinon;
}

describe('Protomatter', function() {
  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('.create', function() {
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
    });
  });

  describe('.compose', function() {
    var Commentable,
        Likeable,
        Post,
        commentSpy,
        likeSpy,
        post;

    beforeEach(function() {
      commentSpy = sandbox.spy();
      likeSpy = sandbox.spy();

      Commentable = Protomatter.create({
        addComment: function() {
          this.saveComment();
        },
        init: function() {
          this.comments = [];
        },
        numComments: function() {
          return this.comments.length;
        },
        private: {
          saveComment: commentSpy
        }
      });

      Likeable = Protomatter.create({
        init: function() {
          this.liked = false;
        },
        isLiked: function() {
          return this.liked;
        },
        like: function() {
          this.saveLike();
        },
        private: {
          saveLike: likeSpy
        }
      });

      Post = Protomatter.create({
        getText: function() {
          return this.text;
        },
        getTitle: function() {
          return this.title;
        },
        init: function(title, text) {
          this.title = title;
          this.text = text;
        }
      });

      Post = Protomatter.compose(Post, Commentable, Likeable);
      post = Post.create('Prototypal OO', '...');
    });

    it('should create a prototype composed of all passed prototypes', function() {
      post.addComment();
      post.like();

      expect(post.saveComment).to.be.undefined;
      expect(post.saveLike).to.be.undefined;
      expect(commentSpy.calledOnce).to.be.true;
      expect(likeSpy.calledOnce).to.be.true;
    });

    it('should invoke all init methods when creating an instance', function() {
      ['comments', 'liked', 'text', 'title'].forEach(function(attr) {
        expect(post[attr]).to.be.undefined;
      });
      expect(post.numComments()).to.equal(0);
      expect(post.isLiked()).to.be.false;
      expect(post.getText()).to.equal('...');
      expect(post.getTitle()).to.equal('Prototypal OO');
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

  describe('Proto.callSuper', function() {
    var object,
        Proto,
        returnVal,
        SuperProto,
        spy;

    beforeEach(function() {
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

  describe('Proto.extend', function() {
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

  describe('Proto.mixIn', function() {
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
});
