
int screenFill = 0

CHECK_KEY {
	if (key === 0) {
		screenFill = 0
	}

	screenFill = 1

	goto SET_SCREEN
}

FILL_SCREEN {
	int index = screen
	int maxIndex = screen.endIndex()

	while (index < maxIndex) {
		screen[index] = screenFill
	}	
	
	index = screen
	goto CHECK_KEY
}