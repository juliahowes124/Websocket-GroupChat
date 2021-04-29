/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require("./Room");
const axios = require('axios');


async function getJoke() {
  const resp = await axios.get('https://icanhazdadjoke.com/', {headers: {Accept: "application/json"}});
  return resp.data.joke;
}
/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** Make chat user: store connection-device, room.
   *
   * @param send {function} callback to send message to this user
   * @param room {Room} room user will be in
   * */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** Send msgs to this client using underlying connection-send-function.
   *
   * @param data {string} message to send
   * */

  send(data) {
    try {
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** Handle joining: add to room members, announce join.
   *
   * @param name {string} name to use in room
   * */

  handleJoin(name) {
    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} joined "${this.room.name}".`,
    });
  }

  /** Handle a chat: broadcast to room.
   *
   * @param text {string} message to send
   * */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: "chat",
      text: text,
    });
  }

  handlePm(pm) {
      this.room.sendToOne(
        //if pm.to is defined then that is the recipient otherwise send to self
        pm.to? pm.to: this.name, {
        name: this.name,
        type: "chat",
        text: `[PRIVATE] ${pm.message}`,
      });
  }

  handleNameChange(newName) {
    this.room.broadcast({
      type: "note",
      text: `${this.name} is now "${newName}".`,
    });
    this.name = newName;
  }

  // handleSelfMessage(text) {
  //   this.send(JSON.stringify({
  //     name: this.name,
  //     type: "chat",
  //     text
  //   }));

  /** Handle messages from client:
   *
   * @param jsonData {string} raw message data
   *
   * @example<code>
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   * </code>
   */

  async handleMessage(jsonData) {
    let msg = JSON.parse(jsonData);

    if (msg.type === "join") this.handleJoin(msg.name);
    else if (msg.type === "joke"){
      msg.pm.message = await getJoke();
      this.handlePm(msg.pm);
    } 
    else if (msg.type === "members") {
      msg.pm.message = this.getMembersList();
      this.handlePm(msg.pm);
    }
    else if (msg.type === "nameChange") this.handleNameChange(msg.newName);
    else if (msg.type === "privateMessage") this.handlePm(msg.pm);
    else if (msg.type === "chat") this.handleChat(msg.text);
    else throw new Error(`bad message: ${msg.type}`);
  }

  getMembersList() {
    let memberArray = [];
    for(let member of this.room.members) {
      memberArray.push(member.name)
    }
    return `In room: ${memberArray.join(', ')}`
  }

  /** Connection was closed: leave room, announce exit to others. */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} left ${this.room.name}.`,
    });
  }
}

module.exports = ChatUser;
