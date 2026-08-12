var Robro = Robro || {};
Robro.GS = Robro.GS || {};

//=============================================================================
 /*:
 * @plugindesc Adds a gearset loadout menu to the existing equip menu.
 * @author Robro
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * This plugin adds a new pair of commands to the equip menu to save and load 
 * equipment loadouts. This will allow the player to quickly swap between
 * self defined sets of equipment or quickly reload a previous one.
 * 
 * Each actor is provided three loadout slots specific to them that may be 
 * freely used. In the event the actor is unable to equip a piece of equipment
 * due to allowed equip types or equipment possession changing, the color of
 * the text of the gear will change to indicate unavailability. The equipment 
 * will remain as a part of the gearset until a replacement is found
 * or the set is overwritten.
 * 
 * Note: This is a modified/simplified version of a plugin I use for personal
 * use in my own project. Mistakes may have slipped through the cracks in my
 * quick testing. It is what it is ¯\_(ツ)_/¯
 * 
 * If there are any issues, contact me at:
 * https://rpg-refuge.com/members/robro.108/
 */
//=============================================================================

Robro.GS.Game_Actor_setup = Game_Actor.prototype.setup;
Game_Actor.prototype.setup = function(actorId) {
    Robro.GS.Game_Actor_setup.call(this, actorId);
    this.initGearsets();
};

Game_Actor.prototype.initGearsets = function() {
  var slots = this.equipSlots();
  var maxSlots = slots.length;
  this._gearsets = [];
  for (var i = 0; i < 3; i++){
    this._gearsets[i] = [];
    var set = this._gearsets[i];
    for (var j = 0; j < maxSlots; j++) {
      set[j] = new Game_Item();
    }
  }
  this.refresh();
};


Game_Actor.prototype.gearset = function(set) {
  return this._gearsets[set].map(function(item) {
      return item.object();
  });
};

Game_Actor.prototype.saveGearset = function(set) {
  if (set > 2) return;
  this._gearsets[set] = JsonEx.makeDeepCopy(this._equips)
};
Game_Actor.prototype.loadGearset = function(set) {
  if (!this._gearsets[set]) return;
  for (var i = 0; i < this.gearset(set).length; i++){
    var gear = this.gearset(set)[i]
    if ($gameParty.hasItem(gear) || gear === null)
      this.changeEquip(i, gear)
  }
};

Robro.GS.EquipSceneCreate = Scene_Equip.prototype.create
Scene_Equip.prototype.create = function() {
  Robro.GS.EquipSceneCreate.call(this);
  this.createGearDisplayWindow();
  this.createGearSaveWindow();
  this.createGearLoadWindow();  
};


Robro.GS.Window_EquipCommand_makeCommandList =
    Window_EquipCommand.prototype.makeCommandList;
Window_EquipCommand.prototype.makeCommandList = function() {
  Robro.GS.Window_EquipCommand_makeCommandList.call(this)
  this.addGearsetCommands();
}

Robro.GS.EquipScene_createCommandWindow = Scene_Equip.prototype.createCommandWindow
Scene_Equip.prototype.createCommandWindow = function() {
  Robro.GS.EquipScene_createCommandWindow.call(this)
  this._commandWindow.setHandler('SaveSet', this.onGearsetSave.bind(this));
  this._commandWindow.setHandler('LoadSet', this.onGearsetLoad.bind(this));
  this.addWindow(this._commandWindow);
};

Scene_Equip.prototype.createGearSaveWindow = function() {
  var wy = this._helpWindow.height;
  this._gearsetSaveWindow = new Window_GearsetSave(this._gearsetDisplayWindow.x, this._gearsetDisplayWindow.y - 72, this._gearsetDisplayWindow.width);
  this._gearsetSaveWindow.setHelpWindow(this._helpWindow);
  this._gearsetSaveWindow.setHandler('set1', this.gearsetSaveOk.bind(this));
  this._gearsetSaveWindow.setHandler('set2', this.gearsetSaveOk.bind(this));
  this._gearsetSaveWindow.setHandler('set3', this.gearsetSaveOk.bind(this));
  this._gearsetSaveWindow.setHandler('cancel', this.gearsetSaveCancel.bind(this));
  this._gearsetSaveWindow._displayWindow = this._gearsetDisplayWindow;
  this.addChild(this._gearsetSaveWindow); //allows layering
  this._gearsetSaveWindow.hide()
};
Scene_Equip.prototype.createGearLoadWindow = function() {
  var wy = this._helpWindow.height;
  this._gearsetLoadWindow = new Window_GearsetSave(this._gearsetDisplayWindow.x, this._gearsetDisplayWindow.y - 72, this._gearsetDisplayWindow.width);
  this._gearsetLoadWindow.setHelpWindow(this._helpWindow);
  this._gearsetLoadWindow.setHandler('set1', this.gearsetLoadOk.bind(this));
  this._gearsetLoadWindow.setHandler('set2', this.gearsetLoadOk.bind(this));
  this._gearsetLoadWindow.setHandler('set3', this.gearsetLoadOk.bind(this));
  this._gearsetLoadWindow.setHandler('cancel', this.gearsetLoadCancel.bind(this));
  this._gearsetLoadWindow._displayWindow = this._gearsetDisplayWindow;
  this.addChild(this._gearsetLoadWindow);
  this._gearsetLoadWindow.hide()
};

Scene_Equip.prototype.createGearDisplayWindow = function() {
  //var wy = this._commandWindow.y + this._commandWindow.height;
  var wy = this._helpWindow.height;
  this._gearsetDisplayWindow = new Window_GearsetDisplay(Graphics.boxWidth/2 - this._slotWindow.width/2, wy, this._slotWindow.width, this._slotWindow.height);
  this.addChild(this._gearsetDisplayWindow);
  this._gearsetDisplayWindow.hide()
};

Scene_Equip.prototype.onGearsetSave = function() {
  this._commandWindow.deactivate()
  this._gearsetSaveWindow.activate();
  this._gearsetSaveWindow.show();
  this._gearsetDisplayWindow.show()
  $gameTemp._gearset = 0;
  this._gearsetDisplayWindow.setActor(this.actor());
  this._gearsetDisplayWindow.refresh();
};
Scene_Equip.prototype.onGearsetLoad = function() {
  this._commandWindow.deactivate()
  this._gearsetLoadWindow.activate();
  this._gearsetLoadWindow.show();
  this._gearsetDisplayWindow.show()
  $gameTemp._gearset = 0;
  this._gearsetDisplayWindow.setActor(this.actor());
  this._gearsetDisplayWindow.refresh();
};

Scene_Equip.prototype.gearsetSaveOk = function() {
  this.actor().saveGearset(this._gearsetSaveWindow.index())
  this._gearsetSaveWindow.deactivate();
  this._gearsetSaveWindow.hide();
  this._gearsetSaveWindow.select(0);
  this._gearsetDisplayWindow.hide();
  this._commandWindow.activate()
};
Scene_Equip.prototype.gearsetLoadOk = function() {
  this.actor().loadGearset(this._gearsetLoadWindow.index())
  SoundManager.playEquip();
  //this._compareWindow.refresh();
  this.refreshActor();
  this._statusWindow.refresh();
  this._slotWindow.refresh();
  this._gearsetLoadWindow.deactivate();
  this._gearsetDisplayWindow.hide();
  this._gearsetLoadWindow.hide();
  this._gearsetLoadWindow.select(0);
  this._commandWindow.activate()
};

Scene_Equip.prototype.gearsetSaveCancel = function() {
  this._gearsetSaveWindow.deactivate();
  this._gearsetSaveWindow.hide();
  this._gearsetSaveWindow.select(0);
  this._gearsetDisplayWindow.hide();
  this._commandWindow.activate()
};
Scene_Equip.prototype.gearsetLoadCancel = function() {
  this._gearsetLoadWindow.deactivate();
  this._gearsetLoadWindow.hide();
  this._gearsetLoadWindow.select(0);
  this._gearsetDisplayWindow.hide();
  this._commandWindow.activate()
};

Scene_Equip.prototype.updateLowerRightWindowTriggers = function() {
  if (!this._lowerRightVisibility || this._gearsetLoadWindow.visible || this._gearsetSaveWindow.visible) return;
  if (Input.isRepeated('right')) {
    this.shiftLowerRightWindows();
  } else if (Input.isRepeated('left')) {
    this.unshiftLowerRightWindows();
  } else if (Input.isRepeated('tab')) {
    this.shiftLowerRightWindows();
  } else if (this.isLowerWindowTouched()) {
    this.shiftLowerRightWindows();
  }
};
//-----------------------------------------------------------------------------
// Window_GearsetSave
//
// 

function Window_GearsetSave() {
  this.initialize.apply(this, arguments);
}

Window_GearsetSave.prototype = Object.create(Window_HorzCommand.prototype);
Window_GearsetSave.prototype.constructor = Window_GearsetSave;

Window_GearsetSave.prototype.initialize = function(x, y, width, height) {
  Window_HorzCommand.prototype.initialize.call(this, x, y, width, height);
  this.deactivate();
}

Window_GearsetSave.prototype.makeCommandList = function(){
  this.addCommand("Set 1","set1")
  this.addCommand("Set 2","set2")
  this.addCommand("Set 3","set3")
};

Window_GearsetSave.prototype.maxCols = function() {
  return 3;
};
Robro.GS.GSSelect = Window_GearsetSave.prototype.select
Window_GearsetSave.prototype.select = function(index) {
  Robro.GS.GSSelect.call(this, index)
  $gameTemp._gearset = index
  if (this._displayWindow)
    this._displayWindow.refresh()
};
Window_GearsetSave.prototype.windowWidth = function() {
  return SceneManager._scene._gearsetDisplayWindow.width;
};
Window_GearsetSave.prototype.standardBackOpacity = function() {
  return 255;
};
//-----------------------------------------------------------------------------
// Window_GearsetLoad
//
// 

function Window_GearsetLoad() {
  this.initialize.apply(this, arguments);
}

Window_GearsetLoad.prototype = Object.create(Window_HorzCommand.prototype);
Window_GearsetLoad.prototype.constructor = Window_GearsetLoad;

Window_GearsetLoad.prototype.initialize = function(x, y, width, height) {
  Window_HorzCommand.prototype.initialize.call(this, x, y, width, height);
  this.deactivate();
}

Window_GearsetLoad.prototype.makeCommandList = function(){
  this.addCommand("Set 1","set1")
  this.addCommand("Set 2","set2")
  this.addCommand("Set 3","set3")
};

Window_GearsetLoad.prototype.maxCols = function() {
  return 3;
};
Robro.GS.GLSelect = Window_GearsetLoad.prototype.select
Window_GearsetSave.prototype.select = function(index) {
  Robro.GS.GLSelect.call(this, index)
  $gameTemp._gearset = index
  if (this._displayWindow)
    this._displayWindow.refresh()
};
Window_GearsetSave.prototype.windowWidth = function() {
  return SceneManager._scene._gearsetDisplayWindow.width;
};
Window_GearsetLoad.prototype.standardBackOpacity = function() {
  return 255;
};

//-----------------------------------------------------------------------------
// Window_GearsetDisplay
//
// 

function Window_GearsetDisplay() {
  this.initialize.apply(this, arguments);
}

Window_GearsetDisplay.prototype = Object.create(Window_EquipSlot.prototype);
Window_GearsetDisplay.prototype.constructor = Window_GearsetDisplay;

Window_GearsetDisplay.prototype.initialize = function(x, y, width, height) {
  var wh = this.fittingHeight(SceneManager._scene._actor.equipSlots().length)
  var wy = (Graphics.boxHeight - wh)/2
  Window_EquipSlot.prototype.initialize.call(this, x, wy, width, wh);
  this.deactivate();
}
Window_GearsetDisplay.prototype.item = function() {
  return this._actor ? this._actor.gearset($gameTemp._gearset || 0)[this.index()] : null;
};

Window_GearsetDisplay.prototype.drawItem = function(index) {
  if (this._actor) {
      var rect = this.itemRectForText(index);
      this.changeTextColor(this.systemColor());
      this.changePaintOpacity(this.isEnabled(index));
      this.drawText(this.slotName(index), rect.x, rect.y, 138, this.lineHeight());
      this.drawItemName(this._actor.gearset($gameTemp._gearset || 0)[index], rect.x + 138, rect.y);
      this.changePaintOpacity(true);
  }
};
Window_GearsetDisplay.prototype.drawItemName = function(item, x, y, width) {
  width = width || 312;
  if (item) {
      var iconBoxWidth = Window_Base._iconWidth + 4;
      this.resetTextColor();
      this.drawIcon(item.iconIndex, x + 2, y + 2);
      if (this._actor && !this._actor.canEquip(item))
        this.changeTextColor(this.textColor(11))
      if (!$gameParty.hasItem(item) && !this._actor.isEquipped(item) )
        this.changeTextColor(this.textColor(19))
      this.drawText(item.name, x + iconBoxWidth, y, width - iconBoxWidth);
      this.resetTextColor();
  }
};

Window_GearsetDisplay.prototype.standardBackOpacity = function() {
  return 255;
};

//-----------------------------------------------------------------------------
// Window_EquipCommand
//
// Add commands


Window_EquipCommand.prototype.addGearsetCommands = function() {
  this.addCommand("Save Set", 'SaveSet');
  this.addCommand("Load Set", 'LoadSet');
};
