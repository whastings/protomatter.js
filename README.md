Protomatter.js
==============

Protomatter is an object creation and inheritance library for JavaScript,
featuring private instance properties and private methods.

* [Introduction](#introduction)
* [Features](#features)
* [Installation](#installation)
* [Usage](#usage)
  * [Creating a Prototype](#creating-a-prototype)
  * [Creating Instances](#creating-instances)
  * [Linking Prototypes for Inheritance](#linking-prototypes-for-inheritance)
  * [Invoking Methods from Super Prototypes](#invoking-methods-from-super-prototypes)
  * [Concatenative/Multiple Inheritance and Prototype Composition](#concatenativemultiple-inheritance-and-prototype-composition)
  * [Mixin Support](#mixin-support)
  * [Managing Public Properties](#managing-public-properties)
  * [Working with Constructors](#working-with-constructors)
* [Environment Support](#environment-support)
* [Performance Considerations](#performance-considerations)
* [Limitations](#limitations)
* [Inspirations](#inspirations)

## Introduction

Protomatter provides some of the conveniences of classical languages, such as
privacy and invoking methods of a "superclass", while utilizing the power of
JavaScript's prototypal inheritance. It's purpose is to make working directly
with JS prototypes easy and to help you create clean object APIs by
encapsulating private state and implementation details. It also enables you to
take advantage of JS as a truly class-less language with *concatenative
inheritance*.

Protomatter helps you work with JavaScript's prototypal nature by creating
prototype objects instead of constructors. It returns the prototype with a
`create()` method for easily producing new object instances linked to that
prototype. Working directly with the prototype simplifies the organization of
your code, negating the need to access the `.prototype` property of some
constructor function. Additionally, any properties you assign to `this` inside a
method will be private, innaccessible from outside the object's methods. You can
also mark methods as private when creating a prototype. No more trying to
remember to prefix everything private with underscores!

## Features

* All properties assigned to `this` are private by default.
* Private methods are only accessible from the object's own methods.
* Easy creation of prototype chains (for prototypal inheritance).
* Easy invocation of overridden methods higher up in the prototype chain.
* Easy use of concatenative (multiple) inheritance with prototype composition.
* Flexible management of public methods through late-binding.
* Extension of objects post-instantiation through mixin support.
* Works in Node.js and browsers.

## Installation

For Node.js:

```bash
npm install protomatter
```

With Bower:

```bash
bower install protomatter.js
```

## Usage

### Creating a Prototype

Use `Protomatter.create()` to set up a new prototype, passing it an object
with the properties you want available to instances created from the prototype.
Add an `init` method to set up any instance variables when your prototype
creates an instance. Place any methods that you want to be *private* under the
key `private`. All methods outside `private` will be public.

```javascript
var Modal = Protomatter.create({
  init: function(title, body, triggerEl) {
    this.title = title;
    this.body = body;
    this.triggerEl = triggerEl;
    this.attachEventListeners();
  },
  getBody: function() {
    return this.body;
  },
  getTitle: function() {
    return this.title;
  },
  hide: function() {
    this.removeBackdrop();
    // ...
  },
  private: {
    attachEventListeners: function() {
      // No need to bind this.show, as Protomatter will set context correctly.
      this.triggerEl.addEventListener('click', this.show);
    },
    removeBackdrop: function() {
      // ...
    }
  },
  show: function() {
    // ...
  }
});
```

### Creating Instances

Protomatter adds a `create()` method to your prototypes that you can call to
create instances. It invokes the `init` method on the new instance if one is
available. Any arguments passed to `create()` will be passed along to `init()`
if it was provided. Note that any instance properties you create in `init` or
any other prototype methods are private and cannot be accessed outside of the
methods from the prototype. The same goes for private methods.

```javascript
var contactModal = Modal.create(
  'Contact Us',
  'contact@protomatter.js',
  document.getElementById('contact-modal-trigger')
);

// State and private methods are inaccessible from the outside:
console.log(contactModal.title); // undefined
console.log(contactModal.body); // undefined
console.log(contactModal.triggerEl); // undefined
console.log(contactModal.attachEventListeners); // undefined
console.log(contactModal.removeBackdrop); // undefined

// Public methods are accessible and can access state:
console.log(contactModal.getBody()); // 'contact@protomatter.js'
console.log(contactModal.getTitle()); // 'Contact Us'
```

### Linking Prototypes for Inheritance

You can create a prototype linked to an existing "super prototype" by calling
its `extend()` method. Protomatter will set it as the prototype of your new
prototype, creating a *prototype chain*.

```javascript
var SlidingModal = Modal.extend({
  init: function(title, body, triggerEl, slideClass) {
    this.slideClass = slideClass;
    this.callSuper('init', title, body, triggerEl);
  },
  private: {
    removeSlideClass: function() {
      // ...
    }
  },
  show: function() {
    this.removeSlideClass();
    this.callSuper('show');
  }
});
```

You can also create a Protomatter prototype linked to a prototype object that
wasn't created with Protomatter. Simply pass the prototype object in the options
argument to `Protomatter.create()` under the key `superProto`:

```javascript
var obj = {foo: 'bar'};
var Proto = Protomatter.create({baz: 'qux'}, {superProto: obj});
```

### Invoking Methods from Super Prototypes

You may have noticed in the previous example calls to `this.callSuper()`.
When you create a prototype that inherits from another prototype, Protomatter
adds a `callSuper()` method to the new prototype. If the new prototype
defines a method by the same name, it can invoke the super prototype's version
of the method by passing the method name and any arguments to `callSuper()`.

### Concatenative/Multiple Inheritance and Prototype Composition

While Protomatter makes it easy to work with JavaScript prototypes in a
classical manner, you have the power in JavaScript to create maintainable code
without the restrictions of rigid class structures. In addition to the prototype
chain, JavaScript allows objects to be extended with new properties after
instantiation. This gives us the ability to compose an object from separate
objects, dynamically extending it with new capabilities as needed by copying the
properties from another object. This process is sometimes called *concatenative
inheritance*, and it allows for multiple inheritance in JS.

Protomatter supports concatenative inheritance by enabling you to compose
multiple prototypes together using the `Protomatter.compose()` method. It takes
a variable number of prototypes as arguments and returns a new prototype with
the properties from all the passed objects copied to it. This makes it easy to
componentize groups of functionality into multiple prototypes and combine them
in various ways.

When you compose prototypes, the resulting prototype's `init()` method will
invoke the `init()` methods provided by all composed prototypes, passing along
any arguments. It's best to pass an object literal with named arguments instead
of relying on positional arguments.

```javascript
var Commentable = Protomatter.create({
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
    saveComment: function() {
      // ...
    }
  }
});

var Likeable = Protomatter.create({
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
    saveLike: function() {
      // ...
    }
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

console.log(post.numComments()); // 0
console.log(post.isLiked()); // false
console.log(post.getText()); // '...'
console.log(post.getTitle()); // 'Prototypal OO'
```

Learn more about concatenative inheritance in Eric Elliott's [post on three
kinds of prototypal OO][kinds_proto_oo].

[kinds_proto_oo]: http://ericleads.com/2013/02/fluent-javascript-three-different-kinds-of-prototypal-oo/

### Mixin Support

In addition to prototype composition, Protomatter allows you to mix in
properties to prototype instances after creation. It adds a `mixIn()` method to
every instance. This is useful if you want to extend one specific instance
instead of composing a new prototype.

```javascript
var Proto = Protomatter.create({});
var instance = Proto.create();
var mixin = {
  getThing: function() {
    return this.thing;
  },
  setThing: function(thing) {
    this.thing = thing;
  }
};

instance.mixIn(mixin);
instance.setThing('foo');
console.log(instance.getThing()); // foo
```

**Note:** You can disable the ability to mix in properties to an instance by
passing the `allowMixins` option as false to `Protomatter.create()`.

```javascript
var Proto = Protomatter.create({}, {allowMixins: false});
```

### Managing Public Properties

Protomatter prevents access to object properties except for public methods and
properties added to prototypes. But sometimes you may want to expose a public
property on an instance object. You can do this by setting the property on
`this.public` instead of `this`:

```javascript
var Person = Protomatter.create({
  init: function(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
    // fullName will be publicly accessible.
    this.public.fullName = firstName + ' ' + lastName;
  }
});

var tom = Person.create('Tom', 'Johnson');
console.log(tom.firstName); // undefined
console.log(tom.lastName); // undefined
console.log(tom.fullName); // 'Tom Johnson'
```

### Working with Constructors

If you have to work with code implemented with constructors, say a third-party
library you can't change, you can convert it to a Protomatter prototype with
`Protomatter.convert()`. It takes a constructor function and returns a prototype
with the properties of the constructor's `.prototype` object, and uses the
constructor itself as the new prototype's `init()` method.

```javascript
var Constructor = function(foo, bar) {
  this.foo = foo;
  this.bar = bar;
};

Constructor.prototype.getBar = function() {
  return this.bar;
};
Constructor.prototype.getFoo = function() {
  return this.foo;
};

var ConvertedProto = Protomatter.convert(Constructor),
    instance = ConvertedProto.create('baz', 'qux');

console.log(instance.getBar()); // 'qux'
console.log(instance.getFoo()); // 'baz'
```

## Environment Support

Protomatter is built to work in an ECMAScript 5 environment. If you want to use
it in a pre-ES5 environment (e.g. Internet Explorer 8 and below), you will need
to polyfill the following ES5 features:

* `Function.prototype.bind()`
* `Object.create()` (Protomatter only uses the first argument)
* `Object.getPrototypeOf()`

I recommend using the [es5-shim][shim].

[shim]: https://github.com/es-shims/es5-shim

## Performance Considerations

Protomatter's strengths of privacy and working directly with prototypes come
with some performance tradeoffs. Some modern JS engines [optimize constructor
functions to be faster than `Object.create()`][jsperf_creation] and other means
of object creation. [V8's hidden classes][v8_hidden] are an example.

That said, object creation performance [is rarely a matter of
concern][obj_creation_performance]. Though perf tests may make the loss in
performance seem dramatic, the objective speed is still very fast. It will
likely have no noticeable impact on the perceived performance of your app unless
you're continuously creating huge numbers of objects (in which case you should
probably [switch to an object pool][obj_pool] to avoid garbage collection
pauses).

The key point to take away is you don't need to let performance concerns dictate
your object creation strategy upfront. Instead, you should profile to find
performance bottlenecks and only then switch to faster but less convenient
methods of object creation when the performance gain is worth it.

[jsperf_creation]: http://jsperf.com/revealing-module-vs-constructor/2
[v8_hidden]: http://mrale.ph/blog/2014/07/30/constructor-vs-objectcreate.html
[obj_creation_performance]: http://blog.getify.com/sanity-check-object-creation-performance/
[obj_pool]: http://beej.us/blog/data/object-pool/

## Limitations

Protomatter's ability to hide private properties and methods comes at the cost
of a few limitations that should be taken into consideration when working with
it.

### Extending Objects After Instantiation

Objects created from a Protomatter prototype can have new properties added to
them just like any other JS object. The caveat to keep in mind is that if you
add a new method post-creation, it won't be able to access the object's private
state.

```javascript
var Proto = Protomatter.create({
  init: function() {
    this.foo = 'bar';
  }
});
var instance = Proto.create();
instance.getFoo = function() {
  return this.foo;
};

console.log(instance.getFoo()); // undefined
```

The solution is to add the new method to the object using its [`mixIn()`
method](#mixin-support).

### instanceof

JavaScript's `instanceof` operator takes a constructor function as its righthand
argument. Since Protomatter's prototypes are objects, you can't test if a
particular instance inherits from a prototype using `instanceof`. But you can
use `Object.prototype.isPrototypeOf()` to get the answer:

```javascript
var Proto = Protomatter.create({});
var instance = Proto.create();

console.log(Proto.isPrototypeOf(instance)); // true
```

Note that `isPrototypeOf()` is an ES5 method, so you'll need to polyfill it to
use it in older JS environments (see the environment support section).

### Adding New Public Methods to Prototypes

Protomatter employs [late binding][late_binding] when executing public methods.
Therefore, you can easily replace the implementation of a public method on a
prototype after instances have been created.

```javascript
var Proto = Protomatter.create({
  init: function() {
    this.foo = 'bar';
  },
  getFoo: function() {
    return this.foo;
  }
});
var instance = Proto.create();

console.log(instance.getFoo()); // 'bar'

Proto.getFoo = function() {
  return 'Foo: ' + this.foo;
};
console.log(instance.getFoo()); // 'Foo: bar'
```

New methods added to prototypes after instances have been created, however, will
be unable to access the private state of an instance.

```javascript
Proto.getFoo2 = function() {
  return this.foo;
};

console.log(instance.getFoo2()); // undefined
```

So make sure to have all public methods added to your prototypes at definition
time.

[late_binding]: http://en.wikipedia.org/wiki/Late_binding

## Inspirations

Inspiration for Protomatter came from a variety of JS thinkers and projects
that advocate the power JS's prototypal nature has over older, class-based
thinking. These projects and resources were particularly influential:

* [JS Objects: De"construct"ion][deconstruction_article] by Kyle Simpson
* [Stampit: Create objects from reusable, composable behaviors.][stampit] by
  Eric Elliott.
* [You Don't Know JS: this & Object Prototypes][ydkjs] by Kyle Simpson

[deconstruction_article]: http://davidwalsh.name/javascript-objects-deconstruction
[stampit]: https://github.com/ericelliott/stampit
[ydkjs]: http://shop.oreilly.com/product/0636920033738.do
