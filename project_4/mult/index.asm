// -- Specification -- //
// Compute the result of R0 * R1 and store it in R2
// R2 = R0 * R1

// -- Initialize Variables -- //
@index
M=0

@result
M=0

(LOOP)
    // -- Check for index complete -- //
    @R1
    D=M
    @index
    D=D-M
    @END
    D;JLE

    // -- Add to result -- //
    @R0
    D=M
	@result
    D=D+M
    M=D

    // -- Increment index -- //
    @index
    D=M+1
    M=D

    @LOOP
    0;JMP

(END)
    // -- Store result in R2 -- //
    @result
    D=M
    @R2
    M=D