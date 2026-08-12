var Robro = Robro || {};
Robro.Def = Robro.Def || {};

//=============================================================================
 /*:
 * @plugindesc Allows skills to be replaced with others in menus and selection.
 * @author Robro
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * 
 * This plugin allows for skills to be completely substituted with others
 * within the skill window, or before target selection based on ntoetags.
 * 
 * Use the following as a guide to set up the conditions. It goes within the
 * skill's notebox.
 * 
 * <Defer Eval>
 *   defer = some numerical value;
 * </Defer Eval>
 * 
 * The value of the "defer" variable determines the ID of the replacement 
 * skill should be when the current skill is used.
 * This applies to both actors AND enemies.
 * 
 * Convenience variables include: 
 *  - "user"/"target" for the battler selecting their skills
 *  - "defer" by default refers to the skill's own ID and may be used
 *  - "item/skill" refers to the database entry for the current skill
 *  - "s"/"v" for the switch/variable data arrays
 * 
 * When the above notetag is used alone, the skill becomes its replacement
 * after it is chosen on the skill window. However, if you would like for the
 * skill to update while on the skill window, you must add the following 
 * notetag to the skill while also having the eval tag:
 * 
 * <DeferMenu> 
 * 
 * Examples:
 * Transforming a skill into the next skill in the database while at low hp.
 * 
 * <DeferMenu> 
 * <Defer Eval>
 *   defer = user.hpRate() < .25 ? defer + 1 : defer;
 * </Defer Eval>
 * 
 * 
 * Allowing a skill to become a random skill between 1 and 7 inclusive when
 * chosen, but not shown on the skill menu.
 * 
 * <Defer Eval>
 *   defer = Math.randomInt(7)+1;
 * </Defer Eval>
 * 
 * Creating a single skill that changes into others based on
 * which actor is using it.
 * 
 * <DeferMenu> 
 * <Defer Eval>
 *   if (user.actorId() === 1)
 *     defer = 4;
 *   else if (user.actorId() === 2)
 *     defer = 7;
 *   else
 *     defer = 11;
 * </Defer Eval>
 * 
 * Two important notes:
 *   - As mentioned, the "defer" variable defaults to the base skill's ID.
 *     Failing to assign a value just uses the base skill as a fallback.
 *   - Nested deferrals are not permitted and are ignored. If skill 5 has a 
 *     deferral eval tag to execute skill 7, and skill 3 defers to skill 5,
 *     skill 3 when chosen will execute skill 5, and not skill 7.
 * 
 * The plugin works in a clean project as well as in a project running the
 * "usual" plugins. I imagine its fine for most. Let me know if it causes any
 * compatability issues or oddities. 
 * 
 * Additionally, I use a modified version of this plugin for my presonal use
 * (or rather, *this* is the modified version for more general use) and thus, 
 * mistakes may have slipped through the cracks in my testing. 
 * I'm sure someone else can set their game on fire with it.
 * 
 * contact me:
 * https://forums.rpgmakerweb.com/index.php?members/robro33.222859/
 * https://rpg-refuge.com/members/robro.108/
 */
//=============================================================================

Robro.Def.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
  if (!Robro.Def.DataManager_isDatabaseLoaded.call(this)) return false;
  if (!Robro._loaded_RBO_Defer) {
    this.processDefernotetags($dataSkills);
    Robro._loaded_RBO_Defer = true;
  }
  return true;
};

DataManager.processDefernotetags = function(group) {
  var note1 = /<(?:DEFER EVAL)>/i;
  var note2 = /<\/(?:DEFER EVAL)>/i;
  for (var n = 1; n < group.length; n++) {
    var obj = group[n];
    var notedata = obj.note.split(/[\r\n]+/);

    var customMode = 'none';
    obj.deferEval = '';

    for (var i = 0; i < notedata.length; i++) {
      var line = notedata[i];
      if (line.match(note1)) {
        customMode = 'defer';
      } else if (line.match(note2)) {
        customMode = 'none';
      } else if (customMode === 'defer') {
        obj.deferEval = obj.deferEval + line + '\n';
      }
    }
  }
};

Robro.Def.Window_SkillList_drawItem = Window_SkillList.prototype.drawItem;
Window_SkillList.prototype.drawItem = function(index) {
    var skill = this._data[index];
    if (skill && skill.meta.DeferMenu) {
        this._data[index] = $dataSkills[this._actor.deferEval(skill)]
    }
    Robro.Def.Window_SkillList_drawItem.call(this, index)
};

Robro.Def.setSkill = Game_Action.prototype.setSkill;
Game_Action.prototype.setSkill = function (skillId) {
  Robro.Def.setSkill.call(this, skillId);

  if (this.item() && this.isSkill()){
    if (this.item().deferEval){ 
      //this._defered=true;
      this._item.setObject($dataSkills[this.subject().deferEval(this.item())])
    }
  }
};


Game_Battler.prototype.deferEval = function(skill) {
  const original = skill.id;
  var defer = skill.id;
  var item = skill;
  var a = this;
  var user = this;
  var subject = this;
  var s = $gameSwitches._data;
  var v = $gameVariables._data;
  var code = skill.deferEval;
  try {
    eval(code);
  } catch (e) {
    console.log(e.message);
    console.log("Deferral error on skill#"+original+"");
  }
  return defer;
}