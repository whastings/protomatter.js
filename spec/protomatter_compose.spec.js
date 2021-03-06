describe('Protomatter.compose()', function() {
  var sandbox,
      Commentable,
      Likeable,
      Post,
      commentSpy,
      likeSpy,
      post;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    commentSpy = sandbox.spy();
    likeSpy = sandbox.spy();

    Commentable = Protomatter.create({
      addComment: function() {
        this.saveComment();
      },
      init: function(options) {
        this.comments = options.comments;
      },
      numComments: function() {
        return this.comments.length;
      },
      private: {
        saveComment: commentSpy
      }
    });

    Likeable = Protomatter.create({
      init: function(options) {
        this.liked = options.liked;
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

    Post = Protomatter.compose({
      getText: function() {
        return this.text;
      },
      getTitle: function() {
        return this.title;
      },
      init: function(options) {
        this.title = options.title;
        this.text = options.text;
      }
    }, Commentable, Likeable);

    post = Post.create({
      comments: [],
      liked: false,
      text: '...',
      title: 'Prototypal OO'
    });
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('creates a prototype composed of all passed prototypes', function() {
    post.addComment();
    post.like();

    expect(post.saveComment).to.be.undefined;
    expect(post.saveLike).to.be.undefined;
    expect(commentSpy.calledOnce).to.be.true;
    expect(likeSpy.calledOnce).to.be.true;
  });

  it('invokes all init methods when creating an instance', function() {
    ['comments', 'liked', 'text', 'title'].forEach(function(attr) {
      expect(post[attr]).to.be.undefined;
    });
    expect(post.numComments()).to.equal(0);
    expect(post.isLiked()).to.be.false;
    expect(post.getText()).to.equal('...');
    expect(post.getTitle()).to.equal('Prototypal OO');
  });

  it('throws an error if less than two arguments passed', function() {
    expect(function() {
      Protomatter.compose({});
    }).to.throw(Error);
  });

  it('throws an error if prototype passed is not an object', function() {
    expect(function() {
      Protomatter.compose({}, 'darkside');
    }).to.throw(Error);
  });
});
