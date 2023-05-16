import fs from 'fs'

const filename = 'file.csv';

function generateCSVLine(index) {
  // Gere uma linha CSV com base no índice headers: customerId;DiscountMechanics
  // return `poc-${index};Nome ${index}`;
  return `poc-${index};{}`;
}

function writeCSVFile() {
  const stream = fs.createWriteStream(filename);

  stream.once('open', () => {
    for (let i = 1; i <= 100000; i++) {
      const line = generateCSVLine(i);
      stream.write(`${line}\n`);
    }

    stream.end();
    console.log(`Arquivo ${filename} criado com sucesso.`);
  });

  stream.on('error', (err) => {
    console.error(`Erro ao escrever o arquivo: ${err}`);
  });
}

writeCSVFile();
