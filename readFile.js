import fs from 'fs';
import csv from 'csv-parser';
import { Writable, Transform } from 'stream';
import AWS from 'aws-sdk';
import config from './config.js';

// Confgigura o acesso ao Dynamo
AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region
});

const docClient = new AWS.DynamoDB.DocumentClient();

// Define constantes
const TABLE_NAME = '';
const ITENS_POR_PAGINA = 25;

// Variáveis de controle
var paginaAtual = 0;
var countItensPorPagina = 0;
var totalItens = 0;
var batchItens = [];

// Realiza a leitura do arquivo com node streamming
const readableStreamFile = fs.createReadStream('file.csv')
const transformToObject = csv({ separator: ';' })
// Transforma o retorno chunk para string
const transformToString = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    callback(null, JSON.stringify(chunk))
  },
})
// Obtém os dados como objeto para a escrita na base
const writableStreamFile = new Writable({
  async write(chunk, encoding, next) {

    const stringifyer = chunk.toString()
    const rowData = JSON.parse(stringifyer)
    // console.log(rowData)

    totalItens++;
    countItensPorPagina++;
    // Armazena no array temporário
    batchItens.push({
      PutRequest: {
        Item: {
          "customerId": rowData.customerId.toString(),
          "DiscountMechanics": rowData.DiscountMechanics.toString(),
        }
      }
    });
    // Verifica a condição da paginação
    if (countItensPorPagina === ITENS_POR_PAGINA) {

      try {
        // Monta os parâmetros de inserção em batch no Dynaom
        var params = {
          RequestItems: {
            [TABLE_NAME]: batchItens
          }
        };

        // console.log(params)
        // Incrementa variáveis de controle de paginação
        paginaAtual++;
        countItensPorPagina = 0;
        batchItens = [];
        // Envia para o Dynamo
        const res = await docClient.batchWrite(params).promise();
        console.log(`SUCESSO AO INSERIR NO DYNAMO - Página atual ${paginaAtual}`, res);
      } catch (err) {
        console.log(`ERRO AO INSERIR NO DYNAMO - Página atual ${paginaAtual}`, err);
      }
      
    }
    // Próxima linha
    next();
  },
})

// Cria a pipeline de execução
console.log('Iniciou', Date())
readableStreamFile
  .pipe(transformToObject)
  .pipe(transformToString)
  .pipe(writableStreamFile)
  .on('close', () => {
    console.log('Total de itens', totalItens)
    console.log('Finalizou', Date())
  })
