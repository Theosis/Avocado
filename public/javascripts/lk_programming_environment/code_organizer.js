transporter.module.create('lk_programming_environment/code_organizer', function(requires) {

requires('avocado_lib');
requires('lk_ext/poses');
requires('programming_environment/categorize_libraries');
requires('lk_programming_environment/category_morph');
requires('lk_programming_environment/slot_morph');
requires('lk_programming_environment/mirror_morph');
requires('lk_programming_environment/searching');

}, function(thisModule) {


thisModule.addSlots(window, function(add) {

  add.creator('jsQuiche', {}, {category: ['JSQuiche']});

});


thisModule.addSlots(jsQuiche, function(add) {

  add.method('worldName', function () { return "JSQuiche"; }, {category: ['printing']});

  add.data('isReflectionEnabled', false, {category: ['enabling reflection']});

  add.data('debugMode', false, {category: ['debug mode']});

  add.creator('menuItemContributors', [], {category: ['menu']});

  add.method('addGlobalCommandsTo', function (cmdList) {
    cmdList.addLine();
    cmdList.addItem(["get the window object", function(evt) {
      evt.hand.world().morphFor(reflect(window)).grabMe(evt);
    }]);

    this.menuItemContributors.each(function(c) {
      c.addGlobalCommandsTo(cmdList);
    });

    if (this.debugMode) {
      cmdList.addLine();

      if (organization.current === organizationUsingAnnotations) {
        cmdList.addItem(["use JSQuiche organization", function(evt) {
          organization.setCurrent(organizationChain.create(organization.named(organization.name()), organizationUsingAnnotations));
        }.bind(this)]);
      } else {
        cmdList.addItem(["stop using JSQuiche organization", function(evt) {
          organization.setCurrent(organizationUsingAnnotations);
        }.bind(this)]);
      }
    }

  }, {category: ['menu']});

  add.method('initialize', function () {
    // I'm confused. Why is this here if it's already called from putUnownedSlotsInInitModule? -- Adam
    // avocado.creatorSlotMarker.annotateExternalObjects(true);
    
    avocado.categorizeGlobals();

    // make the window's mirror morph less unwieldy, since people tend to keep lots of stuff there
    reflect(window).categorizeUncategorizedSlotsAlphabetically();
  }, {category: ['initializing']});

});


});