var Robro = Robro || {};
Robro.TT = Robro.TT || {};
var Imported = Imported || {};
Imported.Robro_Tooltips = true;

//=============================================================================
 /*:
 * @plugindesc Adds tooltips to skills/items
 * @author Robro
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * The tooltip window is added to the battle, skill, and item scenes via the 
 * skill/item windows. This window will contain description information for 
 * the selected skill/item's set tooltip objects. 
 * The window can be called by pressing the "Start" button on a controller, or 
 * the "Tab" key on the keyboard.
 *
 * In order to give a skill/item a tooltip, use the following notetag:
 * <Tooltips>
 * STATEID CONDITION
 * state STATEID CONDITION
 * skill SKILLID CONDITION
 * </Tooltips>
 * 
 * The state ID is evaluated. The input doesn't strictly have to be a number,
 * but it does need to evaluate to one. The condition is completely optional
 * and may be skipped, but allows you to add a condition to determine to
 * whether or not the tooltip on that line shows. Whether or not the tooltip
 * will display a state description or a skill description can be specified
 * by starting the line with "state" or "skill", but this is optional and not
 * doing so defaults to "state".
 *  
 * 
 * I've used space as a delimiter when reading tooltip notetags. Spaces cannot
 * be used within the notetags for any reason other than splitting arguments.
 * 
 * Examples
 * <Tooltips>
 * 5
 * 17 a.isStateAffected(12)
 * skill 20
 * state 20 $gameSwitches.value(3)
 * </Tooltips>
 * 
 * When creating a tooltip for a state, use the following notetag to set the text:
 * <Short Description>
 * This is the state's description.
 * </Short Description>
 * 
 * This will be the text as it shows up in the tooltip window. 
 * Skills use their regular descriptions in the tooltip window.
 * 
 * Note: This is a modified/simplified version of a plugin I use for personal
 * use in my own project. Mistakes may have slipped through the cracks in my
 * quick testing. It is what it is ¯\_(ツ)_/¯
 * 
 * If there are any issues, contact me at:
 * https://rpg-refuge.com/members/robro.108/
 */
//=============================================================================

Robro.TT.IsDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!Robro.TT.IsDatabaseLoaded.call(this)) return false
    Robro.TT.setupTooltips($dataSkills);
    Robro.TT.setupTooltips($dataItems);
    Robro.TT.setupDescriptions($dataStates)
    return true;
};

Robro.TT.setupTooltips = function(group){
  for (var n = 1; n < group.length; n++) {
    var obj = group[n];
    var notedata = obj.note.split(/[\r\n]+/);
    
    var evalMode = 'none';
    obj.toolTips = [];

    for (var i = 0; i < notedata.length; i++) {
      var line = notedata[i];
      if (line.match(/<(?:TOOLTIPS)>/i)) {
        var evalMode = 'tips';
      } else if (line.match(/<\/(?:TOOLTIPS)>/i)) {
        var evalMode = 'none';
      } else if (evalMode === 'tips') {
        obj.toolTips.push(line);
      }
    }
  }
}

Robro.TT.setupDescriptions = function(group) {
    for (var n = 1; n < group.length; n++) {
      var obj = group[n];
      var notedata = obj.note.split(/[\r\n]+/);
      var evalMode = 'none';
      obj.shortDes = ""

      for (var i = 0; i < notedata.length; i++) {
        var line = notedata[i];
        if (line.match(/<(?:SHORT|SHORT DESCRIPTION)>/i)) {
          evalMode = 'short';
        } else if (line.match(/<\/(?:SHORT|SHORT DESCRIPTION)>/i)) {
          evalMode = 'none';
        } else if (evalMode === 'short') {
          obj.shortDes += line;
        }
      }
  }
};

Input.gamepadMapper[9] = 'start';
Input.keyMapper[9] = 'start';
//yell at me enough and i might make it a parameter or something

//-----------------------------------------------------------------------------
// Window_Tooltip
//
// Shows added effects

function Window_Tooltip() {
  this.initialize.apply(this, arguments);
}

Window_Tooltip.prototype = Object.create(Window_Help.prototype);
Window_Tooltip.prototype.constructor = Window_Tooltip;

Window_Tooltip.prototype.PSkDesName = function(skill) { //prints skill description and name by id
  var s = $dataSkills[skill]
  return "\\i["+s.iconIndex+"]" + "\\c[4]"+s.name+"\\c[0]" + ": " + s.description;
};
Window_Tooltip.prototype.PStDesName = function(state) { //prints state description and name by id
  var s = $dataStates[state]
  return "\\i["+s.iconIndex+"]" + "\\c[3]"+s.name+"\\c[0]" + ": " + s.shortDes;
};

Window_Tooltip.prototype.initialize = function() {
  var width = Graphics.boxWidth;
  var height = 360;
  Window_Base.prototype.initialize.call(this, (Graphics.boxWidth-width)/2, (Graphics.boxHeight-height)/2, width, height);
  this._actor = null;
  this._action = null;
  this.deactivate();
  this.hide();
};

Window_Tooltip.prototype.setup = function(actor, action) {
  this.setActor(actor);
  this.setAction(action);
  this.setupTooltips()
};

Window_Tooltip.prototype.updatePlacement = function(lines) {
	this.height = this.fittingHeight(lines);
	this.x = (Graphics.boxWidth - this.width) / 2;
	this.y = (Graphics.boxHeight - this.height) / 2;
};

Window_Tooltip.prototype.setActor = function(actor) {
  if (this._actor !== actor) {
      this._actor = actor;
  }
};
Window_Tooltip.prototype.setAction = function(action) {
  if (this._action !== action) {
      this._action = action;
  }
};
Window_Tooltip.prototype.setupTooltips = function() {
  //if (!this._action) return;
  var lines = 0;
  this.contents.clear();
  
  
  var lh = this.lineHeight();
  var y = 0;
  var skill = this._action;
  var a = this._actor;
  var user = a;

  this.drawText("Associated Effects", 0, y);
  y+=lh;
  lines++;

  if (!skill || !skill.toolTips.length){
    this.drawText("-- None --", 0, y);
    y+=lh;
    lines++;
  } else {
    for (var i = 0 ; i < skill.toolTips.length; i++){
      var line = skill.toolTips[i];
      var key = skill.toolTips[i].split(" ")[0];

      if (key === "state"){
        var stateId = eval(skill.toolTips[i].split(" ")[1]);
        var state = $dataStates[stateId];
        var cond = skill.toolTips[i].split(" ")[2];
        if (!cond || eval(cond)) {
          this.drawTextEx(this.PStDesName(stateId), 0, y);
          var length = (state.shortDes.match(/\n/g) || []).length + 1;
          for (var j = 0; j < length; j++){
            y+=lh;
            lines++;
          }
        }
      } else if (key === "buff"){
        var stat = Number(skill.toolTips[i].split(" ")[1]);
        var cond = skill.toolTips[i].split(" ")[2];
        if (!cond || eval(cond)) {
          this.drawTextEx(this.PStDesName(1840+stat), 0, y);
          var length = ($dataStates[1840+stat].shortDes.match(/\n/g) || []).length + 1;
          for (var j = 0; j < length; j++){
            y+=lh;
            lines++;
          }
        }
      } else if (key === "debuff"){
        var stat = Number(skill.toolTips[i].split(" ")[1]);
        var cond = skill.toolTips[i].split(" ")[2];
        if (!cond || eval(cond)) {
          this.drawTextEx(this.PStDesName(1848+stat), 0, y);
          var length = ($dataStates[1840+stat].shortDes.match(/\n/g) || []).length + 1;
          for (var j = 0; j < length; j++){
            y+=lh;
            lines++;
          }
        }
      } else if (key === "skill"){
        var sk = eval(skill.toolTips[i].split(" ")[1]);
        var cond = skill.toolTips[i].split(" ")[2];
        if (!cond || eval(cond)) {
          this.drawTextEx(this.PSkDesName(sk), 0, y);
          var length = ($dataSkills[sk].description.match(/\n/g) || []).length + 1;
          for (var j = 0; j < length; j++){
            y+=lh;
            lines++;
          }
        }
      } else { //default - state
        var stateId = eval(skill.toolTips[i].split(" ")[0]);
        var state = $dataStates[stateId];
        var cond = skill.toolTips[i].split(" ")[1];
        if (!cond || eval(cond)) {
          this.drawTextEx(this.PStDesName(stateId), 0, y);
          var length = (state.shortDes.match(/\n/g) || []).length + 1;
          for (var j = 0; j < length; j++){
            y+=lh;
            lines++;
          }
        }
      }
    }
  }

  this.updatePlacement(lines)
};

Window_Selectable.prototype.processStart = function () {
    SoundManager.playCursor();
    this.updateInputData();
    this.callHandler('start');
};

Robro.TT.Window_Selectable_select = Window_Selectable.prototype.select;
Window_Selectable.prototype.select = function(index) {
  Robro.TT.Window_Selectable_select.call(this, index);
  if (SceneManager._scene._toolTips && SceneManager._scene._toolTips.visible){
    SceneManager._scene.closeToolTips();
  }
};

Robro.TT.Window_Selectable_processOk = Window_Selectable.prototype.processOk;
Window_Selectable.prototype.processOk = function(index) {
  Robro.TT.Window_Selectable_processOk.call(this);
  if (SceneManager._scene._toolTips && SceneManager._scene._toolTips.visible){
    SceneManager._scene.closeToolTips();
  }
};

Robro.TT.Window_Selectable_processCancel = Window_Selectable.prototype.processCancel;
Window_Selectable.prototype.processCancel = function(index) {
  Robro.TT.Window_Selectable_processCancel.call(this);
  if (SceneManager._scene._toolTips && SceneManager._scene._toolTips.visible){
    SceneManager._scene.closeToolTips();
  }
};

Window_Selectable.prototype.processHandling = function () {
    if (this.isOpenAndActive()) {
        if (this.isOkEnabled() && this.isOkTriggered()) {
            this.processOk();
        } else if (this.isCancelEnabled() && this.isCancelTriggered()) {
            this.processCancel();
        } else if (this.isHandled('pagedown') && Input.isTriggered('pagedown')) {
            this.processPagedown();
        } else if (this.isHandled('pageup') && Input.isTriggered('pageup')) {
            this.processPageup();
        } else if (this.isHandled('start') && Input.isTriggered('start')) {
            this.processStart();
        }
    }
};

//-----------------------------------------------------------------------------
// Scene_Battle
//
// Extension

Robro.TT.Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
Scene_Battle.prototype.createAllWindows = function() {
	Robro.TT.Battle_createAllWindows.apply(this, arguments);
	this.createToolTips();
};

Scene_Battle.prototype.createToolTips = function() { 
	this._toolTips = new Window_Tooltip();
	this.addWindow(this._toolTips);
  this._skillWindow.setHandler('start', this.commandBattleStart.bind(this));
  this._itemWindow.setHandler('start', this.commandBattleStart.bind(this));
  if (Imported["SumRndmDde Skill Extender"])
    this._skillExtend.setHandler('start', this.commandBattleStart.bind(this));

};

Scene_Battle.prototype.commandBattleStart = function() {
  if (this._toolTips.visible)
    this.closeToolTips();
  else
    this.openToolTips();
};

Scene_Battle.prototype.openToolTips = function() {
  this._toolTips.setup(BattleManager.actor(), this.getMenuAction());
	this._toolTips.open();
  this._toolTips.show();
};

Scene_Battle.prototype.closeToolTips = function() {
  this._toolTips.close();
  this._toolTips.hide();
};

Scene_Battle.prototype.getMenuAction = function(target) {
  var action = null;
  if (Imported["SumRndmDde Skill Extender"] && SceneManager._scene._skillExtend.active && SceneManager._scene._skillExtend.item())
    action = SceneManager._scene._skillExtend.item();
  else if (SceneManager._scene._skillWindow.item())
    action = SceneManager._scene._skillWindow.item();
  else if (SceneManager._scene._itemWindow.item())
    action = SceneManager._scene._itemWindow.item();
  
  return action;
};

//-----------------------------------------------------------------------------
// Scene_Item
//
// Extension

Robro.TT.Item_create = Scene_Item.prototype.create;
Scene_Item.prototype.create = function() {
	Robro.TT.Item_create.apply(this, arguments);
	this.createToolTips();
};

Scene_Item.prototype.createToolTips = function() {
	this._toolTips = new Window_Tooltip();
	this.addWindow(this._toolTips);
  this._itemWindow.setHandler('start', this.commandBattleStart.bind(this));
};

Scene_Item.prototype.commandBattleStart = function() {
  if (this._toolTips.visible)
    this.closeToolTips();
  else
    this.openToolTips();
};

Scene_Item.prototype.openToolTips = function() {
  this._toolTips.setup(this.actor(), this.getMenuAction());
	this._toolTips.open();
  this._toolTips.show();
};

Scene_Item.prototype.closeToolTips = function() {
  this._toolTips.close();
  this._toolTips.hide();
};

Scene_Item.prototype.getMenuAction = function(target) {
  return SceneManager._scene.item();
};

//-----------------------------------------------------------------------------
// Scene_Skill
//
// Extension

Robro.TT.Skill_create = Scene_Skill.prototype.create;
Scene_Skill.prototype.create = function() {
	Robro.TT.Skill_create.apply(this, arguments);
	this.createToolTips();
};

Scene_Skill.prototype.createToolTips = function() {
	this._toolTips = new Window_Tooltip();
	this.addWindow(this._toolTips);
  this._itemWindow.setHandler('start', this.commandBattleStart.bind(this));
  if (Imported["SumRndmDde Skill Extender"])
    this._skillExtend.setHandler('start', this.commandBattleStart.bind(this));

};

Scene_Skill.prototype.commandBattleStart = function() {
  if (this._toolTips.visible)
    this.closeToolTips();
  else
    this.openToolTips();
};
Scene_Skill.prototype.openToolTips = function() {
  this._toolTips.setup(this.actor(), this.getMenuAction());
	this._toolTips.open();
  this._toolTips.show();
};

Scene_Skill.prototype.closeToolTips = function() {
  this._toolTips.close();
  this._toolTips.hide();
};

Scene_Skill.prototype.getMenuAction = function(target) {
  return SceneManager._scene.item();
};
