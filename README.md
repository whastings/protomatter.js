Protomatter.js
==============

This is a simple tool for managing prototypal inheritance in JavaScript without
the use of constructor functions and the `new` keyword. Using prototypes
directly lets you work in cooperation with the true nature of JavaScript,
instead of working against it by trying to replicate classical inheritance.

For more info on the benefits of using prototypes directly, see Kyle Simpson's
[great article on JS without constructors][kyle-simpson-article].
This piece is what inspired me to write this library.

**NB**: Protomatter requires an ES5 environment with support for
[Object.create()][object-dot-create],
such as Node.js, Internet Explorer 9+, or another modern browser.

## Usage

### Creating a Prototype

Use `Protomatter.create()` to set up a new prototype, passing it an object
with the properties you want available to instances created from the
prototype.

```javascript
var Computer = Protomatter.create({
  initialize: function(memory, ghz) {
    this.memory = memory;
    this.ghz = ghz;
  },
  stats: function() {
    return 'Memory: ' + this.memory + '\nGHz: ' + this.ghz + '\n';
  }
});
```

### Creating Instances

Note the `initialize` method in the previous example. Define this method on
prototypes to initialize their instances. Protomatter adds a `create()` method
to your prototypes that you can call to create instances. Any arguments passed
to `create()` will be passed along to `initialize()` if it was provided.

```javascript
var basicComputer = Computer.create(1024, 2.5);
console.log(Object.getPrototypeOf(basicComputer) === Computer);  // True
console.log(basicComputer.stats()); // "Memory: 1024\nGHz: 2.5"
```

### Linking Prototypes for Inheritance

Have a new prototype "inherit" from another prototype by passing the "super
prototype" as a second argument to `Protomatter.create()`. Protomatter will
set it as the prototype of your new prototype, creating a *prototype chain*.

```javascript
var UltraBook = Protomatter.create({
  initialize: function(memory, ghz, resolution, extras) {
    this.callSuper('initialize', memory, ghz);
    this.resolution = resolution;
    this.extras = extras;
  },
  stats: function() {
    return this.callSuper('stats') +
      'Resolution: ' + this.resolution + '\nExtras: ' + this.extras;
  }
}, Computer);
```

In the example above, instances of UltraBook will be able to access properties
of the Computer prototype.

### Invoking Methods from Super Prototypes

You may have noticed in the previous example calls to `this.callSuper()`.
When you create a prototype that inherits from another prototype, Protomatter
adds a `callSuper()` method to the new prototype. If the new prototype
defines a method by the same name, it can invoke the super prototype's version
of the method by passing the method name and any arguments to `callSuper()`.

```javascript
var ultraComputer = UltraBook.create(4096, 3.5, '1920x1080', 'SDD, webcam');
console.log(Object.getPrototypeOf(ultraComputer) === UltraBook); // True
console.log(ultraComputer.stats());
// Memory: 4096
// GHz: 3.5
// Resolution: 1920x1080
// Extras: SSD, Webcam
```

In this example and the previous, `UltraBook` uses `callSuper()` to invoke
`Computer`'s `initialize()` method from its `initialize()`, passing it its
first two arguments. It also redefines the `stats()` method,
using `callSuper()` to retrieve the result of `Computer`'s implementation to
combine with its own.

[object-dot-create]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
[kyle-simpson-article]: http://davidwalsh.name/javascript-objects-deconstruction
