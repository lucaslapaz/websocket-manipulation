Utilitário que permite a interceptação e manipulação de conexões WebSocket em site de terceiros. 

# O que é preciso?
Para usar é necessário instalar alguma extensão no seu navegador que permita executar código javascript em páginas de terceiros, como a extensão Tampermonkey.

# Como funciona?
O script altera a classe WebSocket, criando um intermediador e armazenando uma referência a ele no objeto window.wss. Quando o site criar uma nova conexão usando WebSocket, ele vai usar a classe alterada e vai criar o intermediador que vai estar acessível via código ou via console, através do objeto global window.wss.

# Configurações:
Há 4 variáveis usadas para configurar a execução do script. Elas já estão declaradas e é necessário apenas mudar o valor, sendo elas:

## RECEIVE_BINARY_ARRAY
Define o tipo de dado recebido pelo servidor. Ao definir como 'true' irá receber um ArrayBuffer, se definido como false, recebe um Blob.

## SEND_BINARY_ARRAY
Define o tipo de dado a ser enviado para o servidor. 'true' envia um objeto ArrayBuffer e 'false' envia um objeto Blob

## ENDPOINT + USE_ENDPOINT
Se o ENDPOINT estiver definido e o USE_ENDPOINT for verdadeiro, será armazenado no objeto 'window.wss' a conexão que usar o ENDPOINT especificado. 

`
console.log(window.wss) // > WS
`
Caso o ENDPOINT não for definido ou o USE_ENDPOINT não for verdadeiro, será criado um array no objeto 'window.wss' com todas as conexões criadas na página.

`
console.log(window.wss) // > Array(2)
`
# Métodos: 

## hexStringToByteArray (hexstring)
Recebe uma Hex String como parâmetro e retorna um ArrayBuffer

`
const byteArray = window.wss.hexStringToByteArray("00000017068e000f73646661736466617364666173646600000001")
console.log(byteArray) // Output: ArrayBuffer(27)
`

## sendPacket(packet)
Permite enviar um pacote para a conexão como se o próprio cliente tivesse enviado. Aceita string ou ArrayBuffer como parâmetro.

`
const byteArray = window.wss.hexStringToByteArray("00000017068e000f73646661736466617364666173646600000001")
window.wss.sendPacket(byteArray);
`

## simulatePacket(packet)
Simula a recepção de pacotes, como se o cliente tivesse recebido o pacote diretamente do servidor. Aceita string ou ArrayBuffer como parâmetro.

`
const byteArray = window.wss.hexStringToByteArray("00000017068e000f73646661736466617364666173646600000001")
window.wss.simulatePacket(byteArray);
`

## analyzeSentPackets()
Método usado para alterar a função padrão 'send', permitindo interceptar o que vai ser enviado. Isso permite analisar, modificar e decidir se o pacote deve ser enviado ou não. Para utilizá-lo é necessário alterar o código, adicionando o seu mas mantendo a estrutura a seguir:

`
analyzeSentPackets() {
    const sendCopy = this.send;
    this.send = function (data) {
        // Your code here
        sendCopy.bind(this)(data);
    }
}
`

## analyzeReceivedPackets(event)
Ouvinte que recebe todas os pacotes que foram enviados pelo servidor, sendo acessível através de 'event.data'. Para utilizá-lo é necessário alterar o código, adicionando o seu mas mantendo a estrutura a seguir:

`
async analyzeReceivedPackets(event) {
    let data = event.data;
    // Your code here
}
`
# Classes BinaryWriter e BinaryReader
Classes genéricas para leitura e escrita de ArrayBuffer. A implementação da estruta do pacote varia de programador pra programador, sendo necessário modificar a classe pra atender sua necessidade ou usar outro meio de manipular os pacotes