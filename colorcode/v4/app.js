const elements = {}
const sys_color = [30, 50, '#123', '#aaa']
const colors = [
  '#000000', '#2b335f', '#7e2072', '#19959c',
  '#8b4852', '#395c98', '#a9c1ff', '#eeeeee',
  '#d4186c', '#d38441', '#e9c35b', '#70c6a9',
  '#7696de', '#a3a3a3', '#ff9798', '#edc7b0',
]
const eventNames = ['tick', 'up', 'right', 'down', 'left', 'a', 'b', 'hack']
let speed = 15
let res, canvas, inputs=[], outputs=[]

const NUMBER_OF_INPUTS = 1
const NUMBER_OF_OUTPUTS = 1

let state = {
  tileMap: [],
  rules: [],
  cursor: [3, 5],
  selectedColor: 2,
  selectedRule: 0,
  selectedEvent: 0,
  view: 'edit',
  columns: 16,
  rows: 16
}
let pilot = {
  step: 0,
  steps: null
}

for (let y = 0; y < state.rows; y++) {
  state.tileMap[y] = []
  for (let x = 0; x < state.columns; x++) {
    state.tileMap[y][x] = 0
  }
}
// Draw walls
for (let y = 0; y < state.rows; y++) {
  state.tileMap[y][0] = 1
  state.tileMap[y][state.columns-1] = 1
}
for (let x = 0; x < state.columns; x++) {
  state.tileMap[0][x] = 1
  state.tileMap[state.rows-1][x] = 1
}
for (let events = 0; events < eventNames.length; events++) {
  state.rules[events] = []
  for (let rules = 0; rules < 16; rules++) {
    let when = []
    let then = []
    for (let i = 0; i < 3; i++) {
      when[i] = []
      then[i] = []
      for (let j = 0; j < 3; j++) {
        when[i][j] = null
        then[i][j] = null
      }
    }
    state.rules[events][rules] = [when, then]
  }
}

function drippingSync() {
  setTimeout(function() {
    console.log('ping')
    if (inputs[0]) {
      inputs[0].value(15)
      setTimeout(function() {
        inputs[0].value(0)
      }, random(100, 190))
    }
    drippingSync()
  }, random(200, 1500))
}

function setup() {
  elements.screen = document.querySelector('#screen')
  elements.controls = document.querySelector('#controls')
  elements.buttonUp = document.querySelector('#button-up')
  elements.buttonRight = document.querySelector('#button-right')
  elements.buttonDown = document.querySelector('#button-down')
  elements.buttonLeft = document.querySelector('#button-left')
  elements.buttonA = document.querySelector('#button-a')
  elements.buttonB = document.querySelector('#button-b')
  elements.buttonC = document.querySelector('#button-c')

  elements.buttonUp.addEventListener('click', () => {
    keyPressed('ArrowUp')
    setTimeout(() => keyReleased())
  })
  elements.buttonRight.addEventListener('click', () => {
    keyPressed('ArrowRight')
    setTimeout(() => keyReleased())
  })
  elements.buttonDown.addEventListener('click', () => {
    keyPressed('ArrowDown')
    setTimeout(() => keyReleased())
  })
  elements.buttonLeft.addEventListener('click', () => {
    keyPressed('ArrowLeft')
    setTimeout(() => keyReleased())
  })
  elements.buttonA.addEventListener('click', () => {
    keyPressed('z')
    setTimeout(() => keyReleased())
  })
  elements.buttonB.addEventListener('click', () => {
    keyPressed('x')
    setTimeout(() => keyReleased())
  })
  elements.buttonC.addEventListener('click', () => {
    keyPressed('c')
    setTimeout(() => keyReleased())
  })

  let saveSlots = document.querySelectorAll('#save .slot')
  for (let i = 0; i < saveSlots.length; i++) {
    let slot = saveSlots[i]
    slot.addEventListener('click', () => {
      localStorage.setItem(`slot${i}`, JSON.stringify(state))
      console.log('save slot', i)
    })
  }

  let loadSlots = document.querySelectorAll('#load .slot')
  for (let i = 0; i < loadSlots.length; i++) {
    let slot = loadSlots[i]
    slot.addEventListener('click', () => {
      let stateSnapshot = JSON.parse(localStorage.getItem(`slot${i}`))
      if (stateSnapshot) {
        state = stateSnapshot
      } else if (stories[i]) {
        state = stories[i]
      }
    })
  }

  canvas = createCanvas(windowWidth/4, windowWidth/4)
  canvas.parent(elements.screen)
  angleMode(DEGREES)
  res = parseInt(canvas.width/state.columns)
  background(colors[0])
  noSmooth()

  let outputsEl = document.querySelector('#outputs')
  state.tileMap[2][15] = 0
  for (let i = 0; i < NUMBER_OF_OUTPUTS; i++) {
    outputs.push(
      createSlider(0, 15, state.tileMap[i][15])
    )
    outputs[i].parent(outputsEl)
  }
  let inputsEl = document.querySelector('#inputs')
  for (let i = 0; i < NUMBER_OF_INPUTS; i++) {
    inputs.push(
      createSlider(0, 15, 0)
    )
    inputs[i].parent(inputsEl)
  }

  drippingSync()
}

function draw() {
  res = parseInt(width/state.columns)
  state = update(state)
  render(state)
  for (let i = 0; i < NUMBER_OF_OUTPUTS; i++) {
    outputs[i].value(state.tileMap[i+2][15])
  }
  for (let i = 0; i < NUMBER_OF_INPUTS; i++) {
    state.tileMap[i+2][0] = inputs[i].value()
  }
}

function render(state) {
  switch (state.view) {
    case 'play':
      renderPlay(state)
      break;
    case 'edit':
      renderEdit(state)
      break;
    case 'code':
      renderCode(state)
      break;
    default:
  }
}

function renderPlay(state) {
  let { tileMap } = state
  for (let y = 0; y < tileMap.length; y++) {
    for (let x = 0; x < tileMap[y].length; x++) {
      let value = tileMap[y][x]
      let color = colors[0]
      if (value !== null && value !== '') {
        value = parseInt(value)
        color = colors[value]
      }
      fill(color)
      stroke(color)
      square(x*res, y*res, res)
    }
  }
}

function renderEdit(state) {
  renderPlay(state)
  drawCursor(state)
}

function renderCode(state) {
  push()
  scale(2)
  let {
    rows, columns,
    rules, selectedEvent, selectedRule
  } = state
  columns = parseInt(columns/2)
  rows = parseInt(rows/2)
  let rule = rules[selectedEvent][selectedRule]
  let [ when, then ] = rule
  // first row is for the events
  for (let x = 0; x < columns; x++) {
    if (selectedEvent === x) {
      fill(colors[3])
      stroke(colors[3])
    } else {
      fill(colors[4])
      stroke(colors[4])
    }
    square(x*res, 0, res)
  }
  // the next two lines are for rule slots
  for (let x = 0; x < columns*2; x++) {
    if (selectedRule === x) {
      fill(colors[5])
      stroke(colors[5])
    } else {
      fill(colors[6])
      stroke(colors[6])
    }
    square((x%columns)*res, (1+parseInt(x/columns))*res, res)
  }
  // the next line is for the available colors
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < columns; x++) {
      let i = columns*y + x
      fill(colors[i])
      stroke(colors[i])
      square(x*res, (3+y)*res, res)
    }
  }
  // breathe line
  fill(sys_color[1])
  stroke(sys_color[1])
  for (let y = 5; y < rows; y++) {
    square(3*res, y*res, res)
    square(4*res, y*res, res)
  }
  // when
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      let value = when[y][x]
      let color = parseInt(when[y][x])
      if (value === null || value === '') {
        fill(sys_color[0])
        stroke(sys_color[0])
      } else {
        fill(colors[color])
        stroke(colors[color])
      }

      square(x*res, (5+y)*res, res)
    }
  }
  // then
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      let value = then[y][x]
      let color = parseInt(then[y][x])
      if (value === null || value === '') {
        fill(sys_color[0])
        stroke(sys_color[0])
      } else {
        fill(colors[color])
        stroke(colors[color])
      }
      square((5+x)*res, (5+y)*res, res)
    }
  }
  drawCursor(state)
  pop()
}

function drawCursor(state) {
  let { cursor, selectedColor } = state
  let [ x, y ] = cursor
  let c = color(colors[selectedColor])
  c.setAlpha(map(sin(frameCount*5), -1, 1, 175, 255))
  if (selectedColor === 0) {
    fill(100)
    stroke(100)
  } else {
    fill(sys_color[0])
    stroke(sys_color[0])
  }
  square(x*res, y*res, res)
  fill(c)
  stroke(c)
  square(x*res, y*res, res)
}

function update(state) {
  // if (state.view === 'play' && frameCount % 10 == 0) state = applyRules(state, 'tick')
  if (state.view === 'play' && frameCount % 5 == 0) state = applyRules(state, 'tick')
  return state
}

// EVENT HANDLERS

function keyPressed(e) {
  if (typeof e === 'string') {
    key = e
  }
  // else {
  //   e.preventDefault()
  // }
  // playSynth(key)
  highlightControls(key)
  switch (state.view) {
    case 'play':
      state = handleEventPlay(state, key)
      break;
    case 'edit':
      state = handleEventEdit(state, key)
      break;
    case 'code':
      state = handleEventCode(state, key)
      break;
    default:
  }
}

function keyReleased(e) {
  elements.buttonUp.style.background = sys_color[2]
  elements.buttonRight.style.background = sys_color[2]
  elements.buttonDown.style.background = sys_color[2]
  elements.buttonLeft.style.background = sys_color[2]
  elements.buttonA.style.background = sys_color[2]
  elements.buttonB.style.background = sys_color[2]
  elements.buttonC.style.background = sys_color[2]

  if (window.location.hash === '#record') {
    if (pilot.steps === null) pilot.steps = []
    pilot.steps.push(key)
  }
}

function highlightControls(key) {
  switch (key) {
    case 'ArrowUp':
      elements.buttonUp.style.background = sys_color[3]
      break;
    case 'ArrowRight':
      elements.buttonRight.style.background = sys_color[3]
      break;
    case 'ArrowDown':
      elements.buttonDown.style.background = sys_color[3]
      break;
    case 'ArrowLeft':
      elements.buttonLeft.style.background = sys_color[3]
      break;
    case 'ArrowLeft':
      elements.buttonLeft.style.background = sys_color[3]
      break;
    case 'z':
      elements.buttonA.style.background = sys_color[3]
      break;
    case 'x':
      elements.buttonB.style.background = sys_color[3]
      break;
    case 'c':
      elements.buttonC.style.background = sys_color[3]
      break;
    default:

  }
}

function handleEventPlay(state, key) {
  switch (key) {
    case 'ArrowUp':
      state = applyRules(state, 'up')
      break;
    case 'ArrowRight':
      state = applyRules(state, 'right')
      break;
    case 'ArrowDown':
      state = applyRules(state, 'down')
      break;
    case 'ArrowLeft':
      state = applyRules(state, 'left')
      break;
    case 'z':
      state = applyRules(state, 'a')
      break;
    case 'x':
      state = applyRules(state, 'b')
      break;
    case 'c':
      state = togglePlayView(state)
      break;
    default:

  }
  return state
}

function handleEventEdit(state, key) {
  switch (key) {
    case 'ArrowUp':
      state = moveCursor(state, 'up')
      break;
    case 'ArrowRight':
      state = moveCursor(state, 'right')
      break;
    case 'ArrowDown':
      state = moveCursor(state, 'down')
      break;
    case 'ArrowLeft':
      state = moveCursor(state, 'left')
      break;
    case 'z':
      state = setTileMapColor(state)
      break;
    case 'x':
      state = eraseTileMapColor(state)
      break;
    case 'c':
      state = togglePlayView(state)
      break;
    default:

  }
  return state
}

function handleEventCode(state, key) {
  let { cursor, columns, rows } = state
  let [ x, y ] = cursor
  switch (key) {
    case 'ArrowUp':
      state = moveCursor(state, 'up')
      break;
    case 'ArrowRight':
      state = moveCursor(state, 'right')
      break;
    case 'ArrowDown':
      state = moveCursor(state, 'down')
      break;
    case 'ArrowLeft':
      state = moveCursor(state, 'left')
      break;
    case 'z':
      if (y == 0) state = selectEvent(state, x)
      else if (y > 0 && y < 3) state = selectRule(state, x + (y-1)*columns/2)
      else if (y >= 3 && y <= 4) state = selectColor(state, x+((y-3)*columns/2))
      else if (y > 4) state = setRuleColor(state, x, y)
      break;
    case 'x':
      if (y > 3) state = eraseRuleColor(state, x, y)
      break;
    case 'c':
      state = togglePlayView(state)
      break;
    default:

  }
  return state
}

function applyRules(state, eventName) {
  let { tileMap, rules, rows, columns } = state
  let index = eventNames.indexOf(eventName)
  let eventRules = rules[index]
  let stepTiles = copyArray(tileMap)
  for (let y = 1; y < rows-1; y++) {
    for (let x = 1; x < columns-1; x++) {
      // For each cell, check neighborhood
      let cell = tileMap[y][x]
      for (let i = 0; i < eventRules.length; i++) {
        let rule = eventRules[i]
        let [when, then] = rule
        // Check if the center of 'when' matches current cell
        if (when[1][1] === cell) {
          let startX = x-1
          let endX = x+2
          let aroundCell = [
            tileMap[               max(y-1, 0)].slice(startX, endX),
            tileMap[                        y ].slice(startX, endX),
            tileMap[min(y+1, tileMap.length)].slice(startX, endX)
          ]
          let matched = matchRule(aroundCell, when)
          if (matched) {
            for (let ly = 0; ly < then.length; ly++) {
              for (let lx = 0; lx < then[ly].length; lx++) {
                if (then[ly][lx] !== null) {
                  stepTiles[y-1+ly][x-1+lx] = then[ly][lx]
                }
              }
            }
          }
        }
      }
    }
  }
  state.tileMap = stepTiles
  return state
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

function moveCursor(state, eventName) {
  let { rows, columns } = state
  if (state.view === 'code') {
    rows /= 2
    columns /= 2
  }
  switch (eventName) {
    case 'up':
      if (state.cursor[1] === 0) state = toggleEditView(state)
      state.cursor[0] = (state.cursor[0]) % columns
      state.cursor[1] = (rows + state.cursor[1] - 1) % rows
      break;
    case 'right':
      if (state.cursor[0] === columns-1) state = toggleEditView(state)
      state.cursor[0] = (state.cursor[0] + 1) % columns
      state.cursor[1] = (state.cursor[1]) % rows
      break;
    case 'down':
      if (state.cursor[1] === rows-1) state = toggleEditView(state)
      state.cursor[0] = (state.cursor[0]) % columns
      state.cursor[1] = (state.cursor[1] + 1) % rows
      break;
    case 'left':
      if (state.cursor[0] === 0) state = toggleEditView(state)
      state.cursor[0] = (columns + state.cursor[0] - 1) % columns
      state.cursor[1] = (state.cursor[1]) % rows
      break;
  }
  return state
}

function setTileMapColor(state) {
  let { selectedColor, cursor } = state
  let [ x, y ] = cursor
  state.tileMap[y][x] = selectedColor
  return state
}

function eraseTileMapColor(state) {
  let { cursor } = state
  let [ x, y ] = cursor
  state.tileMap[y][x] = 0
  return state
}

function togglePlayView(state) {
  if (state.view === 'play') state.view = 'edit'
  else if (state.view === 'edit') state.view = 'play'
  else if (state.view === 'code') state.view = 'play'
  return state
}

function toggleEditView(state) {
  if (state.view === 'edit') state.view = 'code'
  else if (state.view === 'code') state.view = 'edit'
  return state
}

function selectEvent(state, i) {
  state.selectedEvent = i
  return state
}

function selectRule(state, i) {
  state.selectedRule = i
  return state
}

function selectColor(state, i) {
  state.selectedColor = i
  return state
}

function setRule(state, x, y, value) {
  let { rules, selectedEvent, selectedRule } = state
  let rule = rules[selectedEvent][selectedRule]
  let [ when, then ] = rule
  // WHEN
  let _y = y-5
  if (x < 3) {
    when[_y][x] = value
  }
  // THEN
  if (x > 4) {
    let _x = x-5
    then[_y][_x] = value
  }
  return state
}

function setRuleColor(state, x, y) {
  let { selectedColor } = state
  state = setRule(state, x, y, selectedColor)
  return state
}

function eraseRuleColor(state, x, y) {
  state = setRule(state, x, y, null)
  return state
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

let stories = [
  {"tileMap":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,1,0,0,0,0,1,14,11,0,0,1],[1,14,1,1,0,1,0,1,1,0,1,0,1,1,0,1],[1,11,0,8,0,0,0,1,1,0,0,0,8,0,0,1],[1,0,1,1,0,1,0,8,0,0,1,0,1,1,0,1],[1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1],[1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1],[1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1],[1,0,1,1,0,1,1,0,10,1,1,0,1,1,0,1],[1,0,0,1,0,1,0,0,1,1,1,0,1,1,0,1],[1,1,0,8,0,1,0,0,1,0,0,0,0,0,0,1],[1,0,0,1,0,1,0,0,0,0,1,0,1,8,1,1],[1,0,1,1,0,0,0,0,1,0,0,0,0,0,0,1],[1,0,1,0,0,1,1,0,1,1,1,0,1,1,0,1],[1,0,0,0,1,1,0,0,0,0,1,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],"rules":[[[[[null,null,null],[null,14,null],[null,null,null]],[[null,null,null],[null,11,null],[null,null,null]]],[[[null,null,null],[null,11,null],[null,null,null]],[[null,null,null],[null,0,null],[null,null,null]]],[[[null,0,null],[null,14,null],[null,11,null]],[[null,14,null],[null,null,null],[null,null,null]]],[[[null,null,null],[11,14,0],[null,null,null]],[[null,null,null],[null,null,14],[null,null,null]]],[[[null,11,null],[null,14,null],[null,0,null]],[[null,null,null],[null,null,null],[null,14,null]]],[[[null,null,null],[0,14,11],[null,null,null]],[[null,null,null],[14,null,null],[null,null,null]]],[[[null,0,null],[11,14,1],[null,null,null]],[[null,14,null],[null,11,null],[null,null,null]]],[[[null,11,null],[null,14,0],[null,1,null]],[[null,null,null],[null,11,14],[null,null,null]]],[[[null,null,null],[1,14,11],[null,0,null]],[[null,null,null],[null,11,null],[null,14,null]]],[[[null,1,null],[0,14,null],[null,11,null]],[[null,null,null],[14,11,null],[null,null,null]]],[[[null,0,null],[1,14,11],[null,1,null]],[[null,14,null],[null,11,null],[null,null,null]]],[[[null,1,null],[1,14,0],[null,11,null]],[[null,null,null],[null,11,14],[null,null,null]]],[[[null,1,null],[11,14,1],[null,0,null]],[[null,null,null],[null,11,null],[null,14,null]]],[[[null,11,null],[0,14,1],[null,1,null]],[[null,null,null],[14,11,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,0,null],[null,10,null],[null,null,null]],[[null,10,null],[null,0,null],[null,null,null]]],[[[null,8,null],[null,10,null],[null,null,null]],[[null,2,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,10,0],[null,null,null]],[[null,null,null],[null,0,10],[null,null,null]]],[[[null,null,null],[null,10,8],[null,null,null]],[[null,null,null],[null,null,2],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,10,null],[null,0,null]],[[null,null,null],[null,0,null],[null,10,null]]],[[[null,null,null],[null,10,null],[null,8,null]],[[null,null,null],[null,null,null],[null,2,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[0,10,null],[null,null,null]],[[null,null,null],[10,0,null],[null,null,null]]],[[[null,null,null],[8,10,null],[null,null,null]],[[null,null,null],[2,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]]],"cursor":[14,5],"selectedColor":11,"selectedRule":1,"selectedEvent":4,"view":"play","columns":16,"rows":16},

  {"tileMap":[[0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],[1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,3,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[0,0,0,0,0,0,8,8,8,8,0,0,0,0,0,0],[0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0]],"rules":[[[[[null,null,null],[null,2,null],[null,null,null]],[[null,null,null],[null,3,null],[null,null,null]]],[[[null,null,null],[null,3,null],[null,null,null]],[[null,null,null],[null,0,null],[null,null,null]]],[[[3,null,null],[null,2,null],[null,null,0]],[[null,null,null],[null,null,null],[null,null,2]]],[[[null,null,3],[null,2,null],[0,null,null]],[[null,null,null],[null,null,null],[2,null,null]]],[[[0,null,null],[null,2,null],[null,null,3]],[[2,null,null],[null,null,null],[null,null,null]]],[[[null,null,0],[null,2,null],[3,null,null]],[[null,null,2],[null,null,null],[null,null,null]]],[[[null,1,null],[null,2,null],[0,null,3]],[[null,null,null],[null,3,null],[2,null,null]]],[[[null,1,null],[null,2,null],[3,null,0]],[[null,null,null],[null,3,null],[null,null,2]]],[[[3,null,null],[null,2,1],[0,null,null]],[[null,null,null],[null,3,null],[2,null,null]]],[[[0,null,null],[null,2,1],[3,null,null]],[[2,null,null],[null,3,null],[null,null,null]]],[[[null,null,3],[1,2,null],[null,null,0]],[[null,null,null],[null,3,null],[null,null,2]]],[[[null,null,0],[1,2,null],[null,null,3]],[[null,null,2],[null,3,null],[null,null,null]]],[[[3,null,0],[null,2,null],[null,8,null]],[[null,null,2],[null,3,null],[null,null,null]]],[[[0,null,3],[null,2,null],[null,8,null]],[[2,null,null],[null,3,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,8,0],[null,null,null]],[[null,null,null],[null,null,8],[null,null,null]]],[[[null,null,null],[0,8,null],[null,null,null]],[[null,null,null],[null,0,null],[null,null,null]]],[[[null,null,null],[1,8,null],[null,null,null]],[[null,null,null],[null,0,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[0,8,null],[null,null,null]],[[null,null,null],[8,null,null],[null,null,null]]],[[[null,null,null],[null,8,0],[null,null,null]],[[null,null,null],[null,0,null],[null,null,null]]],[[[null,null,null],[null,8,1],[null,null,null]],[[null,null,null],[null,0,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]]],"cursor":[8,8],"selectedColor":2,"selectedRule":0,"selectedEvent":0,"view":"edit","columns":16,"rows":16},

  {"tileMap":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,10,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,8,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],"rules":[[[[[null,0,null],[null,8,null],[null,null,null]],[[null,8,null],[null,0,null],[null,null,null]]],[[[null,1,null],[null,8,null],[null,null,null]],[[null,null,null],[null,0,null],[null,null,null]]],[[[null,null,null],[null,10,null],[null,8,null]],[[10,10,10],[10,10,10],[null,null,null]]],[[[null,10,null],[null,10,null],[null,null,null]],[[10,null,10],[10,null,10],[null,null,null]]],[[[null,null,null],[10,10,10],[null,null,null]],[[10,10,10],[null,null,null],[10,10,10]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,2,null],[null,null,null]],[[null,8,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,2,0],[null,null,null]],[[null,null,null],[null,0,2],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[0,2,null],[null,null,null]],[[null,null,null],[2,0,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]]],"cursor":[5,4],"selectedColor":10,"selectedRule":0,"selectedEvent":0,"view":"play","columns":16,"rows":16},

  {"tileMap":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,3,3,3,3,3,3,0,0,0,0,1],[1,0,0,0,3,3,3,3,3,3,3,3,0,0,0,1],[1,0,0,0,3,8,3,3,8,3,3,3,0,0,0,1],[1,0,0,0,3,3,3,3,3,3,3,3,0,0,0,1],[1,0,0,0,3,3,3,3,3,3,3,3,0,0,0,1],[1,0,0,0,3,3,7,0,7,0,7,3,0,0,0,1],[1,0,0,0,3,7,0,7,0,7,0,3,0,0,0,1],[1,0,0,0,3,3,3,3,3,3,3,3,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],"rules":[[[[[3,7,0],[0,0,0],[null,null,null]],[[3,3,3],[3,7,0],[null,null,null]]],[[[null,null,null],[3,7,0],[7,0,7]],[[3,7,0],[0,0,0],[null,null,null]]],[[[7,0,7],[0,0,0],[null,null,null]],[[3,3,3],[7,0,7],[null,null,null]]],[[[null,null,null],[7,0,7],[0,7,0]],[[7,0,7],[0,0,0],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]]],"cursor":[5,5],"selectedColor":7,"selectedRule":3,"selectedEvent":0,"view":"play","columns":16,"rows":16},

  {"tileMap":[[10,10,10,6,10,6,6,6,6,6,6,6,6,6,6,6],[10,10,6,10,6,10,6,6,6,6,6,6,6,6,6,6],[10,6,10,6,6,6,6,6,6,6,6,6,6,6,6,6],[6,10,6,10,6,6,6,6,6,6,6,6,6,6,6,6],[10,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],[6,10,6,6,6,7,6,6,6,7,6,6,6,6,6,6],[6,6,6,6,6,7,7,7,7,7,6,6,6,6,6,6],[6,6,6,6,6,7,0,15,15,0,6,6,6,6,6,6],[6,6,6,11,11,7,15,15,15,15,6,15,6,6,6,6],[6,6,6,3,12,11,12,12,12,12,15,6,6,6,6,6],[6,6,6,15,3,12,12,12,12,12,6,6,6,6,6,6],[6,6,6,6,6,5,5,5,5,5,6,6,6,6,6,6],[3,3,3,3,3,15,3,3,3,15,3,3,3,3,3,3],[3,11,3,3,3,15,3,3,3,3,3,3,3,11,3,3],[3,3,11,3,3,3,3,3,3,3,3,3,3,3,11,3],[3,3,3,3,3,3,11,3,3,3,3,11,3,3,3,3]],"rules":[[[[[null,5,null],[null,15,null],[null,15,null]],[[null,5,null],[null,15,null],[null,3,null]]],[[[null,5,null],[null,15,null],[null,3,null]],[[null,null,null],[null,null,null],[null,15,null]]],[[[11,null,null],[3,12,null],[15,null,null]],[[15,null,null],[null,null,null],[3,null,null]]],[[[15,null,null],[null,12,null],[3,null,null]],[[11,null,null],[null,null,null],[15,null,null]]],[[[15,6,6],[12,6,6],[12,15,6]],[[15,6,15],[12,15,6],[12,6,6]]],[[[15,6,15],[12,15,6],[12,6,6]],[[15,6,6],[12,6,6],[12,15,6]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]]],"cursor":[9,9],"selectedColor":12,"selectedRule":5,"selectedEvent":0,"view":"play","columns":16,"rows":16},

  {"tileMap":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,4,4,4,4,4,0,0,0,0,0,1],[1,0,0,0,0,0,4,4,4,4,4,0,0,0,0,1],[1,0,0,0,4,0,0,0,0,0,4,4,4,0,0,1],[1,0,0,0,0,4,4,4,4,0,0,4,4,0,0,1],[1,0,12,0,12,12,0,0,0,4,0,4,0,0,4,1],[1,0,0,12,12,12,0,12,0,4,4,4,4,4,0,1],[1,12,0,12,12,12,0,12,0,4,4,4,4,0,0,1],[1,12,0,12,12,12,0,12,0,4,4,0,0,0,4,1],[1,12,0,12,12,0,0,4,0,0,4,0,4,4,0,1],[1,12,0,0,12,0,12,0,4,0,0,0,4,0,0,1],[1,0,12,0,0,0,12,0,0,4,0,4,0,0,0,1],[1,0,0,12,12,12,0,0,0,0,4,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],"rules":[[[[[null,null,null],[null,4,null],[null,0,null]],[[null,null,null],[null,0,null],[null,4,null]]],[[[null,null,null],[null,4,null],[0,4,null]],[[null,null,null],[null,0,null],[4,null,null]]],[[[null,null,null],[null,4,null],[4,4,0]],[[null,null,null],[null,0,null],[null,null,4]]],[[[null,null,null],[null,4,null],[null,12,null]],[[null,null,null],[null,12,null],[null,4,null]]],[[[null,null,null],[null,12,null],[null,0,null]],[[null,null,null],[null,12,null],[null,0,null]]],[[[null,null,null],[null,12,null],[0,12,null]],[[null,null,null],[null,0,null],[12,null,null]]],[[[null,null,null],[null,12,null],[12,12,0]],[[null,null,null],[null,0,null],[null,null,12]]],[[[null,null,null],[null,12,null],[0,4,null]],[[null,null,null],[null,0,null],[12,null,null]]],[[[null,null,null],[null,12,null],[4,4,0]],[[null,null,null],[null,0,null],[null,null,12]]],[[[null,null,null],[0,12,12],[12,12,12]],[[null,null,null],[12,0,null],[null,null,null]]],[[[null,null,null],[12,12,0],[12,12,12]],[[null,null,null],[null,0,12],[null,null,null]]],[[[null,null,null],[null,12,null],[null,0,null]],[[null,null,null],[null,0,null],[null,12,null]]],[[[null,null,null],[null,4,null],[12,4,null]],[[null,null,null],[12,0,null],[4,null,null]]],[[[null,null,null],[null,4,null],[4,4,12]],[[null,null,null],[null,0,12],[null,null,4]]],[[[null,null,null],[1,12,null],[null,null,0]],[[null,null,null],[null,0,null],[null,null,12]]],[[[null,null,null],[null,12,1],[0,null,null]],[[null,null,null],[null,0,null],[12,null,null]]]],[[[[null,null,null],[null,2,null],[null,null,null]],[[null,null,null],[null,null,null],[null,12,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,2,0],[null,null,null]],[[null,null,null],[null,0,2],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,2,null],[null,null,null]],[[null,null,null],[null,null,null],[null,4,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[0,2,null],[null,null,null]],[[null,null,null],[2,0,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]]],"cursor":[4,9],"selectedColor":12,"selectedRule":0,"selectedEvent":4,"view":"play","columns":16,"rows":16},

  {"tileMap":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,10,0,0,0,10,0,0,0,10,10,10,10,0,0],[0,10,0,10,0,10,0,10,0,10,0,0,0,0,10,0],[0,10,0,10,0,10,0,10,0,10,0,0,10,10,0,0],[0,10,0,10,0,10,0,10,0,10,0,10,0,0,0,0],[0,10,0,10,0,10,0,10,0,10,0,0,10,10,0,0],[0,10,0,10,0,10,0,10,0,10,0,0,0,0,10,0],[0,10,0,0,10,0,0,0,10,0,0,0,0,0,10,0],[0,10,0,0,0,0,0,0,0,0,0,10,0,0,10,0],[0,0,10,10,10,10,10,0,10,0,10,0,10,0,10,0],[0,0,0,0,0,0,0,10,10,10,0,0,10,0,10,0],[0,0,0,0,0,0,2,0,10,0,0,0,10,0,10,0],[0,0,2,1,0,1,2,0,0,0,0,0,10,0,10,0],[0,10,0,0,10,0,2,0,0,0,0,10,0,0,10,0],[0,0,10,10,0,0,0,0,0,0,0,0,10,10,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"rules":[[[[[null,null,null],[null,2,null],[null,null,null]],[[null,null,null],[null,1,null],[null,null,null]]],[[[null,null,null],[null,1,null],[null,null,null]],[[null,null,null],[null,10,null],[null,null,null]]],[[[null,2,null],[null,10,null],[null,null,null]],[[null,null,null],[null,2,null],[null,null,null]]],[[[null,null,null],[null,10,2],[null,null,null]],[[null,null,null],[null,2,null],[null,null,null]]],[[[null,null,null],[null,10,null],[null,2,null]],[[null,null,null],[null,2,null],[null,null,null]]],[[[null,null,null],[2,10,null],[null,null,null]],[[null,null,null],[null,2,null],[null,null,null]]],[[[2,null,null],[null,10,null],[null,null,null]],[[null,null,null],[null,2,null],[null,null,null]]],[[[null,null,2],[null,10,null],[null,null,null]],[[null,null,null],[null,2,null],[null,null,null]]],[[[null,null,null],[null,10,null],[null,null,2]],[[null,null,null],[null,2,null],[null,null,null]]],[[[null,null,null],[null,10,null],[2,null,null]],[[null,null,null],[null,2,null],[null,null,null]]],[[[2,null,null],[2,10,null],[2,null,null]],[[null,null,null],[null,10,null],[null,null,null]]],[[[2,2,2],[null,10,null],[null,null,null]],[[null,null,null],[null,10,null],[null,null,null]]],[[[null,null,2],[null,10,2],[null,null,2]],[[null,null,null],[null,10,null],[null,null,null]]],[[[null,null,null],[null,10,null],[2,2,2]],[[null,null,null],[null,10,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]],[[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]],[[[null,null,null],[null,null,null],[null,null,null]],[[null,null,null],[null,null,null],[null,null,null]]]]],"cursor":[12,14],"selectedColor":10,"selectedRule":0,"selectedEvent":0,"view":"play","columns":16,"rows":16}

]
