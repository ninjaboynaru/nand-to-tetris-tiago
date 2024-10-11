// -- Specification -- //
// When a key is pressed, the screen should be blackened //
// Otherwise, the screen should be cleared //

@fillValue
M=0

// -- Set the screenSize variable -- //
@8192
D=A
@screenSize
M=D

// -- Calculate the last register of the screen in RAM -- //
@screenSize
D=M
@SCREEN
D=D+A
@screenEnd
M=D

(CHECK_KEY)
	@KBD
	D=M
	
	@ON_KEY_EMPTY
	D;JEQ

	@ON_KEY_PRESSED
	D;JNE

	(ON_KEY_EMPTY)
		@fillValue
		M=0
		@FILL_SCREEN
		0;JMP

	(ON_KEY_PRESSED)
		@fillValue
		M=-1
	

(FILL_SCREEN)
	@index
	M=0

	(FILL_SCREEN_LOOP)
		// -- Check for end of loop //
		@screenEnd
		D=M
		@index
		D=D-M
		
		@FILL_SCREEN_END
		D;JLE

		// -- Calculate the current screen register to set -- //
		@SCREEN
		D=A
		@index
		D=D+M
		@currentRegister
		M=D

		// -- Set the screen register to fill or clear -- //
		@fillValue
		D=M
		@currentRegister
		A=M
		M=D

		// -- Increment i and loop -- // 
		@index
		M=M+1
		@FILL_SCREEN_LOOP
		0;JMP

	(FILL_SCREEN_END)
		@CHECK_KEY
		0;JMP