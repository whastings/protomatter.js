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

    Post = Protomatter.create({
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
    });

    Post = Protomatter.compose(Post, Commentable, Likeable);
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
