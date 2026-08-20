const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_W = 60;
const TILE_H = 80;

// odstępy między kafelkami w logice
const TILE_OFFSET_X = 53;
const TILE_OFFSET_Y = 74;

// ułozenie układu na ekranie
let ORIGIN_X = 130;
let ORIGIN_Y = 60;

// przesunięcie warstwy (lekki efekt 3D)
const Z_OFFSET_X = 8;
const Z_OFFSET_Y = 8;

const SPRITE_COLS = 9;
const SPRITE_ROWS = 4;

const SPECIAL = [33, 34, 35];
function isSpecial(tile) {
  return SPECIAL.includes(tile.tileType);
}

let tiles = [];
let selectedTile = null;
let hintPair = null;
let undoStack = [];

const imgTiles = new Image();
imgTiles.src = 'tiles.png';

imgTiles.onload = () => newGame();
imgTiles.onerror = () => newGame();



document.getElementById('btnNew').addEventListener('click', newGame);
canvas.addEventListener('click', onCanvasClick);


const turtleLayout = [

  // --- WARSTWA 0 (48) ---
  // główna podstawa 12×4
  ...Array.from({ length: 12 }, (_, x) =>
    Array.from({ length: 4 }, (_, y) => ({ x, y: y + 2, z: 0 }))
  ).flat(),

  // dolne skrzydełka (4)
  { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
  { x: 10, y: 1, z: 0 }, { x: 11, y: 1, z: 0 },

  // górne skrzydełka (4)
  { x: 0, y: 6, z: 0 }, { x: 1, y: 6, z: 0 },
  { x: 10, y: 6, z: 0 }, { x: 11, y: 6, z: 0 },

  // boczne ramiona (4)
  { x: -1, y: 3, z: 0 }, { x: -1, y: 4, z: 0 },
  { x: 12, y: 3, z: 0 }, { x: 12, y: 4, z: 0 },


  // --- WARSTWA 1 (32) ---
  ...Array.from({ length: 8 }, (_, x) =>
    Array.from({ length: 4 }, (_, y) => ({ x: x + 2, y: y + 2, z: 1 }))
  ).flat(),


  // --- WARSTWA 2 (16) ---
  ...Array.from({ length: 6 }, (_, x) =>
    Array.from({ length: 3 }, (_, y) => ({ x: x + 3, y: y + 3, z: 2 }))
  ).flat(),


  // --- WARSTWA 3 (8) ---
  ...Array.from({ length: 4 }, (_, x) =>
    Array.from({ length: 2 }, (_, y) => ({ x: x + 4, y: y + 4, z: 3 }))
  ).flat(),


  // --- WARSTWA 4 (4) ---
  { x: 5, y: 4, z: 4 },
  { x: 6, y: 4, z: 4 },
  { x: 5, y: 5, z: 4 },
  { x: 6, y: 5, z: 4 },


  // --- WARSTWA 5 (1) ---
  { x: 5.5, y: 4.5, z: 5 }
];

const traditionalLayout = [

  // --- WARSTWA 0 (72) ---
  // główna baza 15×4
  ...Array.from({ length: 15 }, (_, x) =>
    Array.from({ length: 4 }, (_, y) => ({ x, y: y + 2, z: 0 }))
  ).flat(),

  // skrzydełka boczne (8)

  { x: -1, y: 3, z: 0 }, { x: -1, y: 4, z: 0 },
  { x: -1, y: 5, z: 0 }, { x: -1, y: 6, z: 0 },
  { x: 15, y: 3, z: 0 }, { x: 15, y: 4, z: 0 },
  { x: 15, y: 5, z: 0 }, { x: 15, y: 6, z: 0 },
  { x: -1, y: 7, z: 0 }, { x: 15, y: 7, z: 0 }, 

  // dolne skrzydełka (4)
  { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
  { x: 11, y: 1, z: 0 }, { x: 12, y: 1, z: 0 },


  // górne skrzydełka (4)
  { x: 2, y: 7, z: 0 }, { x: 3, y: 7, z: 0 },
  { x: 11, y: 7, z: 0 }, { x: 12, y: 7, z: 0 },


  // --- WARSTWA 1 (40) ---
  ...Array.from({ length: 13 }, (_, x) =>
    Array.from({ length: 3 }, (_, y) => ({ x: x + 1, y: y + 3, z: 1 }))
  ).flat(),


  // --- WARSTWA 2 (20) ---
  ...Array.from({ length: 10 }, (_, x) =>
    Array.from({ length: 2 }, (_, y) => ({ x: x + 2, y: y + 4, z: 2 }))
  ).flat(),


  // --- WARSTWA 3 (10) ---
  ...Array.from({ length: 6 }, (_, x) =>
    Array.from({ length: 1 }, (_, y) => ({ x: x + 4, y: 5, z: 3 }))
  ).flat(),


  /*// --- WARSTWA 4 (2) ---
  { x: 7, y: 5, z: 4 },
  { x: 8, y: 5, z: 4 }*/
];

const towerLayout = [

  // --- WARSTWA 0 (87) ---
  // główna baza 8×8
  ...Array.from({ length: 8 }, (_, x) =>
    Array.from({ length: 8 }, (_, y) => ({ x, y: y + 2, z: 0 }))
  ).flat(),
  
   //  --- lewa strona ----
    { x: -1, y: 2, z: 0 }, { x: -2, y: 2, z: 0 },
    { x: -1, y: 9, z: 0 }, { x: -2, y: 9, z: 0 },
	{ x: -1, y: 4, z: 0 }, { x: -1, y: 5, z: 0 }, { x: -1, y: 6, z: 0 }, { x: -1, y: 7, z: 0 },
    { x: -2, y: 5, z: 0 }, { x: -2, y: 6, z: 0 },
	{ x: -3, y: 5.5, z: 0},
	
	   //  --- prawa strona ----
    { x: 8, y: 2, z: 0 }, { x: 9, y: 2, z: 0 },
    { x: 8, y: 9, z: 0 }, { x: 9, y: 9, z: 0 },
	{ x: 8, y: 4, z: 0 }, { x: 8, y: 5, z: 0 }, { x: 8, y: 6, z: 0 }, { x: 8, y: 7, z: 0 },
    { x: 9, y: 5, z: 0 }, { x: 9, y: 6, z: 0 },
	{ x: 10, y: 5.5, z: 0}, { x: 11, y: 5.5, z: 0},
	
	  // --- WARSTWA 1 (36) ---
  ...Array.from({ length: 6 }, (_, x) =>
    Array.from({ length: 6 }, (_, y) => ({ x: x + 1, y: y + 3, z: 1 }))
  ).flat(),


  // --- WARSTWA 2 (16) ---
  ...Array.from({ length: 4 }, (_, x) =>
    Array.from({ length: 4 }, (_, y) => ({ x: x + 2, y: y + 4, z: 2 }))
  ).flat(),


  // --- WARSTWA 3 4) ---
  ...Array.from({ length: 2 }, (_, x) =>
    Array.from({ length: 2 }, (_, y) => ({ x: x + 3, y: y + 5, z: 3 }))
  ).flat(),
  
  // --- WARSTWA 4 (1) ---
  	{ x: 3.5, y: 5.5, z: 4}
];

const crossLayout = [
  // --- WARSTWA 0 (70) ---
  // główna baza 6×7
  ...Array.from({ length: 6 }, (_, x) =>
    Array.from({ length: 7 }, (_, y) => ({ x, y: y + 2, z: 0 }))
  ).flat(),

       //  --- lewa strona ----
      { x: -1, y: 3, z: 0 },
      { x: -1, y: 4, z: 0 }, { x: -2, y: 4, z: 0 },
	  { x: -1, y: 5, z: 0 }, { x: -2, y: 5, z: 0 },
	  { x: -1, y: 6, z: 0 }, { x: -2, y: 6, z: 0 },
	  { x: -1, y: 7, z: 0 },
	  { x: -3, y: 4, z: 0 },{ x: -3, y: 5, z: 0 },  { x: -3, y: 6, z: 0 }, 
      { x: -4, y: 5, z: 0 },	  
	  
       //  --- prawa strona ----
      { x: 6, y: 3, z: 0 },
      { x: 6, y: 4, z: 0 }, { x: 7, y: 4, z: 0 },
	  { x: 6, y: 5, z: 0 }, { x: 7, y: 5, z: 0 },
	  { x: 6, y: 6, z: 0 }, { x: 7, y: 6, z: 0 },
	  { x: 6, y: 7, z: 0 },
	  { x: 8, y: 4, z: 0 },	{ x: 8, y: 5, z: 0 },  { x: 8, y: 6, z: 0 },
      { x: 9, y: 5, z: 0 },	  

      //  ---  góra ----
	  { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
	  
	  //  --- dół -----
      { x: 2, y: 9, z: 0 },	 { x: 3, y: 9, z: 0 }, 

  // --- WARSTWA 1 (40) ---
  ...Array.from({ length: 2 }, (_, x) =>
    Array.from({ length: 5 }, (_, y) => ({ x, y: y + 3, z: 1 }))
  ).flat(),
  
  ...Array.from({ length: 2 }, (_, x) =>
    Array.from({ length: 5 }, (_, y) => ({ x: x + 4, y: y + 3, z: 1 }))
  ).flat(),

  ...Array.from({ length: 1 }, (_, x) =>
    Array.from({ length: 3 }, (_, y) => ({ x: x - 1, y: y + 4, z: 1 }))
  ).flat(),

 	 { x: - 2, y: 5, z: 1 },  { x: - 2, y: 6, z: 1 },     
  
  ...Array.from({ length: 1 }, (_, x) =>
    Array.from({ length: 3 }, (_, y) => ({ x: x + 6, y: y + 4, z: 1 }))
  ).flat(), 

     { x: 7, y: 5, z: 1 },  { x: 7, y: 6, z: 1 },    
  
     //  ---  góra ----
	 
	 { x: 2, y: 3, z: 1 },  { x: 3, y: 3, z: 1 },
	 //  ---  środek ----
     { x: 2, y: 5, z: 1 },  { x: 3, y: 5, z: 1 },	 
	 //  --- dół ----
	 { x: 1, y: 8, z: 1 },  { x: 2, y: 8, z: 1 },  { x: 3, y: 8, z: 1 },  { x: 4, y: 8, z: 1 },	
     { x: 2, y: 7, z: 1 },  { x: 3, y: 7, z: 1 },	

  // --- WARSTWA 2 (20) ---	 
  
        //  ---  góra ----
     { x: 1, y: 3, z: 2 }, { x: 4, y: 3, z: 2 },  
	 { x: -1, y: 4, z: 2 },  { x: 0, y: 4, z: 2 }, { x: 1, y: 4, z: 2 },
	 { x: 4, y: 4, z: 2 },  { x: 5, y: 4, z: 2 }, { x: 6, y: 4, z: 2 },
	   //  ---  dół ----
	 { x: 1, y: 8, z: 2 }, 	 
	 { x: 4, y: 8, z: 2 },
	 { x: 0, y: 7, z: 2 }, { x: 1, y: 7, z: 2 }, { x: 4, y: 7, z: 2 }, { x: 5, y: 7, z: 2 }, 	 
	 { x: -1, y: 6, z: 2 },  { x: 0, y: 6, z: 2 }, { x: 1, y: 6, z: 2 },
	 { x: 4, y: 6, z: 2 },  { x: 5, y: 6, z: 2 }, { x: 6, y: 6, z: 2 }, 

  // --- WARSTWA 3 (14) ---	 	 
     { x: 1, y: 3, z: 3 }, { x: 4, y: 3, z: 3 },
	 { x: 0, y: 4, z: 3 }, { x: 1, y: 4, z: 3 }, 
	 { x: 4, y: 4, z: 3 },  { x: 5, y: 4, z: 3 },  

	 { x: -1, y: 6, z: 3 },  { x: 0, y: 6, z: 3 }, { x: 1, y: 6, z: 3 },
	 { x: 4, y: 6, z: 3 },  { x: 5, y: 6, z: 3 }, { x: 6, y: 6, z: 3 },
     { x: 1, y: 7, z: 3 }, { x: 4, y: 7, z: 3 },	 

]

const layoutConfig = {
  turtle: { ORIGIN_X: 190, ORIGIN_Y: 60 },
  traditional: { ORIGIN_X: 125, ORIGIN_Y: 60 },
  tower: { ORIGIN_X: 300, ORIGIN_Y: -110 },
  cross: { ORIGIN_X: 370, ORIGIN_Y: -70 }
};

let currentLayoutName = "tower";
let layout = towerLayout;

const layouts = {
  turtle: turtleLayout,
  traditional: traditionalLayout,
  tower: towerLayout,
  cross: crossLayout
};

function newGame() {
  layout = layouts[currentLayoutName];

  // 🔥 ustawienie pozycji układu
  ORIGIN_X = layoutConfig[currentLayoutName].ORIGIN_X;
  ORIGIN_Y = layoutConfig[currentLayoutName].ORIGIN_Y;

  tiles = createTilesFromLayout();
  selectedTile = null;
  hintPair = null;
  setStatus('Znajdź wszystkie pary.');
  draw();
}

function createTilesFromLayout() {
  const positions = [...layout]; // 144 pozycji
  const count = positions.length;

  // --- 1. przygotuj 72 par typów ---
  const pairTypes = [];
  for (let i = 0; i < 36; i++) {
    pairTypes.push(i, i, i, i); // 4 sztuki każdego typu
  }

  shuffle(pairTypes);

  // --- 2. potasuj pozycje ---
  shuffle(positions);

  // --- 3. rozłóż pary po losowych pozycjach ---
  const tiles = [];
  for (let i = 0; i < count; i++) {
    tiles.push({
      x: positions[i].x,
      y: positions[i].y,
      z: positions[i].z,
      tileType: pairTypes[i],
      removed: false
    });
  }

  return tiles;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1f2833';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const visibleTiles = tiles
    .filter(t => !t.removed)
    .sort((a, b) => a.z - b.z);

  for (const tile of visibleTiles) {
    drawTile(tile);
  }
}

function logicalToPixel(tile) {
  const px = ORIGIN_X + tile.x * TILE_OFFSET_X + tile.z * Z_OFFSET_X;
  const py = ORIGIN_Y + tile.y * TILE_OFFSET_Y - tile.z * Z_OFFSET_Y;
  return { px, py };
}

function getCoveringLowerLeftTile(tile) {
  return tiles.find(t =>
    !t.removed &&
    t.z < tile.z &&          // niższa warstwa
    t.x < tile.x &&          // po lewej
    Math.abs(t.x - tile.x) < 1.1 &&
    Math.abs(t.y - tile.y) < 0.6
  );
}

function anyTileCoversPoint(x, y) {
  return tiles.some(t => {
    if (t.removed) return false;
    const p = logicalToPixel(t);
    const tx = p.px;
    const ty = p.py;
    const tw = TILE_W;
    const th = TILE_H;
    return x >= tx && x <= tx + tw && y >= ty && y <= ty + th;
  });
}



// ===============================================
//          RYSOWANIE KAFELKA 
// ===============================================

function drawTile(tile) {
  const { px, py } = logicalToPixel(tile);

  const sx = (tile.tileType % SPRITE_COLS) * TILE_W;
  const sy = Math.floor(tile.tileType / SPRITE_COLS) * TILE_H;

  const BOCZEK = 6;

  let drawX = px;
  let drawY = py;
  let drawW = TILE_W;
  let drawH = TILE_H;
  let srcX = sx;
  let srcY = sy;
  

  // LEWY boczek – obcinamy sprite
  if (hasLeftNeighbor(tile)) {
    drawX += BOCZEK;
    drawW -= BOCZEK;
    srcX += BOCZEK;
  }

  // DOLNY boczek – obcinamy sprite
  if (hasBottomNeighbor(tile)) {
    drawH -= BOCZEK;
  }

  // RYSOWANIE kafelka
  ctx.drawImage(
    imgTiles,
    srcX,
    srcY,
    drawW,
    drawH,
    drawX,
    drawY,
    drawW,
    drawH
  );
  

  
  // ⭐ GÓRNY LEWY RÓG — tło tylko gdy brak lewego i brak górnego
  if (tile.z === 0 && !hasLeftNeighbor(tile) && !hasTopNeighbor(tile)) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(drawX, drawY);
    ctx.lineTo(drawX + 8, drawY);
    ctx.lineTo(drawX, drawY + 8);
    ctx.closePath();
    ctx.fillStyle = '#1f2833';
    ctx.fill();
    ctx.restore();
  }
  


	// ⭐ PRAWY DOLNY RÓG — normalnie: brak prawego i brak dolnego

	const cornerX = drawX + drawW;
	const cornerY = drawY + drawH;
	
	const isCornerCovered = tiles.some(t => {
		if (t.removed) return false;

		// kafelek musi być NA TEJ SAMEJ lub NIŻSZEJ warstwie
		if (t.z > tile.z) return false;

		const p = logicalToPixel(t);
		const tx = p.px;
		const ty = p.py;

		return (
			cornerX > tx &&
			cornerX < tx + TILE_W &&
			cornerY > ty &&
			cornerY < ty + TILE_H
		);
	});

	// ⭐ PRAWY DOLNY RÓG — wycinamy tylko jeśli nic go nie zasłania graficznie
	
	if (!hasBottomNeighbor(tile) && !isCornerCovered) {
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(drawX + drawW, drawY + drawH);
		ctx.lineTo(drawX + drawW - 8, drawY + drawH);
		ctx.lineTo(drawX + drawW, drawY + drawH - 8);
		ctx.closePath();
		ctx.fillStyle = '#1f2833';
		ctx.fill();
		ctx.restore();
	}



  // LEWY boczek półprzezroczysty
  if (!hasLeftNeighbor(tile)) {
    const gradLeft = ctx.createLinearGradient(drawX, drawY, drawX + 8, drawY);
    gradLeft.addColorStop(0, 'rgba(255,255,255,0.0)');
    gradLeft.addColorStop(1, 'rgba(255,255,255,0.35)');
    ctx.fillStyle = gradLeft;
    ctx.fillRect(drawX, drawY, 8, drawH - 8);
  }

  // DOLNY boczek półprzezroczysty
  if (!hasBottomNeighbor(tile)) {
    const gradBottom = ctx.createLinearGradient(drawX, drawY + drawH - 8, drawX, drawY + drawH);
    gradBottom.addColorStop(0, 'rgba(255,255,255,0.0)');
    gradBottom.addColorStop(1, 'rgba(255,255,255,0.15)');
    ctx.fillStyle = gradBottom;
    ctx.fillRect(drawX + 8, drawY + drawH - 8, drawW - 8, 8);
  }

	// UKOŚNY narożnik — dolny lewy
	// 🔥 dla skrajnych lewych kafelków zawsze rysujemy ten trójkąt,
	// niezależnie od tego, czy jest sąsiad na dole
	if (!hasLeftNeighbor(tile)) {
	  ctx.save();
	  ctx.beginPath();
	  ctx.moveTo(drawX, drawY + drawH);
	  ctx.lineTo(drawX + 8, drawY + drawH - 8);
	  ctx.lineTo(drawX, drawY + drawH - 8);
	  ctx.closePath();

	  const gradCorner = ctx.createLinearGradient(drawX, drawY + drawH, drawX + 8, drawY + drawH - 8);
	  gradCorner.addColorStop(0, 'rgba(255,255,255,0.0)');
	  gradCorner.addColorStop(1, 'rgba(255,255,255,0.10)');
	  ctx.fillStyle = gradCorner;
	  ctx.fill();
	  ctx.restore();
	}
	
  
	// 🔥 UZUPEŁNIENIE trójkątów boczków dla warstw wyższych niż 0 (dodałem też 0 ">="; wcześniej było tylko ".")
	if (tile.z >= 0) {
  
	    // używamy tylko logicznego sąsiada
		const hasAbove = hasTopNeighbor(tile);
		const hasRight = hasRightNeighbor(tile);

	  // ⭐ GÓRNY-LEWY TRÓJKĄT — pełny brązowy, ale NIE dla skrajnego górnego
	      if (hasAbove) {
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(drawX, drawY);
		ctx.lineTo(drawX + 8, drawY);
		ctx.lineTo(drawX, drawY + 8);
		ctx.closePath();
		ctx.fillStyle = '#c7a27c';
		ctx.fill();
		ctx.restore();
	  }

	  // ⭐ DOLNY-PRAWY TRÓJKĄT — pełny brązowy, ale NIE dla skrajnego prawego
	  if (hasRight) {
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(drawX + drawW, drawY + drawH);
		ctx.lineTo(drawX + drawW - 8, drawY + drawH);
		ctx.lineTo(drawX + drawW, drawY + drawH - 8);
		ctx.closePath();
		ctx.fillStyle = '#c7a27c';
		ctx.fill();
		ctx.restore();
	  }
	}

	
	  // zaznaczenie kafelka
	  if (selectedTile === tile) {
		ctx.fillStyle = 'rgba(0,0,0,0.18)';
		ctx.fillRect(drawX, drawY, drawW, drawH);
	  }

	  // podpowiedź (hint)
	  if (hintPair && (tile === hintPair[0] || tile === hintPair[1])) {
		ctx.fillStyle = 'rgba(255,255,0,0.25)';
		ctx.fillRect(drawX, drawY, drawW, drawH);
	  }
	  
	}
	

function onCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const clicked = getTileAt(mx, my);
  if (!clicked) return;

  if (!isTileFree(clicked)) {
    setStatus('Ten kafelek nie jest wolny.');
    return;
  }

  if (!selectedTile) {
    selectedTile = clicked;
    setStatus('Wybrano kafelek typu ' + clicked.tileType);
  } else {
    if (selectedTile === clicked) {
      selectedTile = null;
      setStatus('Odznaczono.');
    } else if (selectedTile.tileType === clicked.tileType
      || (isSpecial(selectedTile) && isSpecial(clicked))
      ) {
      // zapisz parę do cofania
		undoStack.push([selectedTile, clicked]);

		selectedTile.removed = true;
		clicked.removed = true;
		selectedTile = null;

		setStatus('Usunięto parę typu ' + clicked.tileType);
		checkWin();
  // 🔥 sprawdzamy, czy są jeszcze ruchy
  if (!hasAnyMoves()) {
    setStatus('Brak możliwych ruchów!');
  }
    } else {
      selectedTile = clicked;
      setStatus('Brak pary, wybrano typ ' + clicked.tileType);
    }
  }

  draw();
  hintPair = null;
  // 🔥 sprawdzamy po każdym kliknięciu
  if (!hasAnyMoves()) {
    setStatus('Brak możliwych ruchów!');
  }
}

function getTileAt(mx, my) {
  const candidates = tiles
    .filter(t => !t.removed)
    .sort((a, b) => b.z - a.z);

  for (const tile of candidates) {
    const { px, py } = logicalToPixel(tile);
    if (mx >= px && mx <= px + TILE_W &&
        my >= py && my <= py + TILE_H) {
      return tile;
    }
  }
  return null;
}

// logika „wolności” kafelka
function isTileFree(tile) {
  if (tile.removed) return false;

  // 1. czy coś jest na wierzchu?
  const onTop = tiles.some(t =>
    !t.removed &&
    t.z > tile.z &&
    Math.abs(t.x - tile.x) < 0.6 &&
    Math.abs(t.y - tile.y) < 0.6
  );
  if (onTop) return false;

  // 2. lewa/prawa strona
  const hasLeft = tiles.some(t =>
    !t.removed &&
    t.z === tile.z &&
    Math.abs(t.y - tile.y) < 0.6 &&
    t.x < tile.x &&
    Math.abs(t.x - tile.x) < 1.1
  );

  const hasRight = tiles.some(t =>
    !t.removed &&
    t.z === tile.z &&
    Math.abs(t.y - tile.y) < 0.6 &&
    t.x > tile.x &&
    Math.abs(t.x - tile.x) < 1.1
  );

  return !(hasLeft && hasRight);
}

function checkWin() {
  if (tiles.every(t => t.removed)) {
    setStatus('Wygrana! Wszystkie kafelki usunięte.');
    startConfetti(); 
  }
}

function hasLeftNeighbor(tile) {
  return tiles.some(t =>
    !t.removed &&
    t.z === tile.z &&
    Math.abs(t.y - tile.y) < 0.6 &&
    t.x === tile.x - 1
  );
}

/*function hasLeftNeighbor(tile) {
  return tiles.some(t =>
    !t.removed &&
    t.z === tile.z &&
    Math.abs(t.y - tile.y) < 0.6 &&
    Math.abs(t.x - (tile.x - 1)) < 0.01
  );
}*/

function hasRightNeighbor(tile) {
  return tiles.some(t =>
    !t.removed &&
    t.z === tile.z &&
    Math.abs(t.y - tile.y) < 0.6 &&
    t.x === tile.x + 1
  );
}

function hasTopNeighbor(tile) {
  return tiles.some(t =>
    !t.removed &&
    t.z === tile.z &&
    Math.abs(t.x - tile.x) < 0.6 &&
    t.y === tile.y - 1
  );
}

function hasBottomNeighbor(tile) {
  return tiles.some(t =>
    !t.removed &&
    t.z === tile.z &&
    Math.abs(t.x - tile.x) < 0.6 &&
    t.y === tile.y + 1
  );
}

function hasAnyMoves() {
  const freeTiles = tiles.filter(t => !t.removed && isTileFree(t));

  for (let i = 0; i < freeTiles.length; i++) {
    for (let j = i + 1; j < freeTiles.length; j++) {
      const a = freeTiles[i];
      const b = freeTiles[j];

      // identyczne typy
      if (a.tileType === b.tileType) return true;

      // specjalne kafelki każdy z każdym
      if (isSpecial(a) && isSpecial(b)) return true;
    }
  }

  return false;
}

function findHintPair() {
  const freeTiles = tiles.filter(t => !t.removed && isTileFree(t));

  for (let i = 0; i < freeTiles.length; i++) {
    for (let j = i + 1; j < freeTiles.length; j++) {
      const a = freeTiles[i];
      const b = freeTiles[j];

      if (a.tileType === b.tileType) {
        return [a, b];
      }

      if (isSpecial(a) && isSpecial(b)) {
        return [a, b];
      }
    }
  }

  return null;
}

function isFreePosition(pos, allPositions) {
  // wolna = brak sąsiada po lewej i brak po prawej na tej samej warstwie
  const left = allPositions.find(p => p.z === pos.z && p.y === pos.y && p.x === pos.x - 1);
  const right = allPositions.find(p => p.z === pos.z && p.y === pos.y && p.x === pos.x + 1);
  return !left || !right;
}

function reshuffleRemainingTiles() {
  // 1. zbierz typy wszystkich kafelków, które nie są usunięte
  const types = [];
  for (const t of tiles) {
    if (!t.removed) {
      types.push(t.tileType);
    }
  }

  // 2. potasuj typy
  shuffle(types);

  // 3. rozdaj potasowane typy z powrotem po nieusuniętych kafelkach
  let idx = 0;
  for (const t of tiles) {
    if (!t.removed) {
      t.tileType = types[idx++];
    }
  }

  // 4. wyczyść zaznaczenie i podpowiedź
  selectedTile = null;
  hintPair = null;

  // 5. odrysuj planszę
  draw();

  setStatus('Pozostałe kafelki zostały wymieszane.');
}

function undoLastMove() {
  if (undoStack.length === 0) {
    setStatus('Nie ma ruchu do cofnięcia.');
    return;
  }

  const [a, b] = undoStack.pop();

  a.removed = false;
  b.removed = false;

  selectedTile = null;
  hintPair = null;

  setStatus('Cofnięto ostatni ruch.');
  draw();
}

function startConfetti() {
    const confetti = [];
    const COUNT = 500;        
    const DURATION = 13000;   

    for (let i = 0; i < COUNT; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 100,
            size: 4 + Math.random() * 8,
            speed: 1 + Math.random() * 3,
            drift: -1.5 + Math.random() * 3,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: -0.15 + Math.random() * 0.3,
            flip: Math.random() * Math.PI,
            flipSpeed: 0.15 + Math.random() * 0.25,
            color: ['#e8e0c8','#dcd4b8','#c8e8d0','#f0e8d8'][Math.floor(Math.random()*4)],
            alpha: 0.7 + Math.random() * 0.3
        });
    }

    const start = performance.now();

    function animate(t) {
        const dt = t - start;
        if (dt > DURATION) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 🔥 rysujemy całą grę
        draw();

        // 🔥 rysujemy konfetti
        confetti.forEach(c => {
            c.y += c.speed;
            c.x += c.drift;
            c.rot += c.rotSpeed;
            c.flip += c.flipSpeed;

            const w = c.size * Math.abs(Math.cos(c.flip));
            const h = c.size;

            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);

            ctx.globalAlpha = c.alpha;
            ctx.fillStyle = c.color;

            ctx.beginPath();
            ctx.moveTo(0, -h/2);
            ctx.lineTo(w/2, h/2);
            ctx.lineTo(-w/2, h/2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        });

        // 🔥 NAPIS „Brawo! Udało się!”
        const fade = Math.min(1, dt / 800);           // fade-in 0–800 ms
        const fadeOut = Math.max(0, 1 - (dt - 3000) / 1500); // fade-out po 3s
        const alpha = Math.min(fade, fadeOut);

        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.fillStyle = "#f0e8d8";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText("Brawo! Udało się!", canvas.width / 2, canvas.height / 2);

        ctx.restore();

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

document.getElementById('btnShuffle').addEventListener('click', reshuffleRemainingTiles);

document.getElementById('btnUndo').addEventListener('click', undoLastMove);

document.getElementById('layoutSelect').addEventListener('change', e => {
  currentLayoutName = e.target.value;
  newGame();
});

document.getElementById('btnHint').addEventListener('click', () => {
  hintPair = findHintPair();
  if (!hintPair) {
    setStatus('Brak możliwych ruchów!');
  } else {
    setStatus('Podpowiedź: zaznaczono możliwą parę.');
  }
  draw();
});

