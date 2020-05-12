const getNumber = (n) => {
	if (n) {
		if (n.slice(0, 2) === '0x') {
			return parseInt(n, 16)
		} else if (n.slice(0, 2) === '0b') {
			return parseInt(n, 2)
		} else {
			return parseInt(n, 10)
		}
	} else {
		return 0
	}
}

const assembleInstruction = function(line) {
	let words = line.split(` `)
	words[1] = getNumber(words[1])
	words[2] = getNumber(words[2])
	switch (words[0]) {
		case 'halt':
			return 0
			break
		case 'noop':
			return 0b0110000000000000
			break
		case 'setn':
		  return ( ( (0b1 << 4) | words[1] ) << 8 ) | words[2]
			break
		case 'loadr':
		  return ( ( ( (0b0100 << 4) | words[1] ) << 4 ) | words[2] ) << 4
			break
		case 'storer':
		  return ( ( ( ( (0b0100 << 4) | words[1] ) << 4 ) | words[2] ) << 4 ) | 1
			break
		case 'popr':
		  return ( ( ( ( (0b0100 << 4) | words[1] ) << 4 ) | words[2] ) << 4 ) | 2
			break
		case 'pushr':
		  return ( ( ( ( (0b0100 << 4) | words[1] ) << 4 ) | words[2] ) << 4 ) | 3
			break
		case 'setn':
		  return ( ( (0b0010 << 4) | words[1] ) << 8 ) | words[2]
			break
		case 'storen':
		  return ( ( (0b0011 << 4) | words[1] ) << 8 ) | words[2]
			break
		case 'addn':
		  return ( ( (0b0101 << 4) | words[1] ) << 8 ) | words[2]
			break
		case 'copy':
		  return ( ( ( (0b0110 << 4) | words[1] ) << 4 ) | words[2] ) << 4
			break
		case 'add':
		  return ( ( ( ( (0b0110 << 4) | words[1] ) << 4 ) | words[2] ) << 4 ) | words[3]
			break
		case 'sub':
		  return ( ( ( ( (0b0111 << 4) | words[1] ) << 4 ) | words[2] ) << 4 ) | words[3]
			break
		case 'mul':
		  return ( ( ( ( (0b1000 << 4) | words[1] ) << 4 ) | words[2] ) << 4 ) | words[3]
			break
		case 'div':
		  return ( ( ( ( (0b1001 << 4) | words[1] ) << 4 ) | words[2] ) << 4 ) | words[3]
			break
		case 'mod':
		  return ( ( ( ( (0b1010 << 4) | words[1] ) << 4 ) | words[2] ) << 4 ) | words[3]
			break
		case 'jump':
		  return ( ( (0b0 << 4) | words[1] ) << 8 ) | 0b11
			break
		case 'jumpn':
		  return (0b1011 << 12) | words[1]
			break
		case 'jeqz':
		  return ( ( (0b1100 << 4) | words[1] ) << 8 ) | words[2]
			break
		case 'jnez':
		  return ( ( (0b1101 << 4) | words[1] ) << 8 ) | words[2]
			break
		case 'jgtz':
		  return ( ( (0b1110 << 4) | words[1] ) << 8 ) | words[2]
			break
		case 'jltz':
		  return ( ( (0b1111 << 4) | words[1] ) << 8 ) | words[2]
			break
		case 'call':
		  return ( ( (0b1011 << 4) | words[1] ) << 8 ) | words[2]
			break
		default:
		return 0
	}
}

module.exports = assembleInstruction
