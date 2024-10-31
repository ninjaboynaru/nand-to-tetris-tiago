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

const symbolTable: Record<string, number> = {
	R0: 0,
	R1: 1,
	R2: 2,
	R3: 3,
	R4: 4,
	R5: 5,
	R6: 6,
	R7: 7,
	R8: 8,
	R9: 9,
	R10: 10,
	R11: 11,
	R12: 12,
	R13: 13,
	R14: 14,
	R15: 15,
	SP: 0,
	LCL: 1,
	ARG: 2,
	THIS: 3,
	THAT: 4,
	SCREEN: 16384,
	KBD: 24576
}

let nextSymbolLocation = 16

function shouldIgnoreLine(line: string): boolean {
	const isComment = line.trim().startsWith("//")
	const isEmpty = line.trim().length === 0

	return isComment || isEmpty
}

function intStringToBinary(value: string | number) {
	let num: number
	if (typeof value === 'string') {
		num = parseInt(value, 10);
	}
	
	return num.toString(2).padStart(15, '0');
}

function isValidNumber(value: string) {
	return /^-?\d*\.?\d+$/.test(value);
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

function parseLine(line: Line): string {
	let parsedLine: string

	if (line.type === InstructionType.ADDRESS) {
		parsedLine = `0${intStringToBinary(line.tokens[0])}`
	}
	else if (line.type === InstructionType.COMPUTATION) {
		const destinationBinary = destinationTable[line.tokens[0]]
		const computeBinary = computeTable[line.tokens[1]]
		
		parsedLine = `111${computeBinary}${destinationBinary}000`
	}

	return parsedLine
}

function processSymbols(line: Line, lineNumber) {
	if (line.type === InstructionType.ADDRESS) {
		const value = line.tokens[0]

		if (!isValidNumber(value)) {
			const symbolValue = symbolTable[value]
			if (symbolValue === undefined) {
				symbolTable[symbolValue] = nextSymbolLocation
				nextSymbolLocation += 1
			}
			else {
				line.tokens[0] = symbolValue.toString()
			}
		}
	}
}

async function processFile(filePath, callback) {
	const readStream = fs.createReadStream(filePath);
	const lineReader = readline.createInterface({
		input: readStream,
		crlfDelay: Infinity
	});

	let lineNumber = 0

	for await (const lineText of lineReader) {
		if(shouldIgnoreLine(lineText)) {
			continue
		}
		
		await callback(lineText, lineNumber);
		lineNumber += 1
	}
}

async function main() {
	const filePath = process.argv[2]

	if (!filePath) {
		throw new Error('No file path argument provided');
	}

	const fileName = path.parse(filePath).name
	const outputPath = `./out/${fileName}.hack`
	const writeStream = fs.createWriteStream(outputPath)

	await processFile(filePath, (lineText, lineNumber) => {
		const line = tokenizeLine(lineText)
		checkSymbolTable(line, lineNumber)
	})

	await processFile(filePath, (lineText) => {
		const line = tokenizeLine(lineText)
		const binary = parseLine(line)

		writeStream.write(binary + '\n');
	})

	writeStream.end()
}

main()