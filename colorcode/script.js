// https://www.microsoft.com/en-us/research/publication/tilecode-creation-of-video-games-on-gaming-handhelds/

let cols = 9
let rows = 9
let res

// based on TIC80
let colors = [
  '#1e1e1e', '#2B33F', '#7E2072', '#19959C',
  '#8B4852', '#395C98', '#A9C1FF', '#EEEEEE',
  '#D4186C', '#D38441', '#E9C35B', '#70C6A9',
  '#7696DE', '#A3A3A3', '#FF9798', '#EDC7B0'
]

let tileMap = []
for (let y = 0; y < rows; y++) {
  tileMap[y] = []
  for (let x = 0; x < cols; x++) {
    tileMap[y][x] = 0
  }
}

// Build walls around pls
for (let i = 0; i < cols; i++) {
  tileMap[i][0] = 3
  tileMap[0][i] = 3
  tileMap[rows-1][i] = 3
  tileMap[i][cols-1] = 3
}

// tileMap[2][2] = 4
// tileMap[2][1] = 5
// tileMap[4][3] = 1

let emptyRule = [
  [ // when
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ],
  [ // do
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ],
]
let walkToRight = [
  [ // when
    [null, null, null],
    [2,    1,    0],
    [null, null, null]
  ],
  [ // do
    [null, null, null],
    [0,    2,    1],
    [null, null, null]
  ],
]

let rules = {
  'tick': [
    [
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    ]
  ],
  'up': [
    [
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    ]
  ],
  'down': [
    [
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    ]
  ],
  'left': [
    [
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    ]
  ],
  'right': [
    [
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    ]
  ],
  'a': [
    [
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    ]
  ],
  'b': [
    [
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    ]
  ],
}

let view = 'edit'
let selectedColor = 0
let currentRule = 0
let currentEvent = 'tick'

function setup() {
  try {
    // get rules from local localStorage
    let savedRules = localStorage.getItem('rules')
    if (savedRules) {
      rules = JSON.parse(savedRules)
    }
    let savedMap = localStorage.getItem('tileMap')
    if (savedMap) {
      tileMap = JSON.parse(savedMap)
    }
  } catch(e) {
    console.log('could not load rules from local storage')
    console.log(e)
  }
  createCanvas(min(windowHeight, 500), min(windowHeight, 500))
  res = width/cols
  background(colors[0])
  playButtton = document.querySelector('#play')
  playButtton.addEventListener('click', () => view = 'play')
  editButtton = document.querySelector('#edit')
  editButtton.addEventListener('click', () => view = 'edit')
  codeButtton = document.querySelector('#code')
  codeButtton.addEventListener('click', () => view = 'code')
  saveButtton = document.querySelector('#save')
  saveButtton.addEventListener('click', () => {
    localStorage.setItem('rules', JSON.stringify(rules))
    localStorage.setItem('tileMap', JSON.stringify(tileMap))
  })
  resetButton = document.querySelector('#reset')
  resetButton.addEventListener('click', () => {
    localStorage.setItem('rules', '')
    localStorage.setItem('tileMap', '')
  })

  colorSelector = document.querySelector('#color')
  colorSelector.addEventListener('change', (e) => {
    selectedColor = parseInt(e.target.value)
  })
  selectedColor = parseInt(colorSelector.value)

  eventSelector = document.querySelector('#event')
  eventSelector.addEventListener('change', (e) => {
    let permittedEvents = Object.keys(rules)
    let value = e.target.value
    if (permittedEvents.indexOf(value) === -1) return
    currentEvent = value
    if (currentEvent && !rules[currentEvent][currentRule]) {
      rules[currentEvent][currentRule] = [
        [
          [null, null, null],
          [null, null, null],
          [null, null, null]
        ],
        [
          [null, null, null],
          [null, null, null],
          [null, null, null]
        ]
      ]
    }
  })
  currentEvent = eventSelector.value

  ruleSelector = document.querySelector('#rule')
  ruleSelector.addEventListener('change', (e) => {
    let value = e.target.value
    let eventName = eventSelector.value
    if (value === '') return
    currentRule = parseInt(value)
    if (currentRule && (!rules[eventName] || !rules[eventName][currentRule])) {
      if (!rules[eventName]) rules[eventName] = []
      rules[eventName][currentRule] = [
        [
          [null, null, null],
          [null, null, null],
          [null, null, null]
        ],
        [
          [null, null, null],
          [null, null, null],
          [null, null, null]
        ]
      ]
    }
  })
  currentRule = parseInt(ruleSelector.value)
}

function draw() {
  switch(view) {
    case 'play':
      if (frameCount%24==0) {
        updateGame('tick')
      }
      drawGame()
      break
    case 'edit':
      drawGame()
      break
    case 'code':
      drawCode()
      break
    default:
      background(colors[0])
  }
}

function drawGame() {
  background(colors[0])
  noStroke()
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      let c = parseInt(tileMap[y][x])
      fill(colors[c])
      square(x*res, y*res, res)
    }
  }
}

function updateGame(eventName) {
  let newTileMap = copyArray(tileMap)
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      // For each cell, check neighborhood
      let cell = tileMap[y][x]
      for (let i = 0; i < rules[eventName].length; i++) {
        let rule = rules[eventName][i]
        let [when, then] = rule
        // Check if the center of 'when' matches current cell
        if (when[1][1] === cell) {
          let startX = x-1
          let endX = x+2
          let aroundCell = [
            tileMap[               max(y-1, 0)].slice(startX, endX),
            tileMap[                        y ].slice(startX, endX),
            tileMap[min(y+1, tileMap.length-1)].slice(startX, endX)
          ]
          let matched = matchRule(aroundCell, when)
          if (matched) {
            for (let ly = 0; ly < then.length; ly++) {
              for (let lx = 0; lx < then[ly].length; lx++) {
                if (then[ly][lx] !== null) {
                  newTileMap[y-1+ly][x-1+lx] = then[ly][lx]
                }
              }
            }
          }
        }
      }
    }
  }
  tileMap = newTileMap
}

function drawCode() {
  background(colors[0])
  noStroke()

  let rule = rules[currentEvent][currentRule]
  let [when, then] = rule

  for (let y = 0; y < when.length; y++) {
    for (let x = 0; x < when[y].length; x++) {
      if (when[y][x] !== null) {
        fill(colors[when[y][x]])
      } else {
        fill(0, 0, 0, 100)
      }
      square(x*res, 2*res+y*res, res)
    }
  }

  for (let y = 0; y < then.length; y++) {
    for (let x = 0; x < then[y].length; x++) {
      if (then[y][x] !== null) {
        fill(colors[then[y][x]])
      } else {
        fill(0, 0, 0, 100)
      }
      square(5*res+x*res, 2*res+y*res, res)
    }
  }
  stroke(colors[2])
  noFill()
  square(    0, 2*res, res*3)
  square(5*res, 2*res, res*3)
}

function copyArray(arr) {
  let n = []
  for(let y = 0; y < arr.length; y++) {
    n[y] = []
    for(let x = 0; x < arr[y].length; x++) {
      n[y][x] = arr[y][x]
    }
  }
  return n
}

function matchRule(around, when) {
  let matched = true
  for (let y = 0; y < when.length; y++) {
    for (let x = 0; x < when[y].length; x++) {
      if (when[y][x] !== null && when[y][x] !== around[y][x]) {
        matched = false
      }
    }
  }
  return matched
}

function mouseClicked() {
  if (mouseX > width || mouseX < 0 || mouseY > height || mouseY < 0) return
  let x = parseInt(mouseX/res)
  let y = parseInt(mouseY/res)

  if (view === 'edit') {
    if (x>=0 && x<cols && y>=0 && y<rows) {
      tileMap[y][x] = selectedColor<0?0:selectedColor
    }
  }
  if (view === 'code') {
    let rule = rules[currentEvent][currentRule]
    let [when, then] = rule
    if (x>=0 && x<3 && y>=2 && y<5) {
      when[y-2][x] = selectedColor<0?null:selectedColor
    }
    if (x>=4 && x<8 && y>=2 && y<5) {
      then[y-2][x-5] = selectedColor<0?null:selectedColor
    }
  }
}

function keyPressed() {
  if (view === 'play') {
    switch(key) {
      case 'ArrowRight':
        updateGame('right')
        break
      case 'ArrowLeft':
        updateGame('left')
        break
      case 'ArrowUp':
        updateGame('up')
        break
      case 'ArrowDown':
        updateGame('down')
        break
      case 'z':
        updateGame('a')
        break
      case 'x':
        updateGame('b')
        break
    }
  }
}
