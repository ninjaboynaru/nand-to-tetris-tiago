import * as fs from 'fs'
import path from 'path'
import * as readline from 'readline'

import { computeTable, destinationTable } from './instructionTables'

enum InstructionType {
	ADDRESS,
	COMPUTATION,
	JUMP
}

type Line = {
	tokens: string[]
	type: InstructionType
}

function shouldIgnoreLine(line: string): boolean {
	const isComment = line.trim().startsWith("//")
	const isEmpty = line.trim().length === 0

	return isComment || isEmpty
}

function intStringToBinary(value: string) {
	const num = parseInt(value, 10);
	return num.toString(2).padStart(15, '0');
}

function tokenizeLine(lineText: string): Line {
	const line: Line = {
		tokens: [],
		type: null
	}

	const addressLexemeIndex = lineText.indexOf('@')
	const equalLexemeIndex = lineText.indexOf('=')
	const semicolonLexemeIndex = lineText.indexOf(';')

	if (addressLexemeIndex !== -1) {
		line.tokens.push(lineText.substring(addressLexemeIndex + 1))
		console.log('---: ', line.tokens)
		line.type = InstructionType.ADDRESS
	}
	else if (equalLexemeIndex !== -1) {
		const destinationToken = lineText.substring(0, equalLexemeIndex)
		const computationToken = lineText.substring(equalLexemeIndex+1)
		line.tokens.push(destinationToken, computationToken)
		line.type = InstructionType.COMPUTATION
	}
	else if (semicolonLexemeIndex) {
		const valueToken = lineText.substring(0, semicolonLexemeIndex)
		const jumpToken = lineText.substring(semicolonLexemeIndex)
		line.tokens.push(valueToken, jumpToken)
		line.type = InstructionType.JUMP
	}

	return line
}

async function main() {
	const filePath = process.argv[2]

	if (!filePath) {
		throw new Error('No file path argument provided');
	}

	const readStream = fs.createReadStream(filePath);
	const lineReader = readline.createInterface({
		input: readStream,
		crlfDelay: Infinity
	})

	const fileName = path.parse(filePath).name
	const outputPath = `./out/${fileName}.hack`
	const writeStream = fs.createWriteStream(outputPath)

	for await (const lineText of lineReader) {
		if(shouldIgnoreLine(lineText)) {
			continue
		}

		const line = tokenizeLine(lineText)
		
		let hackBinaryLine: string

		if (line.type === InstructionType.ADDRESS) {
			hackBinaryLine = `0${intStringToBinary(line.tokens[0])}`
		}
		else if (line.type === InstructionType.COMPUTATION) {
			const destinationBinary = destinationTable[line.tokens[0]]
			const computeBinary = computeTable[line.tokens[1]]
			
			hackBinaryLine = `111${computeBinary}${destinationBinary}000`
		}

		writeStream.write(hackBinaryLine + '\n');
	}

	
	writeStream.end()
}

main()