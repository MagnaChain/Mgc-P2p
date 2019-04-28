'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var bitcore = require('bitcore-lib');
var BufferWriter = bitcore.encoding.BufferWriter;
var BufferReader = bitcore.encoding.BufferReader;
var BN = bitcore.crypto.BN;
var Hash = bitcore.crypto.Hash;
var utils = require('../utils');
var packageInfo = require('../../../package.json');

/**
 * The version message is used on connection creation to advertise
 * the type of node. The remote node will respond with its version, and no
 * communication is possible until both peers have exchanged their versions.
 *
 * @see https://en.bitcoin.it/wiki/Protocol_documentation#version
 * @param {Object=} arg - properties for the version message
 * @param {Buffer=} arg.nonce - a random 8 byte buffer
 * @param {String=} arg.subversion - version of the client
 * @param {BN=} arg.services
 * @param {Date=} arg.timestamp
 * @param {Number=} arg.startHeight
 * @param {Object} options
 * @extends Message
 * @constructor
 */
function VersionMessage(arg, options) {
  /* jshint maxcomplexity: 10 */
  if (!arg) {
    arg = {};
  }
  
  //console.log("################### VersionMessage arg : " + JSON.stringify(arg) );
  Message.call(this, options);
  this.command = 'version';
  this.version = arg.version || options.protocolVersion;
  //console.log("################### VersionMessage version : " + JSON.stringify(this.version) );
  this.nonce = arg.nonce || utils.getNonce();
  //console.log("################### VersionMessage nonce : " + JSON.stringify(this.nonce) );
  this.services = arg.services || new BN(1, 10);
  //console.log("################### VersionMessage services : " + JSON.stringify(this.services) );
  this.timestamp = arg.timestamp || new Date();
  //this.subversion = arg.subversion || '/bitcore:' + packageInfo.version + '/';
  this.subversion = arg.subversion || "/Magnachain:0.15.1/";
  //console.log("################### VersionMessage subversion : " + JSON.stringify(this.subversion) );
  this.startHeight = arg.startHeight || 0;
  //console.log("################### VersionMessage startHeight : " + JSON.stringify(this.startHeight) );
  this.relay = arg.relay === false ? false : true;
  //console.log("################### VersionMessage subversion : " + JSON.stringify(this.relay) );
}
inherits(VersionMessage, Message);

VersionMessage.prototype.setPayload = function(payload) {
	
  console.log("################### VersionMessage start read msg : ");
  var parser = new BufferReader(payload);
  this.version = parser.readUInt32LE();
  this.services = parser.readUInt64LEBN();
  this.timestamp = new Date(parser.readUInt64LEBN().toNumber() * 1000);
  var branchId = parser.readVarLengthBuffer().toString();
  //console.log("################### VersionMessage branchId : " + branchId );
  
  //console.log("################### VersionMessage before parser.pos : " + JSON.stringify(parser.pos) );
  this.addrMe = {
    services: parser.readUInt64LEBN(),
    ip: utils.parseIP(parser),
    port: parser.readUInt16BE()
  };
  //console.log("################### VersionMessage after parser.pos : " + JSON.stringify(parser.pos) );
  this.addrYou = {
    services: parser.readUInt64LEBN(),
    ip: utils.parseIP(parser),
    port: parser.readUInt16BE()
  };
  //console.log("################### VersionMessage setPayload : " + JSON.stringify(this.addrMe) );
  //console.log("################### VersionMessage setPayload : " + JSON.stringify(this.addrYou) );
  this.nonce = parser.read(8);
  this.subversion = parser.readVarLengthBuffer().toString();
  this.startHeight = parser.readUInt32LE();

  if(parser.finished()) {
    this.relay = true;
  } else {
    this.relay = !!parser.readUInt8();
  }
  utils.checkFinished(parser);
};

VersionMessage.prototype.getPayload = function() {
  var bw = new BufferWriter();
  bw.writeUInt32LE(this.version);
  bw.writeUInt64LEBN(this.services);

  var timestampBuffer = new Buffer(Array(8));
  timestampBuffer.writeUInt32LE(Math.round(this.timestamp.getTime() / 1000), 0);
  bw.write(timestampBuffer);
  
  bw.writeVarintNum(4);
  bw.write(new Buffer("main", 'ascii'));
  
  utils.writeAddr(this.addrMe, bw);
  //console.log("################### VersionMessage getPayload : " + JSON.stringify(this.addrMe) );
  utils.writeAddr(this.addrYou, bw);
  //console.log("################### VersionMessage getPayload : " + JSON.stringify(this.addrYou) );
  bw.write(this.nonce);
  bw.writeVarintNum(this.subversion.length);
  bw.write(new Buffer(this.subversion, 'ascii'));
  bw.writeUInt32LE(this.startHeight);
  bw.writeUInt8(this.relay);

  return bw.concat();
};

module.exports = VersionMessage;
