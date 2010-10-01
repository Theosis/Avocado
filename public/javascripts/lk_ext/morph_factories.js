transporter.module.create('lk_ext/morph_factories', function(requires) {}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('morphFactories', {}, {category: ['ui']});

});


thisModule.addSlots(morphFactories, function(add) {

  add.method('createFactoryForSimpleMorphs', function (evt) {
    var line    = Morph.makeLine([pt(0,0), pt(60, 30)], 2, Color.black).closeDnD();
    var rect    = Morph.makeRectangle(pt(0,0), pt(60, 30)).closeDnD();
    var ellipse = Morph.makeCircle(pt(0,0), 25).closeDnD();
    var text    = new TextMorph(pt(0,0).extent(pt(120, 10)), "This is a TextMorph").closeDnD();
    var star    = Morph.makeStar(pt(0,0)).closeDnD();
    var heart   = Morph.makeHeart(pt(0,0)).closeDnD();
    
    var buttonLabel = new TwoModeTextMorph();
    buttonLabel.setText("Button");
    buttonLabel.acceptChanges();
    buttonLabel.suppressHandles = true;
    buttonLabel.ignoreEvents();
    buttonLabel.backgroundColorWhenWritable = Color.white;
    var button  = ButtonMorph.createButton(buttonLabel, function(event) {this.world().showMessage('Hello!');}).closeDnD();

    var factory = Morph.makeRectangle(pt(0,0), pt(300, 400));

    ellipse.setFill(new Color(0.8, 0.5, 0.5)); // make it a different color than the rectangle
    factory.setFill(new Color(0.1, 0.6, 0.7)); // make it a different color than the rectangle

    factory.addMorphAt(line,    pt( 20,  20));
    factory.addMorphAt(rect,    pt(120,  20));
    factory.addMorphAt(ellipse, pt( 20, 120));
    factory.addMorphAt(text,    pt(120, 120));
    factory.addMorphAt(star,    pt( 20, 220));
    factory.addMorphAt(heart,   pt(200, 300));
    factory.addMorphAt(button,  pt( 20, 340));
    factory.closeDnD();
    return factory;
  });

  add.method('addGlobalCommandsTo', function (menu) {
    menu.addLine();
    
    menu.addItem(["morph factory", function(evt) {
      this.createFactoryForSimpleMorphs(evt).grabMe(evt);
    }.bind(this)]);
  }, {category: ['menu']});

});


});