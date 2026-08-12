
var Imported = Imported || {};
Imported.RBO_RestrictionBypass = true;

var Robro = Robro || {};
Robro.ResB = Robro.ResB || {};

//=============================================================================
 /*:
 * @plugindesc Adds conditions for state restrictions to be ignored
 * @author Robro
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * 
 * This plugin allows for states with restrictions to be given conditions for 
 * their restriction to be ignored while keeping the state active. 
 * 
 * Use the following as a guide to set up the conditions. It goes within the
 * state's notebox.
 * 
 * <Restriction Bypass Condition>
 *   bypass = some js condition goes here;
 * </Restriction Bypass Condition>
 * 
 * The value of the "bypass" variable determines if the state's restriction
 * is considered. It defaults to being false and the restriction is ignored
 * when its true.
 * 
 * Convenience variables include: 
 *  - "user"/"target" for the battler the state is on,
 *  - "stateId" for the current state's id 
 *  - "s"/"v" for the switch/variable data arrays
 * 
 * 
 * Examples:
 * allowing a battler to enable retain the ability to act after being put
 * to sleep via another state such as a passive
 * 
 * <Restriction Bypass Condition>
 *   bypass = user.isStateAffected(x);
 * </Restriction Bypass Condition>
 * 
 * 
 * Designating a state that allows a battler to resist "cannot move" state
 * restrictions unless they are affected by multiple "cannot move" states
 * 
 * <Restriction Bypass Condition>
 *   bypass = user.isStateAffected(x) && 
 *     user.states().filter(state => state.restriction == 4).length < 2;
 * </Restriction Bypass Condition>
 *  *x is the id of the resistance state. the above notetag goes into each 
 *  "cannot move" state
 * 
 * 
 * Adding an HP% threshold to a state to determine if it should render a
 * battler unable to move
 * 
 * <Restriction Bypass Condition>
 *   bypass = user.hpRate() > .5;
 * </Restriction Bypass Condition>
 * 
 * Allowing an actor to resist the effect of states like confusion/berserk 
 * making them act uncontrollably
 * 
 * <Restriction Bypass Condition>
 *   bypass = user === $gameActors.actor(x);
 * </Restriction Bypass Condition>
 * 
 * It works in my project with all the plugins I use as well as in a clean one. 
 * I imagine its fine for most. Let me know if it causes any issues or oddities. 
 * I'm sure someone else can set their game on fire with it.
 * 
 * contact me:
 * https://forums.rpgmakerweb.com/index.php?members/robro33.222859/
 */
//=============================================================================

Robro.ResB.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!Robro.ResB.DataManager_isDatabaseLoaded.call(this)) return false;

    if (!Robro.RBO_RestrictionBypass) {
      var states = $dataStates.filter(state => state && state.restriction);
  		this.setResBRestrictions(states);
      Robro.RBO_RestrictionBypass = true;
    }

		return true;
};

DataManager.setResBRestrictions = function(group) {
  var start = /<(?:RESTRICTION BYPASS CONDITION)>/i;
  var end = /<\/(?:RESTRICTION BYPASS CONDITION)>/i;
  
  for (var n = 1; n < group.length; n++) {
    var obj = group[n];
    var notedata = obj.note.split(/[\r\n]+/);

    obj.restrictionBypassEval = '';
    var started = false;
    var ended = false;

    for (var i = 0; i < notedata.length && !ended; i++) {
      var line = notedata[i];
      if (line.match(start)) {
        started = true;
      } else if (line.match(end)) {
        ended = true;
      } else if (started) {
        obj.restrictionBypassEval = obj.restrictionBypassEval + line + '\n';
      } 
    }
  }
};

//=============================================================================
// Game_BattlerBase
//=============================================================================

Game_BattlerBase.prototype.restriction = function() {
  var restriction = Math.max.apply(null, this.states().map(state => 
      this.checkRestriction(state)
  ).concat(0));

  if (this.isChEf(11,5)) restriction.clamp(0,1)
  return restriction;
};

Game_BattlerBase.prototype.checkRestriction = function(state) {
  if (!state) return 0;
  if (!state.restrictionBypassEval) return state.restriction;
  var bypass = false;
  var stateId = state.id;
  var a = this;
  var user = this;
  var target = this;
  var s = $gameSwitches._data;
  var v = $gameVariables._data;
  var code = state.restrictionBypassEval;
  try {
    eval(code);
  } catch (e) {
    console.log(e.message);
    console.log("Maybe check out state #"+stateId+"'s restriction bypass condition");
  }
  return bypass ? 0 : state.restriction;
}
