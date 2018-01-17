/**
 * @module ddf
 * @author kitt <yosshi1123@gmail.com>
 * @version 1.0.0
 * @requires module:msgpack-lite
 * @descriptionDodontoF.rb クライアント用JSライブラリ
 */

msgpack = require('msgpack-lite');

var ddf = {};
ddf.patterns = {};
ddf.base_url = "";
ddf.isDebug = false;

/**
 * @constant version
 * @description バージョン情報
 * @type {string}
 */
ddf.version = require("./package.json").version;

/**
 * @function sendMsg
 * @description 通信用基底メソッド
 * @param {Object} msg パラメーターオブジェクト
 * @param {string} [type=json] レスポンス形式
 * @return {Promise}
 */
ddf.sendMsg = function (msg, type = 'json'){
  return new Promise(function(resolve, reject){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", ddf.base_url+"DodontoFServer.rb", true);
    xhr.onload = function(r){resolve(r.target.response)};
    xhr.onerror = function(r){resolve(r.target.statusText)};
    xhr.responseType = type; 
    xhr.setRequestHeader('Content-Type', 'application/x-msgpack');
    //xhr.setRequestHeader('Content-Type', 'application/x-msgpack');
    xhr.send(msgpack.encode(msg));
  }).catch(function(r){
    console.log("ddf.sendMsg rejected ("+r+")");
  }).then(function(r){
    if(ddf.isDebug){
      console.log({caller: msg.cmd, param: msg, result: r});
    }
    return r;
  });
}

ddf.util = {};

ddf.util.getUniqueId = function(){
  return Math.random().toString(36).replace(/[^a-zA-Z0-9]+/g, '').substr(1, 8);
};

ddf.util.getDiceBotName = function(gametype){
  gametype == "diceBot" && (gametype = "Dicebot");
  result = ddf.info.diceBotInfos.find(function(elm){return this == elm.gameType;}, gametype);
  if(result){
    return result.name;
  }else{
    return "";
  }
};

ddf.util.hashSort = function(hash, func = null, asA = false){
  var keys = [];
  for(key in hash){
    if(key == undefined && has[key] == undefined){continue;}
    keys[keys.length] = {
      key: key,
      val: func(hash[key])
    }; 
  }
  keys.sort(function(a,b){return (a.val > b.val)?1:-1;});
  if(asA) return keys.map(function(r){return r.val;});
  var newhash = [];
  for(obj of keys) newhash[obj.key] = hash[obj.key];
  return newhash;
}

ddf.userState = {};

/**
 * @function getLoginInfo
 * @description 初期情報の取得
 * @param {String} [uniqueId=null] ユニークID（2回目以降のログイン）
 * @return {Promise}
 */
ddf.getLoginInfo = function(uniqueId = null){
  return ddf.sendMsg({
    room : ddf.userState.room,
    cmd  : "getLoginInfo",
    own  : ddf.userState.own,
    params : {
      uniqueId: uniqueId
    }
  });
};

/**
 * @function loginPassword
 * @description 入室パスワードの認証
 * @param {Integer} [roomNumber] 部屋番号
 * @param {String} [password] パスワード
 * @param {Boolean} [visiterMode] 見学フラグ
 * @return {Promise}
 */
ddf.loginPassword = function(roomNumber, password, visiterMode) {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
      roomNumber: roomNumber,
      password: password,
      visiterMode: visiterMode
    },
    cmd: "loginPassword"
  });
};

/**
 * @function logout
 * @description 部屋からの退出
 * @return {Promise}
 */
ddf.logout = function() {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
      uniqueId : ddf.info.uniqueId+ddf.userState.own,
    },
    cmd: "logout"
  });
};

/**
 * @function removeOldPlayRoom
 * @description 古い部屋の削除
 * @return {Promise}
 */
ddf.removeOldPlayRoom = function(){
  return ddf.sendMsg({
    room : ddf.userState.room,
    own  : ddf.info.uniqueId + ddf.userState.own,
    params : {
    },
    cmd  : "removeOldPlayRoom"
  });
};

/**
 * @function createPlayRoom
 * @description 部屋の作成
 * @param {Integer} playRoomIndex 部屋番号
 * @param {String} playRoomName 部屋タイトル
 * @param {String} playRoomPassword 部屋パスワード
 * @param {String} gameType ダイスボット
 * @param {Boolean} canVisit 見学可フラグ
 * @param {Boolean} canUseExternalImage 外部画像可フラグ
 * @param {Array(String)} chatChannelNames チャットタブ
 * @param {ViewStatesObject} viewStates 初期表示状態
 * @param {String} createPassword 作成パスワード
 * @return {Promise}
 * @see {@link util.createViewStates}
 */
ddf.createPlayRoom = function(playRoomIndex, playRoomName, playRoomPassword, gameType, canVisit, canUseExternalImage, chatChannelNames, viewStates, createPassword) {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
      playRoomIndex: playRoomIndex,
      playRoomName: playRoomName,
      playRoomPassword: playRoomPassword,
      gameType: gameType,
      canVisit: canVisit,
      canUseExternalImage: canUseExternalImage,
      chatChannelNames: chatChannelNames,
      viewStates: viewStates,
      createPassword: createPassword
    },
    cmd: "createPlayRoom"
  });
};

/**
 * @function changePlayRoom
 * @description 部屋の情報変更
 * @param {String} playRoomName 部屋タイトル
 * @param {String} playRoomPassword 新規パスワード
 * @param {String} gameType ダイスボット
 * @param {Boolean} canVisit 見学可フラグ
 * @param {Boolean} canUseExternalImage 外部画像可フラグ
 * @param {Array(String)} chatChannelNames チャットタブ
 * @param {ViewStatesObject} viewStates 初期表示状態
 * @return {Promise}
 * @see {@link util.createViewStates}
 */
ddf.changePlayRoom = function(playRoomName, playRoomPassword, gameType, canVisit, canUseExternalImage, chatChannelNames, viewStates) {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
      playRoomName: playRoomName,
      playRoomPassword: playRoomPassword,
      gameType: gameType,
      canVisit: canVisit,
      canUseExternalImage: canUseExternalImage,
      chatChannelNames: chatChannelNames,
      viewStates: viewStates,
    },
    cmd: "changePlayRoom"
  });
};

/**
 * @function getPlayRoomInfo
 * @description 部屋情報一覧の取得
 * @param {Integer} min 開始部屋番号
 * @param {Integer} max 終了部屋番号
 * @return {Promise}
 */
ddf.getPlayRoomInfo = function(min, max){
  return ddf.sendMsg({
    room: ddf.userState.room,
    cmd : "getPlayRoomStates",
    own : ddf.info.uniqueId + ddf.userState.own,
    params : {
      minRoom : min, 
      maxRoom : max
    }
  });
};

/**
 * @function checkRoomStatus
 * @description 詳細な部屋情報の取得
 * @param {Integer} roomNumber 部屋番号
 * @return {Promise}
 */
ddf.checkRoomStatus = function(roomNumber) {
  return ddf.sendMsg({
    params: {
      roomNumber: roomNumber
    },
    cmd: "checkRoomStatus",
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own
  });
};

/**
 * @function addBotTable
 * @description ダイスボットテーブルの追加
 * @param {String} gameType ダイスボット
 * @param {String} title テーブルタイトル
 * @param {String} command 反応する文字列
 * @param {String} dice ランダマイザ文字列
 * @param {String} table テーブル内容
 * @return {Promise}
 */
ddf.addBotTable = function(gameType, title, command, dice, table) {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
      gameType: gameType,
      title: title,
      command: command,
      dice: dice,
      table: table
    },
    cmd: "addBotTable"
  });
};

/**
 * @function changeBotTable
 * @description ダイスボットテーブルの変更
 * @param {String} originalGameType 元のダイスボット
 * @param {String} originalCommand 元のコマンド
 * @param {String} gameType ダイスボット
 * @param {String} title テーブルタイトル
 * @param {String} command 反応する文字列
 * @param {String} dice ランダマイザ文字列
 * @param {String} table テーブル内容
 * @return {Promise}
 */
ddf.changeBotTable = function(originalGameType, originalCommand, gameType, title, command, dice, table) {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
      originalGameType: originalGameType,
      originalCommand: originalCommand,
      gameType: gameType,
      title: title,
      command: command,
      dice: dice,
      table: table
    },
    cmd: "changeBotTable"
  });
};

/**
 * @function removeBotTable
 * @description ダイスボットテーブルの削除
 * @param {String} command 反応する文字列
 * @return {Promise}
 * @see ダイスボットは区別されない
 */
ddf.removeBotTable = function(command) {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
      command: command
    },
    cmd: "removeBotTable"
  });
};

/**
 * @function requestReplayDataList
 * @description リプレイデータ一覧の取得
 * @return {Promise}
 */
ddf.requestReplayDataList = function() {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
    },
    cmd: "requestReplayDataList"
  });
};

/**
 * @function removeReplayData
 * @description リプレイデータの削除
 * @param {String} title タイトル
 * @param {String} url URL
 * @return {Promise}
 */
ddf.removeReplayData = function(title, url) {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
      title: title,
      url: url
    },
    cmd: "removeReplayData"
  });
}

/**
 * @function getDiceBotInfos
 * @description 全ダイスボット情報の取得
 * @return {Promise}
 */
ddf.getDiceBotInfos = function() {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
    },
    cmd: "getDiceBotInfos"
  });
};

/**
 * @function getBotTableInfos
 * @description 追加ダイスボットテーブルの取得
 * @return {Promise}
 */
ddf.getBotTableInfos = function() {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId+ddf.userState.own,
    params: {
    },
    cmd: "getBotTableInfos"
  });
};


/**
 * @function refresh
 * @description 部屋の更新情報の取得
 * @return {Promise}
 */
ddf.refresh = function(){
  return ddf.sendMsg({
    room: ddf.userState.room,
    params: {
      rIndex: ddf.userState.rIndex++,
      name: ddf.userState.name,
      times: ddf.userState.lastUpdateTimes,
    },
    own: ddf.info.uniqueId+ddf.userState.own,
    cmd: "refresh"
  });
}

/**
 * @function sendChatMessage
 * @description チャットメッセージの送信
 * @param {Integer} channel タブ番号
 * @param {String} senderName 発言者の名前
 * @param {String} message 発言内容
 * @param {String} color 発言の色（RRGGBBのカラーコード）
 * @param {Boolean} [dummy=false] システムメッセージフラグ
 * @return {Promise}
 */
ddf.sendChatMessage = function(channel, senderName, message, color, dummy = false){
  return ddf.sendMsg({
    room: ddf.userState.room,
    params: {
      uniqueId: dummy?'dummy':ddf.info.uniqueId+ddf.userState.own,
      message: message,
      senderName: senderName,
      color: color,
      channel: channel
    },
    own: ddf.info.uniqueId+ddf.userState.own,
    cmd: "sendChatMessage"
  });
};

/**
 * @function sendChatMessageAll
 * @description メンテナンスチャットメッセージの送信
 * @param {String} password 管理パスワード
 * @param {String} senderName 発言者の名前
 * @param {String} message 発言内容
 * @return {Promise}
 * @see どどんとふがメンテナンスモードでなければ使用できません。
 */
ddf.sendChatMessageAll = function(password, senderName, message){
  return ddf.sendMsg({
    room: -1,
    params: {
      password: password,
      uniqueId: ddf.info.uniqueId+ddf.userState.own,
      message: message,
      senderName: senderName,
      color: '000000',
      channel: 0
    },
    own: ddf.info.uniqueId+ddf.userState.own,
    cmd: "sendChatMessageAll"
  });
};


/**
 * @function clearGraveyard
 * @description 墓地のコマの全消去
 * @return {Promise}
 */
ddf.clearGraveyard = function(){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {},
    cmd: "clearGraveyard"
  });
};

/**
 * @function getGraveyardCharacterData
 * @description 墓地のコマ一覧の取得
 * @return {Promise}
 */
ddf.getGraveyardCharacterData = function(){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {},
    cmd: "getGraveyardCharacterData"
  });
};

/**
 * @function resurrectCharacter
 * @description 墓地のコマを戻す
 * @param {String} imgId コマの識別ID
 * @return {Promise}
 */
ddf.resurrectCharacter = function(imgId){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      imgId: imgId
    },
    cmd: "resurrectCharacter"
  });
};

/**
 * @function removePlayRoom
 * @description 部屋の削除
 * @param {Array(Integer)} roomNumbers 部屋番号
 * @param {Boolean} ignoreLoginUser 入室者を無視する
 * @param {String} password 入室パスワード
 * @param {String} [adminPassword=""] 管理パスワード
 * @param {Boolean} [isForce=false] 管理権限を使用する
 * @return {Promise}
 */
ddf.removePlayRoom = function(roomNumbers, ignoreLoginUser, password, adminPassword = "", isForce = false) {
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params:{
      ignoreLoginUser: ignoreLoginUser,
      adminPassword: adminPassword, 
      password: password,
      roomNumbers: [roomNumbers],
      isForce:isForce
    }, 
    cmd: "removePlayRoom",
  });
};

/**
 * @function getWaitingRoomInfo
 * @description 待合室のコマ一覧の取得
 * @return {Promise}
 */
ddf.getWaitingRoomInfo = function(){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {},
    cmd: "getWaitingRoomInfo"
  });
};


/**
 * @function save
 * @description セーブデータの作成
 * @param {"sav"} extension *deprecated
 * @return {Promise}
 * @deprecated extensionは指定できなくなりました。（Ver.1.48.31）
 */
ddf.save = function(){
  return ddf.sendMsg({
    extension: "sav",
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {},
    cmd: "save"
  });
};

/**
 * @function saveMap
 * @description マップセーブデータの作成
 * @param {"sav"} extension *deprecated
 * @return {Promise}
 * @deprecated extensionは指定できなくなりました（Ver.1.48.31）
 */
ddf.saveMap = function(){
  return ddf.sendMsg({
    extension: "msv",
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {},
    cmd: "saveMap"
  });
};

/**
 * @function saveAllData
 * @description 全セーブデータの作成
 * @param {ChatPaletteDataObject} chatPaletteData チャットパレットデータ
 * @return {Promise}
 * @see {@link util.createChatPaletteData}
 */
ddf.saveAllData = function(chatPaletteData){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      chatPaletteData: chatPaletteData,
      baseUrl: ddf.base_url
    },
    cmd: "saveAllData"
  });
};

/**
 * @function getImageTagsAndImageList
 * @description 画像とタグデータ一覧の取得
 * @return {Promise}
 */
ddf.getImageTagsAndImageList = function(){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {},
    cmd: "getImageTagsAndImageList"
  });
};

/**
 * @function deleteImage
 * @description 画像データの削除
 * @param {Array(String)} imageUrlList 削除する画像URL
 * @return {Promise}
 */
ddf.deleteImage = function(imageUrlList){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      imageUrlList: imageUrlList,
    },
    cmd: "deleteImage"
  });
};

/**
 * @function changeImageTags
 * @description 画像タグの変更
 * @param {String} source 変更する画像URL
 * @param {Array(String)} tagInfo タグ情報
 * @return {Promise}
 */
ddf.changeImageTags = function(source, tagInfo){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      imageUrlList: imageUrlList,
      tagInfo: tagInfo
    },
    cmd: "changeImageTags"
  });
};

/**
 * @function deleteChatLog
 * @description チャットログの削除
 * @return {Promise}
 */
ddf.deleteChatLog = function(){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
    },
    cmd: "deleteChatLog"
  });
};

/**
 * @function sendDiceBotChatMessage
 * @description ダイスボットで処理されるチャットの送信
 * @param {Integer} channel タブ番号
 * @param {String} senderName 発言者の名前
 * @param {String} state 状態
 * @param {Integer} repeatCount 繰り返し回数
 * @param {String} message 発言内容
 * @param {String} color 発言の色（RRGGBBのカラーコード）
 * @param {String} gameType ダイスボット
 * @param {Boolean} [isNeedResult=true] 結果をチャットに表示させる
 * @return {Promise}
 */
ddf.sendDiceBotChatMessage = function(channel, name, state, repeatCount, message, color, gameType, isNeedResult = true){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      channel: channel,
      name: name,
      state: state,
      color: color,
      repeatCount: parseInt(repeatCount),
      message: message,
      gameType: gameType,
      isNeedResult: isNeedResult,
      randomSeed: Math.random() * 65536|0, 
      uniqueId: ddf.info.uniqueId + ddf.userState.own
    },
    cmd: "sendDiceBotChatMessage"
  });
};

/**
 * @function uploadImageData
 * @description 画像のアップロード
 * @param {String} imageFileName ローカルファイル名
 * @param {Uint8Array} imageData 画像のバイナリデータ
 * @param {String} password 状態
 * @param {Array(String)} tags タグ情報
 * @param {Integer} roomNumber 部屋番号(0で共有)
 * @return {Promise}
 */
ddf.uploadImageData = function(imageFileName, imageData, password, tags, roomNumber){
  u8array = imageData;
  imageDataMsg = msgpack.encode(u8array);
  imageDataMsg = imageDataMsg.slice(imageDataMsg.indexOf(u8array[0]));
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      tagInfo: roomNumber != null?{
        password: password,
        tags: tags,
        roomNumber: roomNumber
      }:{
        password: password,
        tags: tags
      },
      smallImageData: imageDataMsg,
      imageData: imageDataMsg,
      imageFileName: imageFileName
    },
    cmd: "uploadImageData",
  });
};

/**
 * @function uploadImageUrl
 * @description URL画像の追加
 * @deprecated このAPIは部屋情報を破壊する可能性があるため、使用できません。
 * @return {Promise}
 */
ddf.uploadImageUrl = function(imageUrl, password, tags, roomNumber){
/*  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      imageUrl: imageTrl,
      tagInfo: {
        password: password,
        tags: tags,
        roomNumber: roomNumber
      }
    },
    cmd: "uploadImageUrl"
  });*/
  return null;
};

/**
 * @function addEffectCharacter
 * @description 立ち絵の追加
 * @param {String} name キャラクター名
 * @param {String} state キャラクター状態
 * @param {String} motion キャラクター動作
 * @param {String} source 画像URL
 * @param {Boolean} mirrored 左右反転フラグ
 * @param {Integer} leftIndex 表示位置
 * @return {Promise}
 */
ddf.addEffectCharacter = function(name, state, motion, source, mirrored, leftIndex){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      type: "standingGraphicInfos",
      name: name,
      state: state,
      motion: motion,
      source: source,
      mirrored: mirrored,
      leftIndex: leftIndex
    },
    cmd: "addEffect"
  });
};

/**
 * @function changeEffectCharacter
 * @description 立ち絵の変更
 * @param {String} effectId 変更するエフェクトID
 * @param {String} name キャラクター名
 * @param {String} state キャラクター状態
 * @param {String} motion キャラクター動作
 * @param {Boolean} mirroed 左右反転フラグ
 * @param {Integer} leftIndex 表示位置
 * @return {Promise}
 */
ddf.changeEffectCharacter = function(effectId, name, state, motion, source, mirroed, leftIndex){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      effectId: effectId,
      type: "standingGraphicInfos",
      name: name,
      state: state,
      motion: motion,
      source: source,
      mirrored: mirroed,
      leftIndex: leftIndex
    },
    cmd: "changeEffect"
  });
};

/**
 * @function addEffect
 * @description エフェクトの追加
 * @param {String} message キーワード
 * @param {Boolean} isTail 末尾に反応させる
 * @param {String} cutInTag カットインタグ
 * @param {Integer} height 表示高さ
 * @param {Integer} width 表示幅
 * @param {String} position 表示位置
 * @param {String} source エフェクト画像URL
 * @param {Float} displaySeconds 表示秒数
 * @param {String} soundSource サウンドファイルURL
 * @param {Float} volume 音量
 * @param {Boolean} isSoundLoop 音声ループフラグ
 * @return {Promise}
 */
ddf.addEffect = function(message, isTail, cutInTag, height, width, position, source,
                         displaySeconds, soundSource, volume, isSoundLoop){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      message: message,
      isTail: isTail,
      cutInTag: cutInTag,
      height: height,
      width: width,
      position: position,
      source: source,
      displaySeconds: displaySeconds,
      soundSource: soundSource,
      volume: volume,
      isSoundLoop: isSoundLoop
    },
    cmd: "addEffect"
  });
};

/**
 * @function changeEffect
 * @description エフェクトの変更元
 * @param {String} effectId 変更するエフェクトID
 * @param {String} message キーワード
 * @param {Boolean} isTail 末尾に反応させる
 * @param {String} cutInTag カットインタグ名
 * @param {Integer} height 表示高さ
 * @param {Integer} width 表示幅
 * @param {String} position 表示位置
 * @param {String} source エフェクト画像URL
 * @param {Float} displaySeconds 表示秒数
 * @param {String} soundSource サウンドファイルURL
 * @param {Float} volume 音量
 * @param {Boolean} isSoundLoop 音声ループフラグ
 * @return {Promise}
 */
ddf.changeEffect = function(effectId, message, isTail, cutInTag, height, width, position, source,
                         displaySeconds, soundSource, volume, isSoundLoop){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      effectId: effectId,
      message: message,
      isTail: isTail,
      cutInTag: cutInTag,
      height: height,
      width: width,
      position: position,
      source: source,
      displaySeconds: displaySeconds,
      soundSource: soundSource,
      volume: volume,
      isSoundLoop: isSoundLoop
    },
    cmd: "changeEffect"
  });
};

/**
 * @function removeEffect
 * @description エフェクト・立絵の削除
 * @param {Array(String)} effectIds 削除するエフェクトIDのリスト
 * @return {Promise}
 */
ddf.removeEffect = function(effectIds){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      effectIds: effectIds
    },
    cmd: "removeEffect"
  });
};

/**
 * @function changeEffectsAll
 * @description エフェクトの並び替え
 * @param {Array(EffectObject)} effects エフェクトデータ
 * @return {Promise}
 */
ddf.changeEffectsAll = function(effects){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: effects,
    cmd: "changeEffectsAll"
  });
};

/**
 * @function addResource
 * @description リソースの追加
 * @param {String} name リソース名
 * @param {Integer} value リソースの値
 * @param {Boolean} check リソースのチェック状態
 * @param {String} unit その他の値
 * @return {Promise}
 */
ddf.addResource = function(name, value, check, unit){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      name: name,
      value: value,
      check: check,
      unit: unit
    },
    cmd: "addResouce"
  });
};

/**
 * @function changeResource
 * @description リソースの変更
 * @param {String} name 変更するリソースID
 * @param {String} name リソース名
 * @param {Integer} value リソースの値
 * @param {Boolean} check リソースのチェック状態
 * @param {String} unit その他の値
 * @return {Promise}
 */
ddf.changeResource = function(resourceId, name, value, check, unit){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      resourceId: resourceId,
      name: name,
      value: value,
      check: check,
      unit: unit
    },
    cmd: "changeResouce"
  });
};

/**
 * @function changeResourcesAll
 * @description リソースの並び替え
 * @param {Array(ResourceObject)} resources リソースの内容
 * @return {Promise}
 */
ddf.changeResourcesAll = function(resources){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: resouces,
    cmd: "changeResoucesAll"
  });
};

/**
 * @function removeResource
 * @description リソースの削除
 * @param {String} 削除するリソースID
 * @return {Promise}
 */
ddf.removeResource = function(resourceId){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      resourceId: resourceId
    },
    cmd: "removeResouce"
  });
};

/**
 * @function changeRoundTime
 * @description イニシアティブ表の更新
 * @param {Integer} round ラウンド数
 * @param {Float} initiative イニシアティブの値
 * @param {String} カウンター名の一覧
 * @return {Promise}
 */
ddf.changeRoundTime = function(round, initiative, counterNames){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      round: round,
      initiative: initiative,
      counterNames: counterNames
    },
    cmd: "changeRoundTime"
  });
};

/**
 * @function initCard
 * @description カードデッキの準備
 * @param {Array(cardTypeInfoObject)} cardTypeInfos カード設定情報
 * @return {Promise}
 */
ddf.initCards = function(cardTypeInfos){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      cardTypeInfos: cardTypeInfos
    },
    cmd: "initCards"
  });
};

/**
 * @function drawCard
 * @description 山札からカードを引く
 * @param {String} mountName 山札の名前
 * @param {Integer} count 枚数
 * @param {Integer} x x座標
 * @param {Integer} y y座標
 * @param {Boolean} isOpen 公開状態
 * @param {String} imgId 山札オブジェクトのID
 * @return {Promise}
 */
ddf.drawCard = function(mountName, count, x, y, isOpen, imgId){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      mountName: mountName,
      count: count,
      x: x,
      y: y,
      isOpen: isOpen,
      imgId: imgId,
      owner: ddf.info.uniqueId,
      ownerName: ddf.userinfo.name
    },
    cmd: "drawCard"
  });
};

/**
 * @function returnCardToMount
 * @description 山札をシャッフルせずにカードを戻す
 * @param {String} returnCardId 戻すカードのID
 * @param {String} cardMountId カードを戻す山札のID
 * @param {String} mountName カードを戻す山札の名前
 * @return {Promise}
 */
ddf.returnCardToMount = function(returnCardId, cardMountId, mountName){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      returnCardId: returnCardId,
      cardMountId: cardMountId,
      mountName: mountName
    },
    cmd: "returnCardToMount"
  });
};

/**
 * @function dumpTrushCards
 * @description カード捨て場にカードを捨てる
 * @param {String} dumpedCardId 捨てるカードのID
 * @param {String} trushMountId 捨て山のID
 * @param {String} mountName 山札の名前
 * @return {Promise}
 */
ddf.dumpTrushCards = function(dumpedCardId, trushMountId, mountName){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      dumpedCardId: dumpedCardId,
      trushMountId: trushMountId,
      mountName: mountName
    },
    cmd: "dumpTrashCard"
  });
};

/**
 * @function shuffleOnlyMountCards
 * @description 捨て山のカードを戻さずに山札をシャッフルする
 * @param {String} mountId シャッフルする山札のID
 * @param {String} mountName 山札の名前
 * @return {Promise}
 */
ddf.shuffleOnlyMountCards = function(mountId, mountName){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      mountId: mountId,
      mountName: mountName
    },
    cmd: "shuffleOnlyMountCards"
  });
};

/**
 * @function drawTargetCard
 * @description 山札から選んでカードを引く
 * @param {String} targetCardId 選んだカードのID
 * @param {String} mountId 山札のID
 * @param {String} mountName 山札の名前
 * @param {Integer} x x座標
 * @param {Integer} y y座標
 * @return {Promise}
 */
ddf.drawTargetCard = function(targetCardId, mountId, mountName, x, y){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      targetCardId: targetCardId,
      mountId: mountId,
      mountName: mountName,
      x: x,
      y: y,
      owner: ddf.info.uniqueId,
      ownerName: ddf.userinfo.name
    },
    cmd: "drawTargetCard"
  });
};

/**
 * @function drawTargetTrushCard
 * @description 捨て山からカードを選んで引く
 * @param {String} targetCardId 選んだカードのID
 * @param {String} mountId 山札のID
 * @param {String} mountName 山札の名前
 * @param {Integer} x x座標
 * @param {Integer} y y座標
 * @return {Promise}
 */
ddf.drawTargetTrushCard = function(targetCardId, mountId, mountName, x, y){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      targetCardId: targetCardId,
      mountId: mountId,
      mountName: mountName,
      x: x,
      y: y,
      owner: ddf.info.uniqueId,
      ownerName: ddf.userinfo.name
    },
    cmd: "drawTargetTrushCard"
  });
};

/**
 * @function getMountCardInfos
 * @description 山札のカード一覧を取得する
 * @see このAPIではカードの中身を見たことは通知されない。
 * @param {String} mountId 山札のID
 * @param {String} mountName 山札の名前
 * @return {Promise}
 */
ddf.getMountCardInfos = function(mountId, mountName){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      mountId: mountId,
      mountName: mountName,
    },
    cmd: "getMountCardInfos"
  });
};

/**
 * @function getTrushMountCardInfos
 * @description 捨て山のカード一覧を取得する
 * @see このAPIではカードの中身を見たことは通知されない。
 * @param {String} mountId 捨て山のID
 * @param {String} mountName 山札の名前
 * @return {Promise}
 */
ddf.getTrushMountCardInfos = function(mountId, mountName){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      mountId: mountId,
      mountName: mountName,
    },
    cmd: "getTrushMountCardInfos"
  });
};

/**
 * @function addCardZone
 * @description カード置き場を追加する
 * @param {Integer} x x座標
 * @param {Integer} y y座標
 * @return {Promise}
 */
ddf.addCardZone = function(x,y){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      x: x,
      y: y,
      owner: ddf.info.uniqueId,
      ownerName: ddf.userinfo.name
    },
    cmd: "addCardZone"
  });
};

/**
 * @function returnCard
 * @description 捨て山のカードを場に戻す
 * @param {String} imgId 戻すカードのID
 * @param {String} mountName 山札の名前
 * @param {Integer} x x座標
 * @param {Integer} y y座標
 * @return {Promise}
 */
ddf.returnCard = function(imgId, mountName, x, y){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      imdId: imgId,
      mountName, mountName,
      x: x,
      y: y
    },
    cmd: "returnCard"
  });
};

/**
 * @function shuffleCards
 * @description 捨て山を山札に戻す
 * @param {String} mountId 山札のID
 * @param {String} mountName 山札の名前
 * @param {Boolean} isShuffle 山札をシャッフルする
 * @return {Promise}
 */
ddf.shuffleCards = function(mountId, mountName, isShuffle){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      mountId: mountId,
      mountName, mountName,
      isShuffle: isShuffle
    },
    cmd: "shuffleCards"
  });
};

/**
 * @function shuffleForNextRandomDungeon
 * @description 次の山札を準備する（アリアンロッド専用）
 * @param {String} mountId 山札のID
 * @param {String} mountName 山札の名前
 * @return {Promise}
 */
ddf.shuffleForNextRandomDungeon = function(mountId, mountName){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      mountId: mountId,
      mountName, mountName
    },
    cmd: "shuffleForNextRandomDungeon"
  });
};

/**
 * @function getCardList
 * @description 山札のカード内容を取得する
 * @param {String} mountName 山札の名前
 * @return {Promise}
 */
ddf.getCardList = function(mountName){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      mountName, mountName
    },
    cmd: "getCardList"
  });
};

/**
 * @function addCard
 * @description メッセージカードを作成する
 * @param {Integer} x x座標
 * @param {Integer} y y座標
 * @param {String} imageNameBack 裏面の内容
 * @param {String} imageName 表面の内容
 * @return {Promise}
 */
ddf.addCard = function(x, y, imageNameBack, imageName){
  
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      x: x,
      y: y,
      imageNameBack: imageNameBack,
      imageName: imageName,
      canRewrite: true,
      isText: true,
      mountName: "messageCard",
      canDelete: true,
      isUpDown: false
    },
    cmd: "addCard"
  });
};

/**
 * @function moveCharacter
 * @description キャラクターオブジェクトを移動する
 * @param {String} imgId オブジェクトID
 * @param {Integer} x x座標
 * @param {Integer} y y座標
 * @return {Promise}
 */
ddf.moveCharacter = function(imgId, x, y){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      imgId: imgId,
      x: x,
      y: y
    },
    cmd: "moveCharacter"
  });
};

/**
 * @function removeCharacter
 * @description キャラクターオブジェクトを削除する
 * @param {String} imgId オブジェクトID
 * @param {String} [isGotoGraveyard=true] 墓場に残すかどうか
 * @return {Promise}
 */
ddf.removeCharacter = function(imgId, isGotoGraveyard = true){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: [{
      imgId: imgId,
      isGotoGraveyard: isGotoGraveyard
    }],
    cmd: "removeCharacter"
  });
};

/**
 * @function removeCharacters
 * @description キャラクターオブジェクトをまとめて削除する
 * @param {Array(String)} imgId オブジェクトID
 * @param {String} [isGotoGraveyard=true] 墓場に残す
 * @return {Promise}
 */
ddf.removeCharacters = function(imgId, isGotoGraveyard = true){
  var params = [];
  for(id of imgId){
    params[params.length] = {
      imgId: id,
      isGotoGraveyard: isGotoGraveyard
    }
  }
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: params,
    cmd: "removeCharacter"
  });
};

/**
 * @function enterWaitingRoomCharacter
 * @description キャラクターオブジェクトを待合室に送る
 * @param {String} characterId オブジェクトID
 * @param {Integer} index 入れる順番
 * @return {Promise}
 */
ddf.enterWaitingRoomCharacter = function(characterId, index){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      characterId: characterId,
      index: index
    },
    cmd: "enterWaitingRoomCharacter"
  });
};

/**
 * @function exitWaitingRoomCharacter
 * @description キャラクターオブジェクトを待合室から出す
 * @param {String} characterId オブジェクトID
 * @param {Integer} x x座標
 * @param {Integer} y y座標
 * @return {Promise}
 */
ddf.exitWaitingRoomCharacter = function(characterId, x, y){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      characterId: characterId,
      x: x,
      y: y
    },
    cmd: "exitWaitingRoomCharacter"
  });
};

/**
 * @function addCharacter
 * @description キャラクターコマの追加
 * @param {Object} data キャラクターのデータ
 * @return {Promise}
 */
ddf.addCharacter = function(data){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: data,
    cmd: "addCharacter"
  });
};

/**
 * @function changeCharacter
 * @description キャラクターコマの変更
 * @param {Object} data キャラクターのデータ
 * @return {Promise}
 */
ddf.changeCharacter = function(data){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: data,
    cmd: "changeCharacter"
  });
};

/**
 * @function changeMap
 * @description マップ情報の変更
 * @param {String} mapType マップ種類（画像or白地図）
 * @param {String} imageSource 画像URL
 * @param {Integer} xMax 横サイズ
 * @param {Integer} yMax 縦サイズ
 * @param {Integer} gridInterval マス目のサイズ
 * @param {Boolean} isAlternately マス目を交互にする
 * @param {Boolean} mirrored 左右反転
 * @param {String} gridColor 簡易マップ作成のマス色(RRGGBB)
 * @param {Float} mapMarksAlpha 透過度
 * @param {Array(Integer)} [mapMarks=null] マップ作成のマス情報
 * @return {Promise}
 */
ddf.changeMap = function(mapType, imageSource, xMax, yMax, gridInterval, isAlternately,
                         mirrored, gridColor, mapMarksAlpha, mapMarks = null){
  if(mapMarks == null){
    mapMarks = new Array(yMax).fill(new Array(xMax).fill(-1));
  };
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      mapType: mapType,
      imageSource: imageSource,
      xMax: xMax,
      yMax: yMax,
      gridInterval: gridInterval,
      isAlternately: isAlternately,
      mirrored: mirrored,
      gridColor: gridColor,
      mapMarksAlpha: mapMarksAlpha,
      mapMarks: mapMarks
    },
    cmd: "changeMap"
  });
}

/**
 * @function drawOnMap
 * @description マップに手書きで書きこむ
 * @param {String} type 書き込む種類（鉛筆or消しゴム）
 * @param {Integer} weight 太さ
 * @param {String} color 色（RRGGBB）
 * @param {Array(Integer,Integer)} data 経路情報のリスト(x座標,y座標)
 * @return {Promise}
 */
ddf.drawOnMap = function(type, weight, color, data){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      data: {
        type: type,
        weight: weight,
        color: color
      },
      data
    },
    cmd: "drawOnMap"
  });
};

/**
 * @function convertDrawToImage
 * @description 手書きを画像に変換して削除する
 * @return {Promise}
 */
ddf.convertDrawToImage = function(fileData){
  u8array = fileData;
  fileDataMsg = msgpack.encode(u8array);
  fileDataMsg = fileDataMsg.slice(fileDataMsg.indexOf(u8array[0]));
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      fileData: fileData,
      tagInfo: {
        roomNumber: ddf.userState.room
      }
    },
    cmd: "convertDrawToImage"
  });
};

/**
 * @function clearDrawOnMap
 * @description 手書きを削除する
 * @return {Promise}
 */
ddf.clearDrawOnMap = function(){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
    },
    cmd: "clearDrawOnMap"
  });
};

/**
 * @function undoDrawOnMap
 * @description 手書きを一画分戻す
 * @return {Promise}
 */
ddf.undoDrawOnMap = function(){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
    },
    cmd: "undoDrawOnMap"
  });
};

/**
 * @function clearCharacterByType
 * @description 特定の種類のキャラクターをまとめて削除する
 * @param {Array(String)} types 対象の種類のリスト
 * @return {Promise}
 */
ddf.clearCharacterByType = function(types){
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      type: types
    },
    cmd: "clearCharacterByType"
  });
};

/**
 * @function uploadReplayData
 * @description リプレイのアップロード
 * @param {String} fileName ローカルファイル名
 * @param {String} replayDataName リプレイのタイトル
 * @param {String} ownUrl 記録したURL
 * @param {String} fileData ファイルの内容
 * @return {Promise}
 */
ddf.uploadReplayData = function(fileName, replayDataName, ownUrl, fileData) {
  u8array = fileData;
  fileDataMsg = msgpack.encode(u8array);
  fileDataMsg = fileDataMsg.slice(fileDataMsg.indexOf(u8array[0]));
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      fileName: fileName,
      replayDataName: replayDataName,
      ownUrl: ownUrl,
      fileData: fileDataMsg
    },
    cmd: "uploadReplayData"
  });
};

/**
 * @function uploadFile
 * @description 一時ファイルアップロード
 * @param {String} fileName ローカルファイル名
 * @param {String} baseUrl アップロード先のURL
 * @param {String} fileData ファイルの内容
 * @return {Promise}
 */
ddf.uploadFile = function(fileName, baseUrl, fileData){
  u8array = fileData;
  fileDataMsg = msgpack.encode(u8array);
  fileDataMsg = fileDataMsg.slice(fileDataMsg.indexOf(u8array[0]));
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      fileName: fileName,
      baseUrl: baseUrl,
      fileData: fileDataMsg
    },
    cmd: "uploadFile"
  });
};

/**
 * @function load
 * @description セーブデータを読み込む
 * @param {String} fileName ローカルファイル名
 * @param {String} fileData ファイルの内容
 * @param {Array(String)} [targets=null] 読み込む対象
 * @return {Promise}
 */
ddf.load = function(fileName, fileData, targets = null){
  u8array = fileData;
  fileDataMsg = msgpack.encode(u8array);
  fileDataMsg = fileDataMsg.slice(fileDataMsg.indexOf(u8array[0]));
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      fileName: fileName,
      fileData: fileDataMsg,
      targets: targets
    },
    cmd: "load"
  });
};

/**
 * @function load
 * @description セーブデータを読み込む
 * @param {String} fileName ローカルファイル名
 * @param {String} fileData ファイルの内容
 * @param {Array(String)} [targets=null] 読み込む対象
 * @return {Promise}
 */
ddf.loadAllSaveData = function(fileName, fileData){
  u8array = fileData;
  fileDataMsg = msgpack.encode(u8array);
  fileDataMsg = fileDataMsg.slice(fileDataMsg.indexOf(u8array[0]));
  return ddf.sendMsg({
    room: ddf.userState.room,
    own: ddf.info.uniqueId + ddf.userState.own,
    params: {
      fileName: fileName,
      fileData: fileDataMsg,
    },
    cmd: "loadAllSaveData"
  });
};

module.exports = ddf;