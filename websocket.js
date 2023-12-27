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
const ENDPOINT = "wss://endpoint:2096";
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
                if (args[0] == ENDPOINT) window.wss = this
            } else {
                window.wss.push(this);
            }
            this.addEventListener("message", analyzeReceivedPackets);
            analyzeSentPackets(this);
        }

        addEventListener(name, cb) {
            super.addEventListener(name, cb);
        }

        dispatchEvent(name) {
            super.dispatchEvent(name);
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
         * @param {string | ArrayBuffer} packet - Packet to be sent to the server, as if the client had sent it.
         * @returns {ArrayBuffer}
         */

        sendPacket(packet) {
            let byteArray = packet;
            if (typeof packet === 'string') {
                byteArray = this.hexStringToByteArray(packet);
            }
            this.send.bind(this)(byteArray);
            return byteArray;
        }

        /**
         * Simulates the receipt of a packet by the server in the connection.
         * 
         * @param {string} packet - Packet to be simulated, as if received from the server.
         * @returns {ArrayBuffer}
         */

        simulatePacket(packet) {
            let byteArray = packet;
            if (typeof packet === 'string') {
                byteArray = this.hexStringToByteArray(packet);
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
            const sendCopy = this.send;
            this.send = function (data) {
                // Your code here
                sendCopy.bind(this)(data);
            }
        }

        /**
         * Listener added to the WebSocket instance, allowing analysis and interception of packets received on the connection.
         * 
         * @param {MessageEvent} event 
         */
        
        async analyzeReceivedPackets(event) {
            let data = event.data;
            // Your code here
        }
    }
    window.WebSocket = WS;
}


