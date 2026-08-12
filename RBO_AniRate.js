var Robro = Robro || {};
Robro.Ani = Robro.Ani || {};

//=============================================================================
 /*:
 * @plugindesc v1.0 Allow animations to have individual animation rates.
 * @author Robro
 * @help
 * By default, all animations in RPG Maker MV play at a shared animation rate 
 * that is distinct from the game's frame rate. This plugin will allow you to 
 * assign individual animation rates to individual animations when they play.
 * 
 * Insert [R:x] into the name of an animation within the database to assign an
 * animation rate of x for that individual animation. One animation frame's
 * length is equal to its animation rate's value in in-game frames. This means
 * lower numbers result in faster animations and higher numbers create slower
 * ones. 
 * 
 * The engine's default value is 4.
 * If this plugin is used with Yanfly's Battle Engine Core, place it below 
 * that within the Plugin Manager.
 */
//=============================================================================

Robro.Ani.Sprite_Animation_setupRate = Sprite_Animation.prototype.setupRate;
Sprite_Animation.prototype.setupRate = function() {
    Robro.Ani.Sprite_Animation_setupRate.call(this);
    if (this._animation.name.match(/\[R:(\d+)\]/i))
      this._rate = Number(RegExp.$1)

};