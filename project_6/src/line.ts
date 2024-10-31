import type SymbolTable from "./symbolTable";
import { computeTable, destinationTable, jumpTable } from './instructionTables'

enum LineType {
	UNDEF,
	ADDRESS,
	COMPUTATION,
	JUMP,
	LABEL
}

function isValidNumber(value: string) {
	return /^-?\d*\.?\d+$/.test(value);
}

function intToBinary(value: string | number):string {
	let num: number

	if (typeof value === 'string') {
		num = parseInt(value, 10);
	}
	else {
		num = value
	}
	
	return num.toString(2).padStart(15, '0');
}

export default class Line {
	lineText: string
	romIndex: number = 0
	type: LineType = LineType.UNDEF
	hasSymbol: boolean = false
	
	addressToken: string | undefined
	destinationToken: string | undefined
	computationToken: string | undefined
	jumpToken: string | undefined
	labelToken: string | undefined
	
	static shouldIgnoreLine(lineText: string): boolean {
		const isComment = lineText.trim().startsWith("//")
		const isEmpty = lineText.trim().length === 0
	
		return isComment || isEmpty
	}

	constructor(lineText: string) {
		this.lineText = lineText.trim()
		this.tokenize(this.lineText)

	}

	private tokenize(lineText: string) {
		const addressLexemeIndex = lineText.indexOf('@')
		const equalLexemeIndex = lineText.indexOf('=')
		const semicolonLexemeIndex = lineText.indexOf(';')
		const openParenLexemeIndex = lineText.indexOf('(')
		const closeParenLexemeIndex = lineText.indexOf(')')
	
		if (addressLexemeIndex !== -1) {
			this.type = LineType.ADDRESS
			this.addressToken = lineText.substring(addressLexemeIndex + 1)
			
			if (!isValidNumber(this.addressToken)) {
				this.hasSymbol = true
			}
		}
		else if (equalLexemeIndex !== -1) {
			this.type = LineType.COMPUTATION

			this.destinationToken = lineText.substring(0, equalLexemeIndex)
			this.computationToken = lineText.substring(equalLexemeIndex+1)
		}
		else if (semicolonLexemeIndex !== -1) {
			this.type = LineType.JUMP
			this.computationToken = lineText.substring(0, semicolonLexemeIndex)
			this.jumpToken = lineText.substring(semicolonLexemeIndex+1)
		}
		else if (openParenLexemeIndex !== -1) {
			this.type = LineType.LABEL
			this.labelToken = lineText.substring(openParenLexemeIndex + 1, closeParenLexemeIndex)
		}
	}

	isLabel(): boolean {
		return this.type === LineType.LABEL
	}

	resolveSymbols(symbolTable: typeof SymbolTable) {
		if (!this.hasSymbol) {
			return
		}

		const symbol = this.addressToken!
		let symbolRamLocation = symbolTable.getEntry(symbol)

		if (symbolRamLocation === undefined) {
			symbolRamLocation = symbolTable.addRamEntry(symbol)
		}

		this.addressToken = symbolRamLocation.toString()
	}

	parse(): string {
		let binary: string = ''

		if (this.type === LineType.ADDRESS) {
			binary = `0${intToBinary(this.addressToken!)}`
		}
		else if (this.type === LineType.COMPUTATION) {
			const destinationBinary = destinationTable[this.destinationToken!]
			const computeBinary = computeTable[this.computationToken!]
			
			binary = `111${computeBinary}${destinationBinary}000`
		}
		else if (this.type === LineType.JUMP) {
			const computeBinary = computeTable[this.computationToken!]
			const jumpBinary = jumpTable[this.jumpToken!]

			binary = `111${computeBinary}000${jumpBinary}`			
		}


		return binary
	}
}
