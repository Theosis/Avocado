transporter.module.create('transporter/object_graph_walker', function(requires) {

requires('core/testFramework');

}, function(thisModule) {


thisModule.addSlots(avocado, function(add) {

  add.creator('objectGraphWalker', {}, {category: ['object graph']});

  add.creator('objectGraphAnnotator', Object.create(avocado.objectGraphWalker), {category: ['object graph']});

  add.creator('implementorsFinder', Object.create(avocado.objectGraphWalker), {category: ['object graph']});

  add.creator('referenceFinder', Object.create(avocado.objectGraphWalker), {category: ['object graph']});

  add.creator('childFinder', Object.create(avocado.objectGraphWalker), {category: ['object graph']});

  add.creator('annotationWalker', Object.create(avocado.objectGraphWalker), {category: ['object graph']});

  add.creator('testingObjectGraphWalker', Object.create(avocado.objectGraphWalker), {category: ['object graph']});

  add.creator('senders', {}, {category: ['object graph']});

});


thisModule.addSlots(avocado.childFinder, function(add) {

  add.method('initialize', function ($super, o) {
    $super();
    this.objectToSearchFor = o;
  });

  add.method('reachedObject', function (o) {
    var mir = reflect(o);
    if (mir.parent().reflectee() === this.objectToSearchFor && mir.isWellKnown('probableCreatorSlot')) {
      this._results.push(o);
    }
  });

});

thisModule.addSlots(avocado.annotationWalker, function(add) {

  add.method('initialize', function ($super, o) {
    $super();
    this._simpleFunctionCount = 0;
    this._simpleFunctionPrototypeCount = 0;
    this._emptyObjectCount = 0;
    this._otherObjectCount = 0;
    this._otherObjects = [];
    this._emptyObjects = [];
  });

  add.method('reachedObject', function (o) {
    if (o && o.hasOwnProperty && avocado.annotator.actualExistingAnnotationOf(o)) {
      var mir = reflect(o);
      if (mir.isReflecteeSimpleMethod()) {
        this._simpleFunctionCount += 1;
      } else {
        var cs = mir.theCreatorSlot();
        if (cs && cs.name() === 'prototype' && cs.holder().isReflecteeSimpleMethod()) {
          this._simpleFunctionPrototypeCount += 1;
        } else if (mir.size() === 0 && mir.reflectee().__proto__ === Object.prototype) {
          this._emptyObjectCount += 1;
          this._emptyObjects.push(mir.reflectee());
        } else {
          this._otherObjectCount += 1;
          this._otherObjects.push(mir.reflectee());
        }
      }
    }
  });

});


thisModule.addSlots(avocado.implementorsFinder, function(add) {

  add.method('initialize', function ($super, slotName) {
    $super();
    this.slotNameToSearchFor = slotName;
  });

  add.method('inspect', function () { return "Well-known implementors of '" + this.slotNameToSearchFor + "'"; });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (slotName === this.slotNameToSearchFor && holder !== avocado.senders.byID && reflect(holder).isWellKnown('probableCreatorSlot')) {
      this._results.push(reflect(holder).slotAt(slotName));
    }
  });

  add.data('resultsAreSlots', true);

});


thisModule.addSlots(avocado.referenceFinder, function(add) {

  add.method('initialize', function ($super, o) {
    $super();
    this.objectToSearchFor = o;
  });

  add.method('inspect', function () { return "Well-known references to " + reflect(this.objectToSearchFor).inspect(); });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (contents === this.objectToSearchFor) {
      var holderMir = reflect(holder);
      if (holderMir.isWellKnown('probableCreatorSlot')) {
        this._results.push(holderMir.slotAt(slotName));
      }
    }
  });

  add.method('reachedObject', function (o) {
    var mir = reflect(o);
    if (mir.parent().reflectee() === this.objectToSearchFor && mir.isWellKnown('probableCreatorSlot')) {
      this._results.push(mir.parentSlot());
    }
  });

  add.data('resultsAreSlots', true);

});


thisModule.addSlots(avocado.objectGraphWalker, function(add) {

  add.method('create', function () {
    var w = Object.create(this);
    w.initialize.apply(w, arguments);
    return w;
  });

  add.method('initialize', function () {
    this._objectCount = 0; // just for fun;
  });

  add.data('namesToIgnore', ["__annotation__", "_annotationsForObjectsThatShouldNotHaveAttributesAddedToThem", "_creatorSlotHolder", "localStorage", "sessionStorage", "globalStorage", "enabledPlugin"], {comment: 'Having enabledPlugin in here is just a hack for now - what\'s this clientInformation thing, and what are these arrays that aren\'t really arrays?', initializeTo: '["__annotation__", "_annotationsForObjectsThatShouldNotHaveAttributesAddedToThem", "_creatorSlotHolder", "localStorage", "sessionStorage", "globalStorage", "enabledPlugin"]'});

  add.method('go', function (root) {
    this.reset();
    this._startTime = new Date().getTime();
    this.walk(root === undefined ? window : root, 0);
    if (this.shouldAlsoWalkSpecialUnreachableObjects) { this.walkSpecialUnreachableObjects(); }
    this.undoAllMarkings();
    return this.results();
  });

  add.method('reset', function () {
    // children can override
    this._results = [];
    this._marked = [];
    this._objectCount = 0;
  });

  add.method('results', function () {
    // children can override
    return this._results;
  });

  add.method('objectCount', function () { return this._objectCount; });
  
  add.method('beInDebugMode', function () {
    this._debugMode = true;
    return this;
  });

  add.method('walkSpecialUnreachableObjects', function () {
    var walker = this;
    
    // WTFJS, damned for loops don't seem to see String and Number and Array and their 'prototype' slots.
    ['Object', 'String', 'Number', 'Boolean', 'Array', 'Function', 'Error'].forEach(function(typeName) {
        var type = window[typeName];
        var pathToType          = {                       slotHolder: window, slotName:  typeName   };
        var pathToTypePrototype = { previous: pathToType, slotHolder:   type, slotName: 'prototype' };
        walker.markObject(type, pathToType, true);
        walker.markObject(type.prototype, pathToTypePrototype, true);
        walker.walk(type.prototype);
    });
    
    // another special case, I think
    this.markObject(window['__proto__'], { slotHolder: window, slotName: '__proto__' }, true);
  });
  
  add.method('setShouldWalkIndexables', function (b) {
    this.shouldWalkIndexables = true;
    return this;
  });
  
  add.method('nameOfObjectWithPath', function (howDidWeGetHere) {
    // useful for debugging
    var s = [];
    var p = howDidWeGetHere;
    while (p) {
      s.unshift(p.slotName);
      p = p.previous;
    }
    return s.join('.');
  });

  add.creator('tests', Object.create(avocado.testCase), {category: ['tests']});

  add.method('inspect', function () {
    return reflect(this).name();
  });

  add.method('canHaveSlots', function (o) {
    if (o === null) { return false; }
    var t = typeof o;
    return t === 'object' || t === 'function';
  });

  add.method('isDOMNode', function (o) {
    // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    try {
      if (typeof Node === "object" && o instanceof Node) { return true; }
      if (typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string") { return true; }
    } catch (ex) {
      // Firefox sometimes throws an exception here. Don't know why.
    }
    return false;
  });

  add.method('isDOMElement', function (o) {
    try {
      if (typeof HTMLElement       === "object" && o instanceof HTMLElement          ) { return true; }
      if (typeof HTMLIFrameElement === "object" && o instanceof HTMLIFrameElement    ) { return true; }
      if (typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string") { return true; }
    } catch (ex) {
      // Firefox sometimes throws an exception here. Don't know why.
    }
    return false;
  });

  add.method('shouldIgnoreObject', function (o) {
    if (this.isDOMNode(o) || this.isDOMElement(o)) { return true; } // the DOM is a nightmare, stay the hell away
    return false;
  });

  add.method('shouldContinueRecursingIntoObject', function (object, objectAnno, howDidWeGetHere) {
    // children can override
    return true;
  });

  add.method('shouldContinueRecursingIntoSlot', function (holder, slotName, howDidWeGetHere) {
    // children can override
    return true;
  });

  add.method('markObject', function (object, howDidWeGetHere) {
    // Return false if this object has already been marked; otherwise mark it and return true.
    //
    // Would use an identity dictionary here, if JavaScript could do one. As it is, we'll
    // have to mark the annotation and then come by again and unmark it.
    var objectAnno;
    try { objectAnno = avocado.annotator.annotationOf(object); } catch (ex) { return false; } // stupid FireFox bug
    
    if (! this.shouldContinueRecursingIntoObject(object, objectAnno, howDidWeGetHere)) { return false; }
    
    var walkers = objectAnno.walkers = objectAnno.walkers || (window.avocado && avocado.set && Object.newChildOf(avocado.set, avocado.hashTable.identityComparator)) || [];
    if (walkers.include(this)) { return false; }
    walkers.push(this);
    this._marked.push(object);
    return true;
  });

  add.method('undoAllMarkings', function () {
    // Could walk the graph again so that we don't need to create this big
    // list of marked stuff. But for now this'll do.
    if (! this._marked) { return; }
    this._marked.each(function(obj) {
      var anno = avocado.annotator.actualExistingAnnotationOf(obj);
      if (anno) {
        if (anno.walkers) {
          if (anno.walkers.remove) {
            anno.walkers.remove(this);
          } else {
            anno.walkers = anno.walkers.without(this);
          }

          // Probably better to remove the walkers collection, so it doesn't stick around as a memory leak.
          if (anno.walkers.size() === 0) { delete anno.walkers; }
        }

        anno.deleteIfRedundant(obj);
      }
    }.bind(this));
    this._marked = [];
  });

  add.method('reachedObject', function (o) {
    // children can override;
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    // children can override;
  });

  add.method('walk', function (currentObj, howDidWeGetHere) {
    if (this.shouldIgnoreObject(currentObj, howDidWeGetHere)) { return; }
    if (! this.markObject(currentObj, howDidWeGetHere)) { return; }

    this._objectCount += 1;
    this.reachedObject(currentObj, howDidWeGetHere);

    if (typeof(currentObj.hasOwnProperty) === 'function') {
      if (this._debugMode) { console.log("About to walk through the properties of object " + this.nameOfObjectWithPath(howDidWeGetHere)); }
      for (var name in currentObj) {
        if (currentObj.hasOwnProperty(name) && ! this.namesToIgnore.include(name) && this.shouldContinueRecursingIntoSlot(currentObj, name, howDidWeGetHere)) {
          this.walkAttribute(currentObj, name, howDidWeGetHere);
        }
      }

      // Workaround for Chrome bug. -- Adam
      if (! avocado.javascript.prototypeAttributeIsEnumerable) {
        if (currentObj.hasOwnProperty("prototype")) {
          this.walkAttribute(currentObj, "prototype", howDidWeGetHere);
        }
      }
    }
  });

  add.method('walkAttribute', function (currentObj, name, howDidWeGetHere) {
    var contents;
    var encounteredStupidFirefoxBug = false;
    try { contents = currentObj[name]; } catch (ex) { encounteredStupidFirefoxBug = true; }
    if (! encounteredStupidFirefoxBug) {
      this.reachedSlot(currentObj, name, contents);
      if (this.canHaveSlots(contents)) {
        var shouldWalkContents;
        // aaa - this isn't right. But I don't wanna walk all the indexables.
        try { shouldWalkContents = contents.constructor !== Array || this.shouldWalkIndexables; }
        catch (ex) { shouldWalkContents = true; } // another FireFox problem?
        if (shouldWalkContents) {
          this.walk(contents, {previous: howDidWeGetHere, slotHolder: currentObj, slotName: name});
        }
      }
    }
  });

});


thisModule.addSlots(avocado.objectGraphAnnotator, function(add) {

  add.method('initialize', function ($super, shouldMakeCreatorSlots, shouldAlsoWalkSpecialUnreachableObjects) {
    $super();
    this.shouldMakeCreatorSlots = shouldMakeCreatorSlots;
    this.shouldAlsoWalkSpecialUnreachableObjects = shouldAlsoWalkSpecialUnreachableObjects;
  });
  
  add.method('alsoAssignUnownedSlotsToModule', function (module) {
    return this.alsoAssignSlotsToModule(module, function(holder, slotName, contents, slotAnno) {
      return ! slotAnno.getModule();
    });
  });
  
  add.method('alsoAssignSlotsToModule', function (module, shouldSlotBeAssignedToModule) {
    this.moduleToAssignSlotsTo = module;
    this.shouldSlotBeAssignedToModule = shouldSlotBeAssignedToModule;
    return this;
  });

  add.method('shouldIgnoreObject', function ($super, o) {
    if ($super(o)) { return true; }
    if (avocado.annotator.isSimpleMethod(o)) { return true; }
    return false;
  });

  add.method('markObject', function ($super, contents, howDidWeGetHere, shouldExplicitlySetIt) {
    if (this._debugMode) { console.log("Marking object " + this.nameOfObjectWithPath(howDidWeGetHere)); }
    this.reachedObject(contents, howDidWeGetHere, shouldExplicitlySetIt); // in case this is a shorter path
    return $super(contents, howDidWeGetHere);
  });

  add.method('reachedObject', function (contents, howDidWeGetHere, shouldExplicitlySetIt) {
    if (! this.shouldMakeCreatorSlots) { return; }
    if (! howDidWeGetHere) { return; }
    if (contents === window) { return; }
    var contentsAnno;
    var slotHolder = howDidWeGetHere.slotHolder;
    var slotName   = howDidWeGetHere.slotName;
    
    // Optimization: don't bother creating an annotation just to set its creator slot if that creator
    // slot is already determinable from the object itself.
    var implicitCS = avocado.annotator.creatorSlotDeterminableFromTheObjectItself(contents);
    if (implicitCS && implicitCS.holder === slotHolder && implicitCS.name === slotName) {
      // no need to do anything
    } else {
      try { contentsAnno = avocado.annotator.annotationOf(contents); } catch (ex) { return false; } // stupid FireFox bug
      
      if (shouldExplicitlySetIt) {
        contentsAnno.setCreatorSlot(slotName, slotHolder);
      } else {
        if (! contentsAnno.explicitlySpecifiedCreatorSlot()) {
          contentsAnno.addPossibleCreatorSlot(slotName, slotHolder);
        }
      }
    }
    
    // Remember identifiers so we can search for "senders".
    avocado.senders.rememberIdentifiersUsedBy(contents);
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (! this.moduleToAssignSlotsTo) { return; }
    var slotAnno = avocado.annotator.annotationOf(holder).slotAnnotation(slotName);
    if (this.shouldSlotBeAssignedToModule(holder, slotName, contents, slotAnno)) {
      if (this._debugMode) { console.log("Setting module of " + slotName + " to " + this.moduleToAssignSlotsTo.name()); }
      slotAnno.setModule(this.moduleToAssignSlotsTo);
      this.moduleToAssignSlotsTo.objectsThatMightContainSlotsInMe().push(holder); // aaa - there'll be a lot of duplicates; fix the performance later;
    } else {
      if (this._debugMode) { console.log("NOT setting module of " + slotName + " to " + this.moduleToAssignSlotsTo.name()); }
    }
  });

});


thisModule.addSlots(avocado.senders, function(add) {

  add.data('byID', {}, {initializeTo: '{}'});

  add.method('of', function (id) {
    return this.byID[id] || [];
  });

  add.creator('finder', {});

  add.method('rememberIdentifiersUsedBy', function (f) {
    if (typeof(f) !== 'function') { return; }
    var str = f.toString();
    var idRegex = /[A-Z_$a-z][A-Z_$0-9a-z]*/g;
    var ids = str.match(idRegex);
    if (!ids) { return; }
    var sendersByID = this.byID;
    for (var i = 0, n = ids.length; i < n; ++i) {
      var id = ids[i];
      if (id !== '__annotation__' && !avocado.javascript.reservedWords[id]) {
        var senders = sendersByID[id];
        if (!senders) {
          senders = [];
          sendersByID[id] = senders;
        }
        senders.push(f);
      }
    }
  });

});


thisModule.addSlots(avocado.senders.finder, function(add) {

  add.method('create', function (id) {
    return Object.newChildOf(this, id);
  });

  add.method('initialize', function (id) {
    this._id = id;
  });

  add.method('inspect', function () { return "senders of " + this._id; });

  add.method('go', function () {
    return avocado.senders.of(this._id).map(function(x) {
      return reflect(x).probableCreatorSlot();
    });
  });

  add.data('resultsAreSlots', true);

});


thisModule.addSlots(avocado.testingObjectGraphWalker, function(add) {

  add.method('reset', function ($super) {
    $super();
    this._objectsReached = [];
    this._slotsReached = [];
  });

  add.method('reachedObject', function (o) {
    this._objectsReached.push(o);
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    var slot = reflect(holder).slotAt(slotName);
    this._slotsReached.push(slot);
  });

  add.method('slotCount', function (o) {
    return this._slotsReached.length;
  });

  add.method('undoAllMarkings', function () {
    // Don't undo them, so that the tests can examine the _marked list.;
  });

});


thisModule.addSlots(avocado.objectGraphWalker.tests, function(add) {

  add.method('testIncremental', function () {
    var w1 = avocado.testingObjectGraphWalker.create();
    w1.go();
    var n = 'objectGraphWalker_tests___extraSlotThatIAmAdding';
    var o = {};
    window[n] = o;
    var w2 = avocado.testingObjectGraphWalker.create();
    w2.go();
    this.assertEqual(w1.objectCount() + 1, w2.objectCount());
    delete window[n];
  });

});


});
