import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const HexCell = ({ q, r, terrain, unit, section, isSelected, isMoveable, isAttackable, onClick }) => {
    const size = 40;
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

    const sectionTints = {
        left: 'rgba(255, 100, 100, 0.05)',
        center: 'rgba(100, 255, 100, 0.05)',
        right: 'rgba(100, 100, 255, 0.05)'
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
            <polygon
                points={points.join(' ')}
                fill={sectionTints[section]}
                pointerEvents="none"
            />

            {terrain === 'forest' && (
                <g>
                    <circle cx={x - 10} cy={y - 8} r="6" fill="#2d4a2b" opacity="0.8" />
                    <circle cx={x + 8} cy={y - 5} r="7" fill="#2d4a2b" opacity="0.8" />
                    <circle cx={x} cy={y + 8} r="6" fill="#2d4a2b" opacity="0.8" />
                </g>
            )}

            {terrain === 'town' && (
                <g>
                    <rect x={x - 12} y={y - 10} width="10" height="12" fill="#6b5d52" />
                    <rect x={x + 3} y={y - 8} width="8" height="10" fill="#7a6d62" />
                </g>
            )}

            {isMoveable && <circle cx={x} cy={y} r={8} fill="#00FF00" opacity={0.4} />}
            {isAttackable && <circle cx={x} cy={y} r={8} fill="#FF0000" opacity={0.4} />}

            {unit && (
                <>
                    <circle
                        cx={x}
                        cy={y}
                        r={size * 0.6}
                        fill={unit.side === 'allies' ? '#4169E1' : '#8B0000'}
                        opacity={0.85}
                    />

                    {unit.type === 'infantry' && (
                        <g transform={`translate(${x}, ${y})`}>
                            <circle cx="0" cy="-8" r="4" fill="white" />
                            <rect x="-3" y="-4" width="6" height="10" fill="white" rx="1" />
                        </g>
                    )}

                    {unit.type === 'armor' && (
                        <g transform={`translate(${x}, ${y})`}>
                            <rect x="-10" y="-4" width="20" height="8" fill="white" rx="2" />
                            <rect x="-6" y="-8" width="12" height="5" fill="white" rx="1" />
                        </g>
                    )}

                    {unit.type === 'artillery' && (
                        <g transform={`translate(${x}, ${y})`}>
                            <rect x="-8" y="-2" width="16" height="4" fill="white" rx="1" />
                            <circle cx="-6" cy="3" r="3" fill="white" />
                            <circle cx="6" cy="3" r="3" fill="white" />
                        </g>
                    )}

                    <text
                        x={x}
                        y={y + size * 0.8}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="bold"
                    >
                        {unit.strength}
                    </text>
                    {unit.hasMoved && (
                        <text x={x} y={y - size * 0.7} textAnchor="middle" fill="yellow" fontSize="14" fontWeight="bold">
                            ✓
                        </text>
                    )}
                </>
            )}
        </g>
    );
};

const CommandCard = ({ card, isActive, onClick, disabled }) => {
    return (
        <div
            onClick={disabled ? null : onClick}
            className={`bg-amber-50 border-4 rounded-lg p-3 transition-all ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${isActive ? 'border-yellow-500 shadow-lg scale-105' : 'border-amber-800'}`}
            style={{ width: '140px' }}
        >
            <div className="text-center font-bold text-sm mb-1">{card.name}</div>
            <div className="text-xs text-center text-gray-700">{card.description}</div>
            <div className="text-center mt-2 text-2xl font-bold text-blue-600">{card.units}</div>
        </div>
    );
};

const Memoir44Game = () => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [gameFound, setGameFound] = useState(false);
    const [playerSide, setPlayerSide] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [selectedHex, setSelectedHex] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [moveableHexes, setMoveableHexes] = useState([]);
    const [attackableHexes, setAttackableHexes] = useState([]);
    const [status, setStatus] = useState('Disconnected');
    const [hoveredSection, setHoveredSection] = useState(null);
    const [scenarios, setScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState('pegasus-bridge');

    useEffect(() => {
        // Fetch scenarios
        fetch('http://localhost:3001/api/scenarios')
            .then(res => res.json())
            .then(data => setScenarios(data))
            .catch(err => console.error('Failed to fetch scenarios:', err));

        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnected(true);
            setStatus('Connected - Click "Find Game" to start');
        });

        newSocket.on('waiting', () => {
            setStatus('Waiting for opponent...');
        });

        newSocket.on('gameFound', ({ side }) => {
            setGameFound(true);
            setPlayerSide(side);
            setStatus(`Game found! You are ${side.toUpperCase()}`);
        });

        newSocket.on('gameState', (state) => {
            setGameState(state);
        });

        newSocket.on('error', ({ message }) => {
            alert(message);
        });

        newSocket.on('opponentDisconnected', () => {
            alert('Opponent disconnected!');
            setGameFound(false);
            setStatus('Opponent disconnected - Find new game');
        });

        return () => newSocket.close();
    }, []);

    const findGame = () => {
        if (socket) {
            socket.emit('findGame', { scenarioId: selectedScenario });
        }
    };

    const getDistance = (q1, r1, q2, r2) => {
        const x1 = q1;
        const z1 = r1 - (q1 - (q1 & 1)) / 2;
        const y1 = -x1 - z1;

        const x2 = q2;
        const z2 = r2 - (q2 - (q2 & 1)) / 2;
        const y2 = -x2 - z2;

        return (Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)) / 2;
    };

    const calculateMoveableHexes = (q, r, unit) => {
        if (!gameState) return [];

        const moveable = [];
        const range = unit.type === 'infantry' ? 1 : unit.type === 'armor' ? 3 : 0;

        for (let tq = 0; tq < 13; tq++) {
            for (let tr = 0; tr < 9; tr++) {
                const key = `${tq},${tr}`;
                const distance = getDistance(q, r, tq, tr);
                const targetCell = gameState.board[key];

                if (distance <= range && distance > 0 && !targetCell.unit) {
                    moveable.push(key);
                }
            }
        }

        return moveable;
    };

    const calculateAttackableHexes = (q, r, unit) => {
        if (!gameState) return [];

        const attackable = [];
        const range = unit.type === 'infantry' ? 1 : unit.type === 'armor' ? 3 : unit.type === 'artillery' ? 5 : 1;

        for (let tq = 0; tq < 13; tq++) {
            for (let tr = 0; tr < 9; tr++) {
                const key = `${tq},${tr}`;
                const distance = getDistance(q, r, tq, tr);
                const targetCell = gameState.board[key];

                if (distance <= range && distance > 0 && targetCell.unit && targetCell.unit.side !== unit.side) {
                    attackable.push(key);
                }
            }
        }

        return attackable;
    };

    const handleHexClick = (q, r) => {
        if (!gameState || gameState.currentPlayer !== playerSide) return;

        const key = `${q},${r}`;
        const clickedCell = gameState.board[key];

        if (gameState.phase === 'selectCard') {
            alert('Select a command card first!');
            return;
        }

        // Move to a moveable hex
        if (moveableHexes.includes(key)) {
            socket.emit('moveUnit', { from: selectedHex, to: key });

            const movedUnit = gameState.board[selectedHex].unit;
            const attackable = calculateAttackableHexes(q, r, movedUnit);
            setSelectedHex(key);
            setMoveableHexes([]);
            setAttackableHexes(attackable);
            return;
        }

        // Attack an attackable hex
        if (attackableHexes.includes(key)) {
            socket.emit('attack', { from: selectedHex, to: key });
            setSelectedHex(null);
            setMoveableHexes([]);
            setAttackableHexes([]);
            return;
        }

        // Select own unit
        if (clickedCell.unit && clickedCell.unit.side === playerSide && !clickedCell.unit.hasMoved) {
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
        if (gameState.currentPlayer !== playerSide) return;
        if (gameState.phase !== 'selectCard') return;

        setSelectedCard(index);
        socket.emit('playCard', { cardIndex: index });
    };

    const endTurn = () => {
        socket.emit('endTurn');
        setSelectedCard(null);
        setSelectedHex(null);
        setMoveableHexes([]);
        setAttackableHexes([]);
    };

    if (!connected) {
        return (
            <div className="w-screen h-screen bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center">
                <div className="text-white text-2xl">Connecting to server...</div>
            </div>
        );
    }

    if (!gameFound) {
        return (
            <div className="w-screen h-screen bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center">
                <div className="bg-slate-800 rounded-lg p-8 text-center max-w-2xl">
                    <h1 className="text-4xl font-bold text-amber-100 mb-4">MEMOIR '44</h1>
                    <p className="text-slate-300 mb-6">{status}</p>

                    <div className="mb-6">
                        <h3 className="text-amber-100 font-bold mb-3">Select Scenario:</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {scenarios.map(scenario => (
                                <div
                                    key={scenario.id}
                                    onClick={() => setSelectedScenario(scenario.id)}
                                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                                        selectedScenario === scenario.id
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                                >
                                    <div className="font-bold mb-1">{scenario.name}</div>
                                    <div className="text-xs opacity-80">{scenario.description}</div>
                                    <div className="text-xs mt-2">Victory: {scenario.victoryPoints} pts</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={findGame}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg text-xl"
                    >
                        Find Game
                    </button>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="w-screen h-screen bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center">
                <div className="text-white text-2xl">Loading game...</div>
            </div>
        );
    }

    const isMyTurn = gameState.currentPlayer === playerSide;

    const getSectionForHex = (q) => {
        if (q < 4) return 'left';
        if (q < 9) return 'center';
        return 'right';
    };

    const getSectionTint = (section) => {
        if (!hoveredSection || hoveredSection !== section) return 'transparent';

        const tints = {
            left: 'rgba(255, 100, 100, 0.15)',
            center: 'rgba(100, 255, 100, 0.15)',
            right: 'rgba(100, 100, 255, 0.15)'
        };
        return tints[section];
    };

    return (
        <div className="w-screen h-screen bg-gradient-to-b from-slate-700 to-slate-900 relative overflow-hidden">
            {/* Not your turn overlay */}
            {!isMyTurn && (
                <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-800/95 backdrop-blur-sm px-12 py-6 rounded-lg shadow-2xl">
                        <div className="text-4xl font-bold text-amber-100">OPPONENT'S TURN</div>
                        <div className="text-slate-300 text-center mt-2">Please wait...</div>
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-2xl px-8 py-4">
                <h1 className="text-4xl font-bold text-center text-amber-100 mb-1">MEMOIR '44</h1>
                <p className="text-center text-slate-300 text-sm">
                    {gameState?.scenarioName} - You are {playerSide?.toUpperCase()}
                </p>
            </div>

            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 bg-slate-100/90 backdrop-blur-sm rounded-lg shadow-xl px-6 py-3">
                <div className="flex gap-8 text-sm items-center">
                    <div>
                        <span className="text-slate-600">Current: </span>
                        <span className={`font-bold ${gameState.currentPlayer === 'allies' ? 'text-blue-600' : 'text-red-800'}`}>
                            {gameState.currentPlayer.toUpperCase()}
                        </span>
                        {isMyTurn && <span className="ml-2 text-green-600 font-bold">YOUR TURN</span>}
                    </div>
                    <div className="border-l-2 border-slate-300 pl-4">
                        <span className="text-slate-600">Units to activate: </span>
                        <span className="font-bold">{gameState.unitsToActivate}</span>
                    </div>
                    <div className="border-l-2 border-slate-300 pl-4">
                        <span className="text-slate-600">Score: </span>
                        <span className="font-bold text-blue-600">{gameState.scores.allies}</span>
                        <span className="mx-1">-</span>
                        <span className="font-bold text-red-800">{gameState.scores.axis}</span>
                    </div>
                    <button
                        onClick={endTurn}
                        disabled={!isMyTurn}
                        className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-bold py-1 px-4 rounded ml-4"
                    >
                        End Turn
                    </button>
                </div>
            </div>

            <div className="absolute top-40 right-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 max-w-xs max-h-64 overflow-y-auto">
                <h3 className="font-bold text-amber-100 mb-2">Combat Log</h3>
                <div className="space-y-1 text-xs text-slate-200">
                    {gameState.combatLog.map((entry, i) => (
                        <div key={i} className="border-b border-slate-600 pb-1">{entry}</div>
                    ))}
                    {gameState.combatLog.length === 0 && <div className="text-slate-400">No actions yet</div>}
                </div>
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
                {gameState.cardsInHand.map((card, i) => (
                    <div
                        key={i}
                        onMouseEnter={() => {
                            if (card.section === 'any') return;
                            if (card.section === 'flanks') {
                                setHoveredSection('flanks');
                            } else {
                                setHoveredSection(card.section);
                            }
                        }}
                        onMouseLeave={() => setHoveredSection(null)}
                    >
                        <CommandCard
                            card={card}
                            isActive={selectedCard === i}
                            onClick={() => handleCardClick(i)}
                            disabled={!isMyTurn || gameState.phase !== 'selectCard'}
                        />
                    </div>
                ))}
            </div>

            <div className="w-full h-full flex items-center justify-center pt-32 pb-20">
                <svg width="95%" height="95%" viewBox="-50 -50 900 650" preserveAspectRatio="xMidYMid meet">
                    {/* Section overlay tints */}
                    {(hoveredSection === 'left' || hoveredSection === 'flanks') && (
                        <rect x="-50" y="-50" width="400" height="700" fill={getSectionTint('left')} pointerEvents="none" />
                    )}
                    {hoveredSection === 'center' && (
                        <rect x="300" y="-50" width="350" height="700" fill={getSectionTint('center')} pointerEvents="none" />
                    )}
                    {(hoveredSection === 'right' || hoveredSection === 'flanks') && (
                        <rect x="600" y="-50" width="400" height="700" fill={getSectionTint('right')} pointerEvents="none" />
                    )}

                    {Object.values(gameState.board).map(cell => (
                        <HexCell
                            key={`${cell.q},${cell.r}`}
                            q={cell.q}
                            r={cell.r}
                            terrain={cell.terrain}
                            unit={cell.unit}
                            section={cell.section}
                            isSelected={selectedHex === `${cell.q},${cell.r}`}
                            isMoveable={moveableHexes.includes(`${cell.q},${cell.r}`)}
                            isAttackable={attackableHexes.includes(`${cell.q},${cell.r}`)}
                            onClick={() => handleHexClick(cell.q, cell.r)}
                        />
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default Memoir44Game;