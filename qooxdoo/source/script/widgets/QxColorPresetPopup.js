function QxColorPresetPopup(vTemplateColors, vHistoryColors, vColorSelector)
{
  QxPopup.call(this);
  
  var vField, vFieldSet;
  var vBase = QxColorPresetPopup.baseColors;
  var vLength = vBase.length;  
  
  var vInnerWidth = (this._fieldWidth * vLength) + (this._fieldSpace * (vLength-1));
  var vFullWidth = vInnerWidth + (2 * (this._padding + 1));
  var vPreviewWidth = Math.round((vInnerWidth / 2) - 2);
  
  this.setWidth(230);
  this.setHeight(260);
  this.setBackgroundColor("ThreedFace");
  this.setBorder(QxBorder.presets.outset);
  
  this._baseColors = [];
  this._templateColors = [];
  this._historyColors = [];
  



  var vTop = this._padding;
  
  
  var o = this._auto = new QxAtom(QxColorPresetPopup.textAuto, "icons/16/iconthemes.png");
  
  o.setBorder(QxBorder.presets.outset);
  o.setPadding(2, 4);
  o.setTop(vTop);
  o.setLeft(this._padding);
  o.setWidth(null);
  o.setRight(this._padding);
  o.setParent(this);    
  o.addEventListener("mousedown", this._onautoclick, this);
  
  vTop += 30;
  
  
  
  
  vFieldSet = new QxFieldSet(QxColorPresetPopup.textBaseColors);
  
  vFieldSet.setTop(vTop);
  vFieldSet.setLeft(this._padding);
  vFieldSet.setRight(this._padding);
  vFieldSet.setMinHeight(45);
  
  for (var i=0; i<vLength; i++)
  {
    vField = new QxWidget;
    
    vField.setBackgroundColor(vBase[i]);
    vField.setWidth(this._fieldWidth);
    vField.setHeight(this._fieldHeight);
    vField.setLeft(i* (this._fieldWidth + this._fieldSpace));
    vField.setTop(0);
    vField.setBorder(QxBorder.presets.inset);

    vField.addEventListener("mousedown", this._oncolorclick, this);
    vField.addEventListener("mouseover", this._oncolorover, this);
    vField.addEventListener("mouseout", this._oncolorout, this);
    vField.setParent(vFieldSet);

    this._baseColors.push(vField);
  };
  
  this.add(vFieldSet);
  
  
  vTop += this._fieldHeight + this._fieldSpace + 35;
  
  vFieldSet = new QxFieldSet(QxColorPresetPopup.textTemplateColors);
  
  vFieldSet.setTop(vTop);
  vFieldSet.setLeft(this._padding);
  vFieldSet.setRight(this._padding);
  vFieldSet.setMinHeight(45);
  

  for (var i=0; i<vLength; i++)
  {
    vField = new QxWidget;
    
    if (vTemplateColors[i]) {
      vField.setBackgroundColor(vTemplateColors[i]);
    };
    
    vField.setWidth(this._fieldWidth);
    vField.setHeight(this._fieldHeight);
    vField.setLeft(i* (this._fieldWidth + this._fieldSpace));
    vField.setTop(0);
    vField.setBorder(QxBorder.presets.inset);
    
    vField.addEventListener("mousedown", this._oncolorclick, this);
    vField.addEventListener("mouseover", this._oncolorover, this);
    vField.addEventListener("mouseout", this._oncolorout, this);
    vField.setParent(vFieldSet);     
    
    this._templateColors.push(vField); 
  };
  
  this.add(vFieldSet);
  
  
  
  
  vTop += this._fieldHeight + this._fieldSpace + 35;
  
  vFieldSet = new QxFieldSet(QxColorPresetPopup.textHistoryColors);
  
  vFieldSet.setTop(vTop);
  vFieldSet.setLeft(this._padding);
  vFieldSet.setRight(this._padding);
  vFieldSet.setMinHeight(45);
  
  
  for (var i=0; i<vLength; i++)
  {
    vField = new QxWidget;
    
    if (vHistoryColors[i]) {
      vField.setBackgroundColor(vHistoryColors[i]);
    };
    
    vField.setWidth(this._fieldWidth);
    vField.setHeight(this._fieldHeight);
    vField.setLeft(i* (this._fieldWidth + this._fieldSpace));
    vField.setTop(0);
    vField.setBorder(QxBorder.presets.inset);
    
    vField.addEventListener("mousedown", this._oncolorclick, this);
    vField.addEventListener("mouseover", this._oncolorover, this);
    vField.addEventListener("mouseout", this._oncolorout, this);
    vField.setParent(vFieldSet);     
    
    this._historyColors.push(vField); 
  };
  
  this.add(vFieldSet);
  
  
  
  vTop += this._fieldHeight + this._fieldSpace + 45;
  
  
  
  var o = this._previewOld = new QxAtom(QxColorPresetPopup.textSavedColor);
  
  o.setHeight(25);
  o.setWidth(105);
  o.setTop(vTop);
  o.setLeft(this._padding);
  o.setBorder(QxBorder.presets.inset);
  o.setPadding(2, 4);
  o.setHorizontalBlockAlign("center");
  o.setParent(this);
  
  
  
  var o = this._previewNew = new QxAtom(QxColorPresetPopup.textNewColor);
  
  o.setHeight(25);
  o.setWidth(105);
  o.setTop(vTop);
  o.setRight(this._padding);
  o.setBorder(QxBorder.presets.inset);
  o.setPadding(2, 4);
  o.setHorizontalBlockAlign("center");
  o.setParent(this);    
  
  
  
  vTop += 30;
  
  
  
  var o = this._vStartComplex = new QxAtom(QxColorPresetPopup.textAllColors, "icons/16/kcoloredit.png");

  o.setBorder(QxBorder.presets.outset);
  o.setPadding(2, 4);    
  o.setTop(vTop);
  o.setLeft(this._padding);
  o.setWidth(null);
  o.setRight(this._padding);
  o.setParent(this);   
  
  o.addEventListener("mousedown", function(e)
  {
    vColorSelector.setSavedColor(this.getCurrentColor());
    vColorSelector.setCurrentColor(this.getCurrentColor() ? this.getCurrentColor() : [ 127, 255, 255 ]);
    vColorSelector.setTop(100);
    vColorSelector.setLeft(100);      
    vColorSelector.setVisible(true);
  }, this);
};

QxColorPresetPopup.extend(QxPopup, "QxColorPresetPopup");  

QxColorPresetPopup.addProperty({ name : "currentColor", type : QxColor });

QxColorPresetPopup.baseColors = [ "black", 51, 102, 153, 204, "white", "red", "green", "blue", "yellow", "cyan", "magenta" ];

QxColorPresetPopup.textBaseColors = "Basic Colors";
QxColorPresetPopup.textTemplateColors = "Template Colors";
QxColorPresetPopup.textHistoryColors = "Previous Colors";
QxColorPresetPopup.textSavedColor = "Current";
QxColorPresetPopup.textNewColor = "New";
QxColorPresetPopup.textAuto = "Automatic";
QxColorPresetPopup.textAllColors = "All Colors...";

proto._fieldWidth = 14;
proto._fieldHeight = 14;
proto._fieldSpace = 2;
proto._padding = 4;




proto._onautoclick = function(e) {
  this.setCurrentColor(null);
};

proto._oncolorover = function(e) {
  this._applyNewColor(e.getTarget().getBackgroundColor());
};

proto._oncolorout = function(e) {
  this._previewNew.setBackgroundColor(null);
  this._previewNew.setColor(null);
};

proto._oncolorclick = function(e)
{
  var c = e.getTarget().getBackgroundColor();
  
  if (isValidString(c)) {
    this.setCurrentColor(c);
  };    
  
  this._oncolorout();
};

proto._modifyCurrentColor = function(propValue, propOldValue, propName, uniqModIds) {
  return this._applyOldColor(propValue);    
};

proto._applyOldColor = function(propValue)
{
  this._previewOld.setBackgroundColor(propValue);
  
  if (isValid(propValue))
  {
    var vTemp = QxColor.read(propValue);
    this._previewOld.setColor(this._useWhiteColor(QxColor.RGB2HSB(vTemp[0], vTemp[1], vTemp[2])) ? "white" : "black");
  };    
  
  return true;
};

proto._applyNewColor = function(propValue)
{
  if (isValidString(propValue)) 
  {
    this._previewNew.setBackgroundColor(propValue);
    
    if (isValid(propValue)) 
    {
      var vTemp = QxColor.read(propValue);
      this._previewNew.setColor(this._useWhiteColor(QxColor.RGB2HSB(vTemp[0], vTemp[1], vTemp[2])) ? "white" : "black");
    };
  };    
  
};

proto._useWhiteColor = function(v) {
  return v[2] < 70 || (v[1] > 50 && (v[0].inrange(200, 280) || v[0].inrange(-1, 40)));
};