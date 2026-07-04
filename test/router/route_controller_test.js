Tinytest.add('RouteController - lookupOption', function (test) {
  var router = new Iron.Router({autoStart: false, autoRender: false});
  var route = router.route('/', {});
  var inst = route.createController({});
  inst.router = router;
  var value;

  // undefined
  value = inst.lookupOption('myOption');
  test.isUndefined(value, 'property should be undefined');

  // router options
  router.options.myOption = 'myRouterValue';
  value = inst.lookupOption('myOption');
  test.equal(value, 'myRouterValue', 'property should be on router options');

  // XXX: CurrentOptions dynamic var

  // route controller instance
  inst.myOption = 'myInstanceValue';
  value = inst.lookupOption('myOption');
  test.equal(value, 'myInstanceValue', 'property should be on instance');

  // XXX: this order has changed since 0.9.x - either revert or document heavily
  // route controller options : 
  inst.options.myOption = 'myOptionsValue';
  value = inst.lookupOption('myOption');
  test.equal(value, 'myOptionsValue', 'property should be on instance options');

  // route options
  route.options.myOption = 'myRouteValue';
  value = inst.lookupOption('myOption');
  test.equal(value, 'myRouteValue', 'property should be on route options');
});

Tinytest.add('RouteController - lookupOption - class field shadowing', function (test) {
  class FieldController extends Iron.RouteController {
    data() {
      return { title: 'FieldController' };
    }
  }

  var router = new Iron.Router({autoStart: false, autoRender: false});
  var route = router.route('/', {controller: FieldController});
  var inst = route.createController({});
  inst.router = router;
  // Simulate class-field shadowing by adding an own undefined property.
  inst.data = undefined;

  var value = inst.lookupOption('data');
  test.isTrue(typeof value === 'function', 'data should resolve to prototype function even with class field');
  test.equal(value.call(inst).title, 'FieldController', 'data function should be callable');
});

if (Meteor.isClient) {
  Tinytest.add('RouteController - layout data uses controller data function', function (test) {
    class DataController extends Iron.RouteController {
      data() {
        return 'DATA';
      }
    }

    var router = new Iron.Router({autoStart: false, autoRender: false});
    var route = router.route('/layout-data', {
      controller: DataController,
      layoutTemplate: 'LayoutWithData'
    });
    var inst = route.createController({});
    inst.router = router;
    // Simulate class-field shadowing by adding an own undefined property.
    inst.data = undefined;

    const originalDispatch = Iron.MiddlewareStack.prototype.dispatch;
    Iron.MiddlewareStack.prototype.dispatch = function (url, context, done) {
      if (done) done();
    };

    try {
      inst._runRoute(route, '/layout-data');
      test.equal(inst._layout.data(), 'DATA', 'layout should receive controller data');
      // This test isn't about rendering; stop explicitly to avoid warnings.
      inst.stop();
    } finally {
      Iron.MiddlewareStack.prototype.dispatch = originalDispatch;
    }
  });
}

Tinytest.add('RouteController - hooks - inheritance order', function (test) {
  var router = new Iron.Router({autoStart: false, autoRender: false});
  var hookCalls = [];

  router.configure({
    onAfterAction: function routerOnAfterAction() {
      hookCalls.push('routerOnAfterAction');
    }
  });
  
  var Parent = Iron.RouteController.extend({
    onAfterAction: function protoOnAfterAction() {
      hookCalls.push('parentOnAfterAction');
    }
  });

  var C = Parent.extend({
    onAfterAction: function protoOnAfterAction() {
      hookCalls.push('protoOnAfterAction');
    }
  });

  var route = router.route('/', {
    controller: C,
    onAfterAction: function routeOnAfterAction() {
      hookCalls.push('routeOnAfterAction');
    }
  });

  // create some proto hooks
  var c = new C;
  c.router = router;
  c.route = route;

  var hooks = c.runHooks('onAfterAction');

  test.equal(hookCalls[0], 'routerOnAfterAction', 'router onAfterAction');
  test.equal(hookCalls[1], 'routeOnAfterAction', 'route onAfterAction');
  test.equal(hookCalls[2], 'parentOnAfterAction', 'proto onAfterAction');
  test.equal(hookCalls[3], 'protoOnAfterAction', 'proto onAfterAction');
});

Tinytest.add('RouteController - hooks - pausing in before hooks', function (test) {
});

Tinytest.add('RouteController - init runs exactly once per instantiation', function (test) {
  var count;
  var router = new Iron.Router({autoStart: false, autoRender: false});

  class ClassController extends Iron.RouteController {
    init(options) {
      count++;
      super.init(options);
    }
  }

  count = 0;
  var classRoute = router.route('/class-init', {controller: ClassController});
  classRoute.createController({});
  test.equal(count, 1, 'init should run once for class controllers');

  var ExtendController = Iron.RouteController.extend({
    init: function (options) {
      count++;
      ExtendController.__super__.init.apply(this, arguments);
    }
  });

  count = 0;
  var extendRoute = router.route('/extend-init', {controller: ExtendController});
  extendRoute.createController({});
  test.equal(count, 1, 'init should run once for extend() controllers');
});

Tinytest.add('RouteController - multi-level extend chains produce initialized controllers', function (test) {
  var ApplicationController = Iron.RouteController.extend({
    appLevel: true
  });
  var PostController = ApplicationController.extend({
    postLevel: true
  });

  var router = new Iron.Router({autoStart: false, autoRender: false});
  var route = router.route('/posts-extend-chain', {controller: PostController});
  var c = route.createController({});

  test.isTrue(c.appLevel === true && c.postLevel === true, 'prototype properties from both levels');
  test.isTrue(Array.isArray(c.params), 'params initialized by RouteController constructor');
  test.isTrue(!!c.options, 'options initialized');
  test.isTrue(!!c._layout, 'layout initialized by the Controller base constructor');
  test.instanceOf(c, Iron.RouteController);
});
