import React, { useState } from 'react';

const HexCell = ({ q, r, terrain, unit, section, isSelected, isMoveable, isAttackable, onClick, currentPlayer }) => {
  const size = 40;
  
  // Proper hex grid offset coordinates - flat-top hexagons
  const x = size * Math.sqrt(3) * (q + 0.5 * (r & 1));
  const y = size * 1.5 * r;
  
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
  }
  
  const terrainColors = {
    grass: '#9BC184',
    forest: '#6B8E5C',
    town: '#8B7355',
    hill: '#A89968',
    water: '#6B9BD1',
    beach: '#E8D4A0',
    hedge: '#556B2F'
  };
  
  // Section overlay colors (subtle tint)
  const sectionTints = {
    left: 'rgba(255, 100, 100, 0.15)',
    center: 'rgba(100, 255, 100, 0.15)',
    right: 'rgba(100, 100, 255, 0.15)'
  };
  
  // Add turn-based tint
  const isPlayerSide = (unit) => {
    // Determine which side of board based on r coordinate
    if (unit && unit.side === 'allies') return r < 5;
    if (unit && unit.side === 'axis') return r >= 5;
    return false;
  };
  
  let strokeColor = '#5a5a5a';
  let strokeWidth = 1;
  
  if (isSelected) {
    strokeColor = '#FFD700';
    strokeWidth = 3;
  } else if (isMoveable) {
    strokeColor = '#00FF00';
    strokeWidth = 2;
  } else if (isAttackable) {
    strokeColor = '#FF0000';
    strokeWidth = 2;
  }
  
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <polygon
        points={points.join(' ')}
        fill={terrainColors[terrain] || '#9BC184'}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={0.9}
      />
      {/* Section tint */}
      <polygon
        points={points.join(' ')}
        fill={sectionTints[section]}
        pointerEvents="none"
      />
      {/* Turn-based tint - highlight current player's side of board */}
      <polygon
        points={points.join(' ')}
        fill={currentPlayer === 'allies' ? (r < 5 ? 'rgba(65, 105, 225, 0.1)' : 'rgba(0, 0, 0, 0.2)') : (r >= 5 ? 'rgba(139, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.2)')}
        pointerEvents="none"
      />
      
      {/* Terrain Details */}
      {terrain === 'forest' && (
        <g>
          <circle cx={x - 10} cy={y - 8} r="6" fill="#2d4a2b" opacity="0.8" />
          <circle cx={x + 8} cy={y - 5} r="7" fill="#2d4a2b" opacity="0.8" />
          <circle cx={x} cy={y + 8} r="6" fill="#2d4a2b" opacity="0.8" />
          <rect x={x - 12} y={y - 3} width="3" height="8" fill="#4a2511" />
          <rect x={x + 6} y={y} width="3" height="8" fill="#4a2511" />
          <rect x={x - 2} y={y + 12} width="3" height="6" fill="#4a2511" />
        </g>
      )}
      
      {terrain === 'town' && (
        <g>
          <rect x={x - 12} y={y - 10} width="10" height="12" fill="#6b5d52" stroke="#4a4035" strokeWidth="1" />
          <rect x={x + 3} y={y - 8} width="8" height="10" fill="#7a6d62" stroke="#4a4035" strokeWidth="1" />
          <polygon points={`${x-12},${y-10} ${x-7},${y-16} ${x-2},${y-10}`} fill="#8B4513" />
          <polygon points={`${x+3},${y-8} ${x+7},${y-13} ${x+11},${y-8}`} fill="#8B4513" />
          <rect x={x - 9} y={y - 6} width="3" height="4" fill="#3a3a3a" />
          <rect x={x + 6} y={y - 4} width="2" height="3" fill="#3a3a3a" />
        </g>
      )}
      
      {terrain === 'hill' && (
        <g>
          <ellipse cx={x} cy={y} rx="25" ry="15" fill="none" stroke="#8a7a4a" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx={x} cy={y} rx="18" ry="11" fill="none" stroke="#8a7a4a" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx={x} cy={y} rx="11" ry="7" fill="none" stroke="#8a7a4a" strokeWidth="1.5" opacity="0.6" />
        </g>
      )}
      
      {terrain === 'beach' && (
        <g>
          <circle cx={x - 10} cy={y - 8} r="1.5" fill="#d4b896" opacity="0.6" />
          <circle cx={x + 12} cy={y - 5} r="1.5" fill="#d4b896" opacity="0.6" />
          <circle cx={x - 5} cy={y + 10} r="1.5" fill="#d4b896" opacity="0.6" />
          <circle cx={x + 8} cy={y + 8} r="1.5" fill="#d4b896" opacity="0.6" />
          <circle cx={x} cy={y - 12} r="1.5" fill="#d4b896" opacity="0.6" />
          <circle cx={x - 15} cy={y + 3} r="1.5" fill="#d4b896" opacity="0.6" />
          <path d={`M ${x-20} ${y+15} Q ${x-10} ${y+13} ${x} ${y+15} Q ${x+10} ${y+17} ${x+20} ${y+15}`} 
                fill="none" stroke="#5a8db8" strokeWidth="1.5" opacity="0.4" />
        </g>
      )}
      
      {terrain === 'hedge' && (
        <g>
          <rect x={x - 20} y={y - 3} width="40" height="6" fill="#4a5d2e" rx="3" opacity="0.8" />
          <circle cx={x - 15} cy={y} r="4" fill="#3d4f25" opacity="0.7" />
          <circle cx={x - 8} cy={y} r="4" fill="#3d4f25" opacity="0.7" />
          <circle cx={x} cy={y} r="4" fill="#3d4f25" opacity="0.7" />
          <circle cx={x + 8} cy={y} r="4" fill="#3d4f25" opacity="0.7" />
          <circle cx={x + 15} cy={y} r="4" fill="#3d4f25" opacity="0.7" />
        </g>
      )}
      
      {terrain === 'water' && (
        <g>
          <path d={`M ${x-25} ${y-5} Q ${x-15} ${y-7} ${x-5} ${y-5} Q ${x+5} ${y-3} ${x+15} ${y-5}`} 
                fill="none" stroke="#5a8db8" strokeWidth="1.5" opacity="0.4" />
          <path d={`M ${x-20} ${y+5} Q ${x-10} ${y+3} ${x} ${y+5} Q ${x+10} ${y+7} ${x+20} ${y+5}`} 
                fill="none" stroke="#5a8db8" strokeWidth="1.5" opacity="0.4" />
        </g>
      )}
      
      {isMoveable && (
        <circle cx={x} cy={y} r={8} fill="#00FF00" opacity={0.4} />
      )}
      {isAttackable && (
        <circle cx={x} cy={y} r={8} fill="#FF0000" opacity={0.4} />
      )}
      
      {unit && (
        <>
          <circle
            cx={x}
            cy={y}
            r={size * 0.6}
            fill={unit.side === 'allies' ? '#4169E1' : '#8B0000'}
            opacity={0.85}
          />
          
          {/* Unit Icons */}
          {unit.type === 'infantry' && (
            <g transform={`translate(${x}, ${y})`}>
              <circle cx="0" cy="-8" r="4" fill="white" />
              <rect x="-3" y="-4" width="6" height="10" fill="white" rx="1" />
              <line x1="-3" y1="-2" x2="-8" y2="2" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="-2" x2="8" y2="2" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="-2" y1="6" x2="-4" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="6" x2="4" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
          
          {unit.type === 'armor' && (
            <g transform={`translate(${x}, ${y})`}>
              <rect x="-10" y="-4" width="20" height="8" fill="white" rx="2" />
              <rect x="-6" y="-8" width="12" height="5" fill="white" rx="1" />
              <rect x="6" y="-2" width="6" height="4" fill="white" />
              <circle cx="-8" cy="4" r="2.5" fill="white" />
              <circle cx="-2" cy="4" r="2.5" fill="white" />
              <circle cx="4" cy="4" r="2.5" fill="white" />
              <circle cx="10" cy="4" r="2.5" fill="white" />
            </g>
          )}
          
          {unit.type === 'artillery' && (
            <g transform={`translate(${x}, ${y})`}>
              <rect x="-8" y="-2" width="16" height="4" fill="white" rx="1" />
              <rect x="4" y="-6" width="10" height="2" fill="white" transform="rotate(-20 9 -5)" />
              <circle cx="-6" cy="3" r="3" fill="white" />
              <circle cx="6" cy="3" r="3" fill="white" />
              <rect x="-2" y="-4" width="4" height="3" fill="white" />
            </g>
          )}
          
          <text
            x={x}
            y={y + size * 0.8}
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontWeight="bold"
            stroke="#000"
            strokeWidth="0.5"
          >
            {unit.strength}
          </text>
          {unit.hasMoved && (
            <text
              x={x}
              y={y - size * 0.7}
              textAnchor="middle"
              fill="yellow"
              fontSize="14"
              fontWeight="bold"
              stroke="#000"
              strokeWidth="0.5"
            >
              ✓
            </text>
          )}
        </>
      )}
    </g>
  );
};

const CommandCard = ({ card, isActive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-amber-50 border-4 rounded-lg p-3 cursor-pointer transition-all ${
        isActive ? 'border-yellow-500 shadow-lg scale-105' : 'border-amber-800'
      }`}
      style={{ width: '140px' }}
    >
      <div className="text-center font-bold text-sm mb-1">{card.name}</div>
      <div className="text-xs text-center text-gray-700">{card.description}</div>
      <div className="text-center mt-2 text-2xl font-bold text-blue-600">
        {card.units}
      </div>
    </div>
  );
};

const CombatLog = ({ log }) => {
  return (
    <div className="absolute top-40 right-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 max-w-xs max-h-64 overflow-y-auto">
      <h3 className="font-bold text-amber-100 mb-2">Combat Log</h3>
      <div className="space-y-1 text-xs text-slate-200">
        {log.map((entry, i) => (
          <div key={i} className="border-b border-slate-600 pb-1">{entry}</div>
        ))}
        {log.length === 0 && <div className="text-slate-400">No actions yet</div>}
      </div>
    </div>
  );
};

const Memoir44Game = () => {
  const [selectedHex, setSelectedHex] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [moveableHexes, setMoveableHexes] = useState([]);
  const [attackableHexes, setAttackableHexes] = useState([]);
  const [combatLog, setCombatLog] = useState([]);
  const [gameState, setGameState] = useState({
    board: initializeBoard(),
    currentPlayer: 'allies',
    phase: 'selectCard',
    cardsInHand: generateCommandCards(),
    unitsToActivate: 0
  });

  function getSection(q) {
    if (q < 4) return 'left';
    if (q < 9) return 'center';
    return 'right';
  }

  function initializeBoard() {
    const board = {};
    
    for (let q = 0; q < 13; q++) {
      for (let r = 0; r < 9; r++) {
        const key = `${q},${r}`;
        board[key] = {
          q, r,
          section: getSection(q),
          terrain: Math.random() > 0.6 ? 
            ['forest', 'hill', 'town', 'beach', 'hedge'][Math.floor(Math.random() * 5)] : 'grass',
          unit: null
        };
      }
    }
    
    // Place initial units
    board['2,2'].unit = { type: 'infantry', side: 'allies', strength: 4, hasMoved: false };
    board['3,2'].unit = { type: 'armor', side: 'allies', strength: 3, hasMoved: false };
    board['4,3'].unit = { type: 'artillery', side: 'allies', strength: 2, hasMoved: false };
    board['1,4'].unit = { type: 'infantry', side: 'allies', strength: 4, hasMoved: false };
    
    board['10,6'].unit = { type: 'infantry', side: 'axis', strength: 4, hasMoved: false };
    board['9,5'].unit = { type: 'armor', side: 'axis', strength: 3, hasMoved: false };
    board['8,6'].unit = { type: 'artillery', side: 'axis', strength: 2, hasMoved: false };
    board['11,5'].unit = { type: 'infantry', side: 'axis', strength: 4, hasMoved: false };
    
    return board;
  }

  function generateCommandCards() {
    return [
      { name: 'Probe Left', description: 'Activate 1 unit on left flank', units: 1, section: 'left' },
      { name: 'Attack Center', description: 'Activate 2 units in center', units: 2, section: 'center' },
      { name: 'Assault Right', description: 'Activate 3 units on right flank', units: 3, section: 'right' },
      { name: 'Pincer Movement', description: 'Activate 2 units on left or right', units: 2, section: 'flanks' },
      { name: 'General Advance', description: 'Activate 1 unit in any section', units: 1, section: 'any' }
    ];
  }

  function getNeighbors(q, r) {
    const neighbors = [];
    const offsets = r & 1 ? 
      [[1,0], [0,-1], [-1,-1], [-1,0], [-1,1], [0,1]] :
      [[1,0], [1,-1], [0,-1], [-1,0], [0,1], [1,1]];
    
    offsets.forEach(([dq, dr]) => {
      const nq = q + dq;
      const nr = r + dr;
      if (nq >= 0 && nq < 13 && nr >= 0 && nr < 9) {
        neighbors.push([nq, nr]);
      }
    });
    
    return neighbors;
  }

  function getDistance(q1, r1, q2, r2) {
    const x1 = q1;
    const z1 = r1 - (q1 - (q1 & 1)) / 2;
    const y1 = -x1 - z1;
    
    const x2 = q2;
    const z2 = r2 - (q2 - (q2 & 1)) / 2;
    const y2 = -x2 - z2;
    
    return (Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)) / 2;
  }

  function calculateMoveableHexes(q, r, unit) {
    const moveable = [];
    const maxRange = unit.type === 'infantry' ? 1 : unit.type === 'armor' ? 3 : 0;
    
    if (maxRange === 0) return moveable; // Artillery can't move
    
    // Use BFS to find reachable hexes considering terrain costs
    const visited = new Set();
    const queue = [{ q, r, movesLeft: maxRange }];
    visited.add(`${q},${r}`);
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // Get neighbors
      const neighbors = getNeighbors(current.q, current.r);
      
      for (const [nq, nr] of neighbors) {
        const key = `${nq},${nr}`;
        
        if (visited.has(key)) continue;
        
        const targetCell = gameState.board[key];
        if (!targetCell || targetCell.unit) continue; // Can't move onto units
        
        // Calculate movement cost
        const moveCost = getMovementCost(targetCell.terrain, unit.type);
        
        // Check if we have enough movement
        if (moveCost > current.movesLeft) continue;
        
        const remainingMoves = current.movesLeft - moveCost;
        
        // Add to moveable if we can reach it
        if (moveCost <= current.movesLeft) {
          moveable.push(key);
          visited.add(key);
          
          // Continue exploring from this hex if we have moves left
          if (remainingMoves > 0) {
            queue.push({ q: nq, r: nr, movesLeft: remainingMoves });
          }
        }
      }
    }
    
    return moveable;
  }

  function getMovementCost(terrain, unitType) {
    // Base movement costs
    const costs = {
      grass: 1,
      beach: 1,
      hill: 1,
      forest: 1,
      town: 1,
      hedge: 1,
      water: 999 // Impassable by default
    };
    
    // Infantry movement rules
    if (unitType === 'infantry') {
      costs.forest = 1;
      costs.town = 1;
      costs.hill = 1;
      costs.hedge = 1;
    }
    
    // Armor movement rules
    if (unitType === 'armor') {
      costs.forest = 2; // Costs 2 moves to enter forest
      costs.town = 2; // Costs 2 moves to enter town
      costs.hill = 2; // Costs 2 moves to go uphill
      costs.hedge = 1; // Can pass hedges
      costs.water = 999; // Cannot cross water
    }
    
    return costs[terrain] || 1;
  }

  function calculateAttackableHexes(q, r, unit) {
    const attackable = [];
    const range = unit.type === 'infantry' ? 1 : unit.type === 'armor' ? 3 : unit.type === 'artillery' ? 5 : 1;
    
    for (let tq = 0; tq < 13; tq++) {
      for (let tr = 0; tr < 9; tr++) {
        const key = `${tq},${tr}`;
        const distance = getDistance(q, r, tq, tr);
        const targetCell = gameState.board[key];
        
        if (distance <= range && distance > 0 && targetCell.unit && targetCell.unit.side !== unit.side) {
          // Check line of sight
          if (hasLineOfSight(q, r, tq, tr)) {
            attackable.push(key);
          }
        }
      }
    }
    
    return attackable;
  }

  function hasLineOfSight(fromQ, fromR, toQ, toR) {
    // Get all hexes along the line
    const line = getHexLine(fromQ, fromR, toQ, toR);
    
    // Check each hex in the line (except start and end)
    for (let i = 1; i < line.length - 1; i++) {
      const [hexQ, hexR] = line[i];
      const key = `${hexQ},${hexR}`;
      const cell = gameState.board[key];
      
      if (!cell) continue;
      
      // Blocking terrain
      if (cell.terrain === 'forest' || cell.terrain === 'town' || cell.terrain === 'hill') {
        return false;
      }
      
      // Units block LOS
      if (cell.unit) {
        return false;
      }
    }
    
    return true;
  }

  function getHexLine(fromQ, fromR, toQ, toR) {
    // Convert to cube coordinates
    const fromCube = offsetToCube(fromQ, fromR);
    const toCube = offsetToCube(toQ, toR);
    
    const distance = Math.round(getDistance(fromQ, fromR, toQ, toR));
    const results = [];
    
    for (let i = 0; i <= distance; i++) {
      const t = distance === 0 ? 0 : i / distance;
      const x = fromCube.x * (1 - t) + toCube.x * t;
      const y = fromCube.y * (1 - t) + toCube.y * t;
      const z = fromCube.z * (1 - t) + toCube.z * t;
      
      const rounded = cubeRound(x, y, z);
      const offset = cubeToOffset(rounded.x, rounded.y, rounded.z);
      results.push([offset.q, offset.r]);
    }
    
    return results;
  }

  function offsetToCube(q, r) {
    const x = q;
    const z = r - (q - (q & 1)) / 2;
    const y = -x - z;
    return { x, y, z };
  }

  function cubeToOffset(x, y, z) {
    const q = x;
    const r = z + (x - (x & 1)) / 2;
    return { q, r };
  }

  function cubeRound(x, y, z) {
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);
    
    const xDiff = Math.abs(rx - x);
    const yDiff = Math.abs(ry - y);
    const zDiff = Math.abs(rz - z);
    
    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry - rz;
    } else if (yDiff > zDiff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }
    
    return { x: rx, y: ry, z: rz };
  }

  function rollDice(numDice) {
    const results = [];
    for (let i = 0; i < numDice; i++) {
      results.push(Math.floor(Math.random() * 6) + 1);
    }
    return results;
  }

  function performCombat(attackerKey, defenderKey) {
    const attacker = gameState.board[attackerKey].unit;
    const defender = gameState.board[defenderKey].unit;
    const defenderTerrain = gameState.board[defenderKey].terrain;
    
    const numDice = attacker.strength;
    const dice = rollDice(numDice);
    
    let hits = 0;
    dice.forEach(roll => {
      if (defender.type === 'infantry' && roll >= 4) hits++;
      if (defender.type === 'armor' && roll >= 5) hits++;
      if (defender.type === 'artillery' && roll >= 5) hits++;
    });
    
    // Terrain defense bonus
    if (defenderTerrain === 'forest' || defenderTerrain === 'town') {
      hits = Math.max(0, hits - 1);
    }
    
    const logEntry = `${attacker.side} ${attacker.type} attacks ${defender.side} ${defender.type}: rolled [${dice.join(',')}] = ${hits} hits`;
    setCombatLog(prev => [logEntry, ...prev].slice(0, 10));
    
    const newBoard = { ...gameState.board };
    newBoard[defenderKey].unit.strength -= hits;
    
    if (newBoard[defenderKey].unit.strength <= 0) {
      newBoard[defenderKey].unit = null;
      setCombatLog(prev => [`${defender.side} ${defender.type} destroyed!`, ...prev].slice(0, 10));
    }
    
    setGameState(prev => ({ ...prev, board: newBoard }));
  }

  const handleHexClick = (q, r) => {
    const key = `${q},${r}`;
    const clickedCell = gameState.board[key];
    
    if (gameState.phase === 'selectCard') {
      setCombatLog(prev => ['Select a command card first!', ...prev].slice(0, 10));
      return;
    }
    
    // Check if unit is in valid section for selected card
    const selectedCardData = gameState.cardsInHand[selectedCard];
    const unitSection = clickedCell.section;
    
    if (clickedCell.unit && clickedCell.unit.side === gameState.currentPlayer && !clickedCell.unit.hasMoved) {
      // Validate section
      let validSection = false;
      if (selectedCardData.section === 'any') {
        validSection = true;
      } else if (selectedCardData.section === 'flanks' && (unitSection === 'left' || unitSection === 'right')) {
        validSection = true;
      } else if (selectedCardData.section === unitSection) {
        validSection = true;
      }
      
      if (!validSection) {
        setCombatLog(prev => [`Cannot activate unit in ${unitSection} section with this card!`, ...prev].slice(0, 10));
        return;
      }
    }
    
    // If clicking a moveable hex, move the selected unit
    if (moveableHexes.includes(key)) {
      const newBoard = { ...gameState.board };
      newBoard[key].unit = { ...newBoard[selectedHex].unit, hasMoved: true };
      newBoard[selectedHex].unit = null;
      
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        unitsToActivate: prev.unitsToActivate - 1
      }));
      
      setCombatLog(prev => [`Unit moved to (${q},${r})`, ...prev].slice(0, 10));
      
      // Check if can attack after move
      const attackable = calculateAttackableHexes(q, r, newBoard[key].unit);
      setSelectedHex(key);
      setMoveableHexes([]);
      setAttackableHexes(attackable);
      return;
    }
    
    // If clicking an attackable hex, perform combat
    if (attackableHexes.includes(key)) {
      performCombat(selectedHex, key);
      setSelectedHex(null);
      setMoveableHexes([]);
      setAttackableHexes([]);
      
      setGameState(prev => ({
        ...prev,
        unitsToActivate: prev.unitsToActivate - 1
      }));
      return;
    }
    
    // If clicking own unit, select it
    if (clickedCell.unit && clickedCell.unit.side === gameState.currentPlayer && !clickedCell.unit.hasMoved) {
      setSelectedHex(key);
      const moveable = calculateMoveableHexes(q, r, clickedCell.unit);
      const attackable = calculateAttackableHexes(q, r, clickedCell.unit);
      setMoveableHexes(moveable);
      setAttackableHexes(attackable);
    } else {
      setSelectedHex(null);
      setMoveableHexes([]);
      setAttackableHexes([]);
    }
  };

  const handleCardClick = (index) => {
    const card = gameState.cardsInHand[index];
    setSelectedCard(index);
    setGameState(prev => ({
      ...prev,
      phase: 'playUnits',
      unitsToActivate: card.units
    }));
    setCombatLog(prev => [`Played: ${card.name}`, ...prev].slice(0, 10));
  };

  const endTurn = () => {
    const newBoard = { ...gameState.board };
    Object.values(newBoard).forEach(cell => {
      if (cell.unit) {
        cell.unit.hasMoved = false;
      }
    });
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'allies' ? 'axis' : 'allies',
      phase: 'selectCard',
      unitsToActivate: 0
    }));
    
    setSelectedCard(null);
    setSelectedHex(null);
    setMoveableHexes([]);
    setAttackableHexes([]);
    setCombatLog(prev => ['Turn ended', ...prev].slice(0, 10));
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-slate-700 to-slate-900 relative overflow-hidden">
      {/* Header overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-2xl px-8 py-4">
        <h1 className="text-4xl font-bold text-center text-amber-100 mb-1">
          MEMOIR '44
        </h1>
        <p className="text-center text-slate-300 text-sm">Stage 2: Game Rules & Mechanics</p>
      </div>
      
      {/* Game info overlay */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 bg-slate-100/90 backdrop-blur-sm rounded-lg shadow-xl px-6 py-3">
        <div className="flex gap-8 text-sm items-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span className="font-semibold">Allies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-800 rounded-full"></div>
            <span className="font-semibold">Axis</span>
          </div>
          <div className="border-l-2 border-slate-300 pl-4">
            <span className="text-slate-600">Current: </span>
            <span className={`font-bold ${gameState.currentPlayer === 'allies' ? 'text-blue-600' : 'text-red-800'}`}>
              {gameState.currentPlayer.toUpperCase()}
            </span>
          </div>
          <div className="border-l-2 border-slate-300 pl-4">
            <span className="text-slate-600">Units to activate: </span>
            <span className="font-bold">{gameState.unitsToActivate}</span>
          </div>
          <button 
            onClick={endTurn}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-4 rounded ml-4"
          >
            End Turn
          </button>
        </div>
      </div>

      {/* Combat Log */}
      <CombatLog log={combatLog} />
      
      {/* Command Cards */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
        {gameState.cardsInHand.map((card, i) => (
          <CommandCard 
            key={i} 
            card={card} 
            isActive={selectedCard === i}
            onClick={() => handleCardClick(i)}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-3 text-xs text-slate-200">
        <div className="font-bold text-amber-100 mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-green-500"></div>
            <span>Moveable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-red-500"></div>
            <span>Attackable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-yellow-500"></div>
            <span>Selected</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-600">
          <div className="font-bold text-amber-100 mb-1">Sections</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-300"></div>
            <span>Left Flank</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-300"></div>
            <span>Center</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-300"></div>
            <span>Right Flank</span>
          