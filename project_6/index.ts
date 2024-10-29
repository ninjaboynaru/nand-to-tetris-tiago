import * as fs from 'fs'
import path from 'path'
import * as readline from 'readline'

import { computeTable, destinationTable } from './instructionTables'

const hackBinary = []

function shouldIgnoreLine(line: string): boolean {
	const isComment = line.trim().startsWith("//")
	const isEmpty = line.trim().length === 0

	return isComment || isEmpty
}

function intStringToBinary(value: string) {
	const num = parseInt(value, 10);
	return num.toString(2).padStart(15, '0');
}

async function main() {
	const filePath = process.argv[2]

	if (!filePath) {
		throw new Error('No file path argument provided');
	}

	const fileStream = fs.createReadStream(filePath);
	const lineReader = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity
	})

	for await (const line of lineReader) {
		if(shouldIgnoreLine(line)) {
			continue
		}

		const firstChar = line[0]

		if (firstChar === '@') {
			const addressValue = line.slice(1)
			const addressValueBinary = intStringToBinary(addressValue)
			hackBinary.push(`0${addressValueBinary}`)
		}
		else {
			const equalSignIndex = line.indexOf('=')
			const destinationToken = line.slice(0, equalSignIndex)
			const computationToken = line.slice(equalSignIndex+1)

			const computeBinary = computeTable[computationToken]
			const destinationBinary = destinationTable[destinationToken]
			
			const hackBinaryValue = `111${computeBinary}${destinationBinary}000`
			hackBinary.push(hackBinaryValue)

		}
	}

	const fileName = path.parse(filePath).name
	await fs.promises.writeFile(`./out/${fileName}.hack`, hackBinary.join('\n'))
}

main()