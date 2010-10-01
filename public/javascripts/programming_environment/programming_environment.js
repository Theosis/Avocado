transporter.module.create('programming_environment/programming_environment', function(requires) {

requires('avocado_lib');
requires('lk_ext/core_sampler');
requires('lk_ext/poses');
requires('lk_ext/morph_factories');
requires('transporter/module_morph');
requires('transporter/snapshotter');
requires('programming_environment/categorize_libraries');
requires('programming_environment/category_morph');
requires('programming_environment/slot_morph');
requires('programming_environment/evaluator');
requires('programming_environment/slice_morph');
requires('programming_environment/mirror_morph');
requires('programming_environment/test_case_morph');

}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('avocado', {}, {category: ['avocado']});

});


thisModule.addSlots(avocado, function(add) {

  add.method('worldName', function () { return "Avocado"; }, {category: ['printing']});

  add.data('isReflectionEnabled', true, {category: ['enabling reflection']});

  add.data('debugMode', false, {category: ['debug mode']});

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('createAnotherMorph', function (w, wBounds, i) {
    if (i <= 0) { return; }
    var t1 = new Date().getTime();
    var m = Morph.makeRectangle(wBounds.randomPoint().extent(pt(50,50)));
    var t2 = new Date().getTime();
    w.addMorph(m);
    var t3 = new Date().getTime();
    console.log("Time to create latest morph: " + (t2 - t1) + ", and to add it: " + (t3 - t2));
    setTimeout(function() {
      var t4 = new Date().getTime();
      this.createAnotherMorph(w, wBounds, i - 1);
      console.log("Time to get to timeout: " + (t4 - t3));
    }.bind(this), 0);
  });

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();
    
    cmdList.addItem(["create new object", function(evt) {
      evt.hand.world().morphFor(reflect({})).growFromNothing(evt);
    }]);

    cmdList.addItem(["get the window object", function(evt) {
      evt.hand.world().morphFor(reflect(window)).grabMe(evt);
    }]);

    if (this.debugMode) {
      cmdList.addLine();

      cmdList.addItem(["scroll-pane experiment 1", function(evt) {
        var tm = new TextMorph(pt(400,300).extentAsRectangle(), "lalala", false);
        var m = ScrollPane.containing(tm, pt(400,300));
        m.grabMe();
      }.bind(this)]);

      cmdList.addItem(["scroll-pane experiment 2", function(evt) {
        var tm = new Morph(new lively.scene.Rectangle(pt(800,600).extentAsRectangle()));
        tm.setFill(lively.paint.defaultFillWithColor(Color.red.darker()));
        var m = ScrollPane.containing(tm, pt(400,300));
        m.grabMe();
      }.bind(this)]);

      cmdList.addItem(["scroll-pane experiment 3", function(evt) {
        var tm = new TextMorph(pt(400,300).extentAsRectangle(), "lalala\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\na\nblah", false);
        var m = ScrollPane.containing(tm, pt(400,300));
        m.grabMe();
      }.bind(this)]);

      if (organization.current === organizationUsingAnnotations) {
        cmdList.addItem(["use JSQuiche organization", function(evt) {
          organization.setCurrent(organizationChain.create(organization.named(organization.name()), organizationUsingAnnotations));
        }.bind(this)]);
      } else {
        cmdList.addItem(["stop using JSQuiche organization", function(evt) {
          organization.setCurrent(organizationUsingAnnotations);
        }.bind(this)]);
      }

      cmdList.addItem(["big-object experiment", function(evt) {
        var w = evt.hand.world();
        var m = w.morphFor(reflect(TextMorph.prototype));
        m.ensureIsInWorld(w, pt(300,200), true, false, false, function() {
          m.expand(evt);
        });
      }.bind(this)]);

      cmdList.addItem(["many-morphs experiment", function(evt) {
        var w = evt.hand.world();
        this.createAnotherMorph(w, w.bounds(), 1000);
      }.bind(this)]);

      cmdList.addItem(["translate the world", function(evt) {
        evt.hand.world().slideBy(pt(200,100));
      }]);

      cmdList.addItem(["zoom in to the world", function(evt) {
        evt.hand.world().zoomBy(2);
      }]);

      cmdList.addItem(["zoom out from the world", function(evt) {
        evt.hand.world().zoomBy(0.5);
      }]);

      cmdList.addItem(["unscale the world", function(evt) {
        evt.hand.world().staySameSizeAndSmoothlyScaleTo(1.0);
      }]);

      var b = window.shouldNotDoAnyPeriodicalMorphUpdating;
      cmdList.addItem([(b ? "enable" : "disable") + " periodical updating", function(evt) {
        window.shouldNotDoAnyPeriodicalMorphUpdating = !b;
      }]);
    }

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });

  }, {category: ['menu']});

  add.method('initialize', function () {
    var shouldPrintLoadOrder = false;
    if (shouldPrintLoadOrder) { transporter.printLoadOrder(); }
    
    creatorSlotMarker.annotateExternalObjects(true);
    window.categorizeGlobals();

    // make the lobby mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
  }, {category: ['initializing']});

});


thisModule.addSlots(avocado.menuItemContributors, function(add) {

  add.data('0', morphFactories);

  add.data('1', CoreSamplerMorph);

  add.data('2', transporter);

  add.data('3', poses);

  add.data('4', TestCase.prototype.Morph);

});


});