transporter.module.create('reflection/organization', function(requires) {

requires("reflection/category");
requires("core/hash_table");

}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('abstractOrganization', {}, {category: ['reflection']});

  add.creator('organization', Object.create(abstractOrganization), {category: ['reflection']});

  add.creator('organizationUsingAnnotations', Object.create(abstractOrganization), {category: ['reflection']});

  add.creator('organizationChain', Object.create(abstractOrganization), {category: ['reflection']});

});


thisModule.addSlots(abstractOrganization, function(add) {

  add.method('categoryForSlot', function(s) {
    return this.categoryOrNullForSlot(s) || [];
  }, {category: ['categories']});

  add.method('commentForReflecteeOf', function(mir) {
    return this.commentOrNullForReflecteeOf(mir) || "";
  }, {category: ['comments']});

  add.method('commentForSlot', function(s) {
    return this.commentOrNullForSlot(s) || "";
  }, {category: ['comments']});

  add.method('mirrorMorphForObjectNamed', function(chainNames) {
    var mir = mirror.forObjectNamed(chainNames);
    if (!mir) { return null; }
    return mir.morph();
  }, {category: ['poses']});

  add.method('findUnusedPoseName', function() {
    var i = 1;
    while (true) {
      var n = "pose " + i;
      if (! this.getPose(n)) { return n; }
      i += 1;
    }
  }, {category: ['poses']});

  add.method('promptForPoseName', function(callWhenDone) {
    ComboBoxMorph.prompt("Name this pose.", "Save pose", "Cancel", this.poses().keys().sort(), this.findUnusedPoseName(), callWhenDone);
  }, {category: ['poses']});

});


thisModule.addSlots(organization, function(add) {

  add.data('current', organizationUsingAnnotations, {initializeTo: 'organizationUsingAnnotations'});

  add.method('setCurrent', function(org) {
    organization.current = org;
    org.update();
  }, {category: ['loading']});

  add.method('temporarilySetCurrent', function(org, f) {
    var previousOrg = organization.current;
    try {
      this.setCurrent(org);
      var result = f();
    } finally {
      organization.current = previousOrg;
    }
    return result;
  }, {category: ['loading']});

  add.creator('tests', Object.create(TestCase.prototype), {category: ['tests']});

});


thisModule.addSlots(organizationUsingAnnotations, function(add) {

  add.method('update', function(callWhenDone) {
    // nothing to do here
    if (callWhenDone) { callWhenDone(); }
  }, {category: ['loading']});

  add.method('unlink', function() {
    // nothing to do here
  }, {category: ['tests']});

  add.method('copyEmpty', function() {
    return this;
  }, {category: ['copying']});

  add.method('categoryOrNullForSlot', function(s) {
    if (! s.hasAnnotation()) { return null; }
    var a = s.annotation();
    if (!a.category) { return null; }
    return a.category;
  }, {category: ['categories']});

  add.method('setCategoryForSlot', function(s, catParts) {
    s.annotation().category = catParts;
  }, {category: ['categories']});

  add.method('commentOrNullForReflecteeOf', function (mir) {
    var a = mir.annotation();
    if (! a) { return null; }
    if (a.comment === undefined) { return null; }
    return a.comment;
  }, {category: ['comments']});

  add.method('setCommentForReflecteeOf', function (mir, c) {
    mir.annotationForWriting().comment = c || "";
  }, {category: ['comments']});

  add.method('commentOrNullForSlot', function (s) {
    if (! s.hasAnnotation()) { return null; }
    var a = s.annotation();
    if (a.comment === undefined) { return null; }
    return a.comment;
  }, {category: ['comments']});

  add.method('setCommentForSlot', function (s, c) {
    s.annotation().comment = c;
  }, {category: ['comments']});

  add.method('poses', function () {
    return this._rememberedPosesByName || (this._rememberedPosesByName = dictionary.copyRemoveAll());
  }, {category: ['poses']});

  add.method('getPose', function (poseName) {
    return this.poses().get(poseName);
  }, {category: ['poses']});

  add.method('rememberPose', function (pose) {
    this.poses().put(pose.name(), pose);
  }, {category: ['poses']});

});


thisModule.addSlots(organizationChain, function(add) {

  add.method('create', function(o1, o2) {
    return Object.newChildOf(this, o1, o2);
  });

  add.method('initialize', function(o1, o2) {
    this._org1 = o1;
    this._org2 = o2;
  });

  add.method('update', function(callWhenDone) {
    waitForAllCallbacks(function(finalCallback) {
      this._org1.update(finalCallback());
      this._org2.update(finalCallback());
    }.bind(this), callWhenDone)
  }, {category: ['loading']});

  add.method('copyEmpty', function() {
    return organizationChain.create(this._org1.copyEmpty(), this._org2.copyEmpty());
  }, {category: ['copying']});

  add.method('unlink', function() {
    this._org1.unlink();
    this._org2.unlink();
    if (this === organization.current) { organization.current = this.copyEmpty(); }
  }, {category: ['tests']});

  add.method('categoryOrNullForSlot', function(s) {
    return this._org1.categoryOrNullForSlot(s) || this._org2.categoryOrNullForSlot(s);
  }, {category: ['categories']});

  add.method('setCategoryForSlot', function(s, catParts) {
    return this._org1.setCategoryForSlot(s, catParts);
  }, {category: ['categories']});

  add.method('commentOrNullForReflecteeOf', function (mir) {
    return this._org1.commentOrNullForReflecteeOf(mir) || this._org2.commentOrNullForReflecteeOf(mir);
  }, {category: ['comments']});

  add.method('setCommentForReflecteeOf', function (mir, c) {
    return this._org1.setCommentForReflecteeOf(mir, c);
  }, {category: ['comments']});

  add.method('commentOrNullForSlot', function (s) {
    return this._org1.commentOrNullForSlot(s) || this._org2.commentOrNullForSlot(s);
  }, {category: ['comments']});

  add.method('setCommentForSlot', function (s, c) {
    return this._org1.setCommentForSlot(s, c);
  }, {category: ['comments']});

  add.method('poses', function () {
    var poses = dictionary.copyRemoveAll();
    this._org2.poses().eachKeyAndValue(function(k, v) { poses.put(k, v); });
    this._org1.poses().eachKeyAndValue(function(k, v) { poses.put(k, v); });
    return poses;
  }, {category: ['poses']});

  add.method('getPose', function (poseName) {
    return this._org1.getPose(poseName) || this._org2.getPose(poseName);
  }, {category: ['poses']});

  add.method('rememberPose', function (pose) {
    this._org1.rememberPose(pose);
  }, {category: ['poses']});

});


});