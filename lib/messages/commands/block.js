'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var bitcore = require('bitcore-lib');
var $ = bitcore.util.preconditions;
var _ = bitcore.deps._;

/**
 * @param {Block=} arg - An instance of a Block
 * @param {Object} options
 * @param {Function} options.Block - A block constructor
 * @extends Message
 * @constructor
 */
function BlockMessage(arg, options) {
  //console.log("################### BlockMessage constructor " );
  Message.call(this, options);
  this.Block = options.Block;
  this.command = 'block';
  $.checkArgument(
    _.isUndefined(arg) || arg instanceof this.Block,
    'An instance of Block or undefined is expected'
  );
  this.block = arg;
}
inherits(BlockMessage, Message);

BlockMessage.prototype.setPayload = function(payload) {
  console.log("################### BlockMessage setPayload " );
  this.block = this.Block.fromRaw(payload);
  //this.block = this.Block.fromBuffer(payload);
};

BlockMessage.prototype.getPayload = function() {
  console.log("################### BlockMessage getPayload " );
  return this.block.toRaw();
  //return this.block.toBuffer(); 
};

module.exports = BlockMessage;
