import * as fs from 'fs'
import path from 'path'
import * as readline from 'readline'

import Line from './line'
import symbolTable from './symbolTable'

async function deleteFile(filePath: string) {
	try {
		await fs.promises.unlink(filePath);
	}
	catch (error: unknown) {
		if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
			throw error;
		}
	}
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

	const allLines: Line[] = []
	const romLines: Line[] = []

	let romIndex = 0
	for await(const lineText of lineReader) {
		if (Line.shouldIgnoreLine(lineText)) {
			continue
		}

		const line = new Line(lineText)
		if (!line.isLabel()) {
			line.romIndex = romIndex
			romLines.push(line)
			romIndex += 1
		}

		allLines.push(line)
	}

	// Go backwards and copy prev lines rom index in case there are multiple labels back to back
	for (let i = allLines.length - 1; i >= 0; i--) {
		const line = allLines[i]
		
		if (line.isLabel()) {
			const prevLine = allLines[i + 1]
			symbolTable.addLabelEntry(line.labelToken!, prevLine.romIndex)
			line.romIndex = prevLine.romIndex
		}
	}

	const binaryOutput = []

	for (const line of romLines) {
		line.resolveSymbols(symbolTable)
		const binary = line.parse()
		binaryOutput.push(binary)
	}

	const fileName = path.parse(filePath).name
	const outputPath = `./out/${fileName}.hack`

	await deleteFile(outputPath)

	await fs.promises.writeFile(outputPath, binaryOutput.join('\n'))

}

main()