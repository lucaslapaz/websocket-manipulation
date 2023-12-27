// ==UserScript==
// @name         manipulacao-websocket
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       lucaslapaz
// @match        https://xkekos.tv/bigclient
// @icon         https://www.google.com/s2/favicons?sz=64&domain=habblet.city
// @grant        none
// ==/UserScript==


/**
 * Class that allows reading and interpreting packets. Each developer implements their own packet structure, so it will likely be necessary to modify the class to meet specific needs.
 * 
 */

class BinaryReader {
    constructor(binary) {
        this.binary = binary;
        this.view = new DataView(binary);
        this.offset = 0;
    }
    readInt() {
        const value = this.view.getInt32(this.offset);
        this.offset += 4;
        return value;
    }
    readShort() {
        const value = this.view.getInt16(this.offset);
        this.offset += 2;
        return value;
    }
    readBoolean() {
        return !!this.binary[this.offset++];
    }
    readString(length) {
        //const length = this.readShort();
        const str = new TextDecoder().decode(this.binary.slice(this.offset, this.offset + length));
        this.offset += length;
        return str;
    }
}

/**
 * Class that allows creating packets. Each developer implements their own packet structure, so it will likely be necessary to modify the class to meet specific needs.
 * 
 */

class BinaryWriter {
    constructor(header = null) {
        this.binary = [];
        this.offset = 0;
        // this.writeInt(0);
        // this.writeShort(header);
    }
    writeInt(value) {
        this.binary[this.offset++] = (value >> 24) & 0xFF;
        this.binary[this.offset++] = (value >> 16) & 0xFF;
        this.binary[this.offset++] = (value >> 8) & 0xFF;
        this.binary[this.offset++] = value & 0xFF;
        return this;
    }
    writeShort(value) {
        this.binary[this.offset++] = (value >> 8) & 0xFF;
        this.binary[this.offset++] = value & 0xFF;
        return this;
    }
    writeString(data) {
        // const data = new TextEncoder().encode(value);
        // this.writeShort(data.length);
        for (let i = 0; i < data.length; i++) {
            this.binary[this.offset + i] = data[i];
        }
        this.offset += data.length;
        return this;
    }
    compose() {
        // this.offset = 0;
        // this.writeInt(this.binary.length - 4);
        return new Uint8Array(this.binary).buffer;
    }
}


window.wss = []
const RECEIVE_BINARY_ARRAY = false;
const SEND_BINARY_ARRAY = false;
const ENDPOINT = "wss://xkekosws.atlantaserver.me:2096";
const USE_ENDPOINT = true;
const log = window.console.log;

if (WebSocket.prototype.constructor.name != "WS") {
    const ws = window.WebSocket;
    class WS extends ws {

        /**
         * Makes the WebSocket instance accessible through the window.wss object, allowing access to methods through the console if desired.
         */

        constructor(...args) {
            super(...args);

            this.binaryType = RECEIVE_BINARY_ARRAY ? "arraybuffer" : "blob";

            if (USE_ENDPOINT && ENDPOINT) {
                if (args[0] == ENDPOINT) {
                    window.wss = this;
                }
            } else {
                window.wss.push(this);
            }
            this.addEventListener("message", this.analyzeReceivedPackets);
            this.analyzeSentPackets();
        }

        addEventListener(name, cb) {
            super.addEventListener(name, cb);
        }

        /**
         * Receives an array of bytes in string format and returns an ArrayBuffer.
         * 
         * @param {string} stringArray - String to be converted to ArrayBuffer.
         * @returns {ArrayBuffer}
         * 
         * @example
         * const byteArray = this.hexStringToByteArray("00000017068e000f73646661736466617364666173646600000001")
         * console.log(byteArray) // Output: ArrayBuffer(27)
         */

        hexStringToByteArray(stringArray) {
            const byteArray = [];
            let hexString = stringArray.replace(/\s/g, '');
            for (let i = 0; i < hexString.length; i += 2) {
                byteArray.push(parseInt(hexString.substr(i, 2), 16));
            }
            return new Uint8Array(byteArray).buffer;
        }

        /**
         * Sends a packet to the server through the WebSocket instance.
         * 
         * @param {string | ArrayBuffer} message - Packet to be sent to the server, as if the client had sent it.
         * @returns {ArrayBuffer}
         * 
         * @example
         * 
         */

        sendPacket(message) {
            let byteArray = message;
            if (typeof message === 'string') {
                byteArray = this.hexStringToByteArray(message);
            }
            this.send.bind(this)(byteArray);
            return byteArray;
        }

        /**
         * Simulates the receipt of a packet by the server in the connection.
         * 
         * @param {string} message - Packet to be simulated, as if received from the server.
         * @returns {ArrayBuffer}
         */

        simulatePacket(message) {
            let byteArray = message;
            if (typeof message === 'string') {
                byteArray = this.hexStringToByteArray(message);
            }
            if (!SEND_BINARY_ARRAY) {
                byteArray = new Blob([byteArray])
            }
            const eventoSimulado = new MessageEvent("message", { data: byteArray })
            this.dispatchEvent(eventoSimulado);
            return byteArray;
        }

        /**
         *  Function modified to be called before the 'send' method is used, allowing interception of everything the WebSocket instance sends.
         *  @example 
         *  const sendCopy = this.send;
         *  this.send = function (data)
         *  {
         *  // your code here ...
         *  
         *  sendCopy.bind(this)(data);
         *  }
         */

        analyzeSentPackets() {
            // Usage example:
            // 00000011 068e 00096 f6c61206d756e646f00000001

            const sendCopy = this.send;
            this.send = function (data) {

                if(data.byteLength < 6) {
                    sendCopy.bind(this)(data);
                    return;
                };

                const reader = new BinaryReader(data);
                const packageLength = reader.readInt();
                const header = reader.readShort();

                if(header != 1678) {
                    sendCopy.bind(this)(data);
                    return
                };

                const messageLength = reader.readShort();
                const message = reader.readString(messageLength);
                log(`Sent message: ${message}`);
                
                sendCopy.bind(this)(data);
            }
        }

        /**
         * Listener added to the WebSocket instance, allowing analysis and interception of packets received on the connection.
         * 
         * @param {MessageEvent} event 
         */

        async analyzeReceivedPackets(event) {
            // Usage example:
            // 00000021 047a 00000003 0009 6f6c61206d756e646f00000000000000000000000000000000
            let data = null;

            if(event.data instanceof Blob){
                await event.data.arrayBuffer()
                .then((arrayBuffer) => {
                    data = arrayBuffer;
                })
                .catch((error) => {
                    log(`Error converting blob to ArrayBuffer: ${error}`)
                })
            }else if (event.data instanceof ArrayBuffer){
                data = event.data;
            }else{
                log("Data is neither Blob nor ArrayBuffer")
                return;
            }
            
            // Creates BinaryReader
            if(data.byteLength < 6) return;

            const reader = new BinaryReader(data);
            const packageLength = reader.readInt();
            const header = reader.readShort();

            if(header !== 1146) return;

            const user = reader.readInt();
            const messageLength = reader.readShort();
            const message = reader.readString(messageLength);

            if(message.toLowerCase() === 'hello'){
                //Creates new packet using BinaryWriter
                const writer = new BinaryWriter();
                writer.writeInt(0);
                writer.writeShort(1678);
                const msg = new TextEncoder().encode("How are you?");
                writer.writeShort(msg.length);
                writer.writeString(msg);
                writer.offset = 0;
                writer.writeInt(writer.binary.length - 4);
                const binary = writer.compose();
                this.sendPacket(binary);
            }
            
            log(`Received message: ${message}`);
        }
    }
    window.WebSocket = WS;
}


