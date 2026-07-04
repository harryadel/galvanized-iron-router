Tinytest.add('Utils - inherits', function (test) {
  var calls = [];

  Parent = function () {};
  Parent.parentStaticProp = true;
  Parent.parentObjectProp = {parent: true};
  Parent.prototype.parentProp = true;

  Child = function () {};

  Iron.utils.inherits(Child, Parent, {
    childProp: true
  });

  Child.parentObjectProp.child = true;

  // test that static properties are cloned
  test.isFalse(Parent.parentObjectProp.child, "child static object is writing to the parent!");

  test.equal(Child.__super__, Parent.prototype);
  test.isTrue(Child.prototype.childProp);
  test.isTrue(Child.parentStaticProp);

  var c = new Child;
  test.isTrue(c.childProp);
  test.isTrue(c.parentProp);

});

Tinytest.add('Utils - extend', function (test) {
  var calls = [];
  Parent = function () {
    calls.push('Parent');
  };
  Parent.parentStaticProp = true;
  Parent.prototype.parentProp = true;

  // test constructor overloading
  Child = Iron.utils.extend(Parent, {
    constructor: function () {
      calls.push('Child');
    },

    childProp: true
  });

  test.equal(Child.__super__, Parent.prototype);
  test.isTrue(Child.prototype.childProp);
  test.isTrue(Child.parentStaticProp);


  // test regular constructor
  calls = [];
  Child = Iron.utils.extend(Parent);
  var c = new Child;
  test.equal(calls.length, 1);
});

Tinytest.add('Utils - extend with ES6 class', function (test) {
  var calls = [];

  class ParentClass {
    constructor() {
      calls.push('Parent');
    }
  }

  ParentClass.parentStaticProp = true;

  Child = Iron.utils.extend(ParentClass, {
    constructor: function () {
      calls.push('Child');
    },
    childProp: true
  });

  var c = new Child;
  test.isTrue(c instanceof ParentClass);
  test.isTrue(Child.parentStaticProp);
  test.isTrue(c.childProp);
  test.equal(calls[0], 'Parent');
  test.equal(calls[1], 'Child');
});

Tinytest.add('Utils - global', function (test) {
  var g = Iron.utils.global;

  if (Meteor.isClient)
    test.equal(g, window);
  if (Meteor.isServer)
    test.equal(g, global);
});

Tinytest.add('Utils - resolve', function (test) {
  var global = (function () { return this; })();

  global.outer = {
    inner: 'value'
  };

  var res = Iron.utils.resolve('outer.inner');
  test.equal(res, 'value', 'unable to resolve on global object');
});

Tinytest.add('Utils - capitalize', function (test) {
  test.equal(Iron.utils.capitalize('lower'), 'Lower');
  test.equal(Iron.utils.capitalize('Lower'), 'Lower');
  test.equal(Iron.utils.capitalize('lowerSomething'), 'LowerSomething');
  test.equal(Iron.utils.capitalize('lower-something'), 'Lower-something');
});

Tinytest.add('Utils - classCase', function (test) {
  test.equal(Iron.utils.classCase('postsShow'), 'PostsShow');
  test.equal(Iron.utils.classCase('posts-show'), 'PostsShow');
  test.equal(Iron.utils.classCase('posts_show'), 'PostsShow');
  test.equal(Iron.utils.classCase('/posts/show'), 'PostsShow');
});

Tinytest.add('Utils - default', function (test) {
  var target = {};
  Iron.utils.defaultValue(target, 'prop', true);
  test.isTrue(target.prop);

  Iron.utils.defaultValue(target, 'prop', false);
  test.isTrue(target.prop);

  var existingValue = Iron.utils.defaultValue(target, 'prop', false);
  test.isTrue(existingValue);
});

Tinytest.add('Utils - namespace', function (test) {
  var global = Iron.utils.global;

  global.MyLib = {
    ns: {}
  };

  var o = {};
  var result;

  result = Iron.utils.namespace('MyLib.ns.O', o);
  test.equal(global.MyLib.ns.O, o);
  test.equal(result, o);

  result = Iron.utils.namespace('MyLib.ns.O');
  test.equal(result, o);

  result = Iron.utils.namespace('O', o);
  test.equal(global.O, o);
  test.equal(result, o);
});

Tinytest.add('Utils - extend chains initialize base class state', function (test) {
  class Base {
    constructor(options) {
      this.baseInitialized = true;
      this.options = options;
    }
  }

  var Level1 = Iron.utils.extend(Base, {one: true});
  var Level2 = Iron.utils.extend(Level1, {two: true});
  var Level3 = Iron.utils.extend(Level2, {three: true});

  var c = new Level3({key: 'value'});
  test.isTrue(c.baseInitialized, 'base constructor should run for a third-level extend');
  test.equal(c.options && c.options.key, 'value', 'constructor arguments should reach the base class');
  test.isTrue(c.one === true && c.two === true && c.three === true, 'prototype props from every level');
  test.isTrue(c instanceof Base, 'instanceof Base');
  test.isTrue(c instanceof Level1 && c instanceof Level2, 'instanceof intermediate levels');
  test.equal(c.constructor, Level3, 'instances report the leaf constructor');
});

Tinytest.add('Utils - extend custom constructors run after full parent construction', function (test) {
  var order = [];

  class Base {
    constructor() {
      order.push('base');
      this.fromBase = true;
    }
  }

  var Middle = Iron.utils.extend(Base, {
    constructor: function () {
      order.push('middle');
      test.isTrue(this.fromBase, 'parent state is available in the custom constructor');
    }
  });

  var Leaf = Iron.utils.extend(Middle, {
    constructor: function () {
      order.push('leaf');
    }
  });

  new Leaf;
  test.equal(order, ['base', 'middle', 'leaf'], 'constructors run base-first at every level');
});

Tinytest.add('Utils - extend does not copy parent registry name', function (test) {
  class Base {}
  var Named = Iron.utils.extend(Base, {name: 'NamedController'});
  var Child = Iron.utils.extend(Named, {});

  test.equal(Named._name, 'NamedController');
  test.isFalse(Object.prototype.hasOwnProperty.call(Child, '_name'),
    'a child must not receive its parent _name as an own registry key');
});
