// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Game state management
const games = new Map();
const waitingPlayers = [];

// Scenarios
const scenarios = {
    'pegasus-bridge': {
        name: 'Pegasus Bridge',
        description: 'D-Day, June 6, 1944 - British airborne assault',
        board: {
            terrain: {
                '6,4': 'water', '6,5': 'water', '6,6': 'water',
                '7,4': 'beach', '7,5': 'beach', '7,6': 'beach',
                '4,3': 'town', '9,5': 'town',
                '2,2': 'forest', '3,3': 'forest', '10,6': 'forest'
            },
            allies: [
                { pos: '2,2', type: 'infantry', strength: 4 },
                { pos: '3,2', type: 'infantry', strength: 4 },
                { pos: '4,3', type: 'infantry', strength: 3 },
                { pos: '1,4', type: 'armor', strength: 3 }
            ],
            axis: [
                { pos: '10,6', type: 'infantry', strength: 4 },
                { pos: '9,5', type: 'infantry', strength: 3 },
                { pos: '8,6', type: 'artillery', strength: 2 },
                { pos: '11,5', type: 'infantry', strength: 4 }
            ]
        },
        victoryPoints: 6
    },
    'omaha-beach': {
        name: 'Omaha Beach',
        description: 'D-Day, June 6, 1944 - American beach assault',
        board: {
            terrain: {
                '0,0': 'water', '0,1': 'water', '0,2': 'water', '0,3': 'water',
                '1,0': 'water', '1,1': 'water', '1,2': 'water', '1,3': 'water',
                '2,0': 'beach', '2,1': 'beach', '2,2': 'beach', '2,3': 'beach',
                '3,0': 'beach', '3,1': 'beach', '3,2': 'beach', '3,3': 'beach',
                '8,4': 'hill', '9,4': 'hill', '10,5': 'hill',
                '11,6': 'town', '11,7': 'town'
            },
            allies: [
                { pos: '2,1', type: 'infantry', strength: 4 },
                { pos: '2,2', type: 'infantry', strength: 4 },
                { pos: '3,1', type: 'infantry', strength: 3 },
                { pos: '3,3', type: 'infantry', strength: 4 },
                { pos: '2,4', type: 'infantry', strength: 3 }
            ],
            axis: [
                { pos: '10,5', type: 'infantry', strength: 4 },
                { pos: '9,4', type: 'infantry', strength: 3 },
                { pos: '11,6', type: 'artillery', strength: 2 },
                { pos: '8,5', type: 'infantry', strength: 3 }
            ]
        },
        victoryPoints: 6
    },
    'hedgerow-hell': {
        name: 'Hedgerow Hell',
        description: 'Normandy, June 1944 - Fighting in the bocage',
        board: {
            terrain: {
                '2,2': 'hedge', '2,3': 'hedge', '2,4': 'hedge',
                '5,3': 'hedge', '5,4': 'hedge', '5,5': 'hedge',
                '8,4': 'hedge', '8,5': 'hedge', '8,6': 'hedge',
                '3,3': 'forest', '4,2': 'forest', '9,5': 'forest', '10,6': 'forest',
                '6,4': 'town'
            },
            allies: [
                { pos: '1,2', type: 'infantry', strength: 4 },
                { pos: '2,1', type: 'infantry', strength: 4 },
                { pos: '3,2', type: 'armor', strength: 3 },
                { pos: '4,3', type: 'infantry', strength: 3 }
            ],
            axis: [
                { pos: '11,6', type: 'infantry', strength: 4 },
                { pos: '10,5', type: 'infantry', strength: 4 },
                { pos: '9,6', type: 'armor', strength: 3 },
                { pos: '8,5', type: 'artillery', strength: 2 }
            ]
        },
        victoryPoints: 5
    },
    'random': {
        name: 'Random Encounter',
        description: 'Randomly generated battlefield',
        board: 'random',
        victoryPoints: 5
    }
};

class GameSession {
    constructor(gameId, player1Socket, player2Socket, scenarioId = 'pegasus-bridge') {
        this.gameId = gameId;
        this.scenarioId = scenarioId;
        this.players = {
            allies: { socket: player1Socket, id: player1Socket.id },
            axis: { socket: player2Socket, id: player2Socket.id }
        };
        this.state = this.initializeGameState();
    }

    initializeGameState() {
        const board = this.initializeBoard();
        const scenario = scenarios[this.scenarioId];

        return {
            board,
            currentPlayer: 'allies',
            phase: 'selectCard',
            cardsInHand: {
                allies: this.generateCommandCards(),
                axis: this.generateCommandCards()
            },
            unitsToActivate: 0,
            scores: { allies: 0, axis: 0 },
            combatLog: [],
            scenarioName: scenario.name,
            victoryPoints: scenario.victoryPoints
        };
    }

    getSection(q) {
        if (q < 4) return 'left';
        if (q < 9) return 'center';
        return 'right';
    }

    initializeBoard() {
        const board = {};
        const scenario = scenarios[this.scenarioId];

        // Create base board
        for (let q = 0; q < 13; q++) {
            for (let r = 0; r < 9; r++) {
                const key = `${q},${r}`;
                board[key] = {
                    q, r,
                    section: this.getSection(q),
                    terrain: 'grass',
                    unit: null
                };
            }
        }

        // Apply scenario terrain or random terrain
        if (scenario.board === 'random') {
            for (let q = 0; q < 13; q++) {
                for (let r = 0; r < 9; r++) {
                    const key = `${q},${r}`;
                    if (Math.random() > 0.6) {
                        board[key].terrain = ['forest', 'hill', 'town', 'beach', 'hedge'][Math.floor(Math.random() * 5)];
                    }
                }
            }
        } else {
            // Apply scenario-specific terrain
            if (scenario.board.terrain) {
                Object.entries(scenario.board.terrain).forEach(([key, terrain]) => {
                    if (board[key]) {
                        board[key].terrain = terrain;
                    }
                });
            }
        }

        // Place units from scenario
        if (scenario.board !== 'random') {
            scenario.board.allies.forEach(unit => {
                if (board[unit.pos]) {
                    board[unit.pos].unit = {
                        type: unit.type,
                        side: 'allies',
                        strength: unit.strength,
                        hasMoved: false
                    };
                }
            });

            scenario.board.axis.forEach(unit => {
                if (board[unit.pos]) {
                    board[unit.pos].unit = {
                        type: unit.type,
                        side: 'axis',
                        strength: unit.strength,
                        hasMoved: false
                    };
                }
            });
        } else {
            // Random unit placement for random scenario
            board['2,2'].unit = { type: 'infantry', side: 'allies', strength: 4, hasMoved: false };
            board['3,2'].unit = { type: 'armor', side: 'allies', strength: 3, hasMoved: false };
            board['4,3'].unit = { type: 'artillery', side: 'allies', strength: 2, hasMoved: false };
            board['1,4'].unit = { type: 'infantry', side: 'allies', strength: 4, hasMoved: false };

            board['10,6'].unit = { type: 'infantry', side: 'axis', strength: 4, hasMoved: false };
            board['9,5'].unit = { type: 'armor', side: 'axis', strength: 3, hasMoved: false };
            board['8,6'].unit = { type: 'artillery', side: 'axis', strength: 2, hasMoved: false };
            board['11,5'].unit = { type: 'infantry', side: 'axis', strength: 4, hasMoved: false };
        }

        return board;
    }

    generateCommandCards() {
        const allCards = [
            { name: 'Probe Left', description: 'Activate 1 unit on left flank', units: 1, section: 'left' },
            { name: 'Attack Center', description: 'Activate 2 units in center', units: 2, section: 'center' },
            { name: 'Assault Right', description: 'Activate 3 units on right flank', units: 3, section: 'right' },
            { name: 'Pincer Movement', description: 'Activate 2 units on left or right', units: 2, section: 'flanks' },
            { name: 'General Advance', description: 'Activate 1 unit in any section', units: 1, section: 'any' },
            { name: 'Concentrated Fire', description: 'Activate 3 units in center', units: 3, section: 'center' },
            { name: 'Recon', description: 'Activate 2 units in any section', units: 2, section: 'any' }
        ];

        // Randomly select 5 cards
        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5);
    }

    broadcastState() {
        const alliesSocket = this.players.allies.socket;
        const axisSocket = this.players.axis.socket;

        // Send full state to allies player
        alliesSocket.emit('gameState', {
            ...this.state,
            playerSide: 'allies',
            cardsInHand: this.state.cardsInHand.allies,
            opponentCardCount: this.state.cardsInHand.axis.length
        });

        // Send full state to axis player
        axisSocket.emit('gameState', {
            ...this.state,
            playerSide: 'axis',
            cardsInHand: this.state.cardsInHand.axis,
            opponentCardCount: this.state.cardsInHand.allies.length
        });
    }

    addCombatLog(message) {
        this.state.combatLog = [message, ...this.state.combatLog].slice(0, 20);
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('findGame', ({ scenarioId = 'pegasus-bridge' } = {}) => {
        console.log('Player looking for game:', socket.id, 'Scenario:', scenarioId);

        if (waitingPlayers.length > 0) {
            // Match with waiting player
            const opponent = waitingPlayers.shift();
            const gameId = `game_${Date.now()}`;

            const game = new GameSession(gameId, opponent, socket, scenarioId);
            games.set(gameId, game);

            // Assign players to game room
            opponent.join(gameId);
            socket.join(gameId);

            opponent.gameId = gameId;
            socket.gameId = gameId;

            // Notify both players
            opponent.emit('gameFound', { gameId, side: 'allies' });
            socket.emit('gameFound', { gameId, side: 'axis' });

            // Send initial game state
            game.broadcastState();

            console.log('Game created:', gameId);
        } else {
            // Add to waiting list
            waitingPlayers.push(socket);
            socket.emit('waiting');
            console.log('Player added to waiting list');
        }
    });

    socket.on('playCard', ({ cardIndex }) => {
        const game = games.get(socket.gameId);
        if (!game) return;

        const playerSide = game.players.allies.id === socket.id ? 'allies' : 'axis';

        if (game.state.currentPlayer !== playerSide) {
            socket.emit('error', { message: 'Not your turn!' });
            return;
        }

        if (game.state.phase !== 'selectCard') {
            socket.emit('error', { message: 'Card already selected!' });
            return;
        }

        const card = game.state.cardsInHand[playerSide][cardIndex];
        game.state.phase = 'playUnits';
        game.state.unitsToActivate = card.units;
        game.state.selectedCard = card;

        game.addCombatLog(`${playerSide} played: ${card.name}`);
        game.broadcastState();
    });

    socket.on('moveUnit', ({ from, to }) => {
        const game = games.get(socket.gameId);
        if (!game) return;

        const playerSide = game.players.allies.id === socket.id ? 'allies' : 'axis';

        if (game.state.currentPlayer !== playerSide) {
            socket.emit('error', { message: 'Not your turn!' });
            return;
        }

        const fromCell = game.state.board[from];
        const toCell = game.state.board[to];

        if (!fromCell.unit || fromCell.unit.side !== playerSide) {
            socket.emit('error', { message: 'Invalid unit!' });
            return;
        }

        // Move unit
        toCell.unit = { ...fromCell.unit, hasMoved: true };
        fromCell.unit = null;

        game.state.unitsToActivate--;
        game.addCombatLog(`${playerSide} moved unit to ${to}`);
        game.broadcastState();
    });

    socket.on('attack', ({ from, to }) => {
        const game = games.get(socket.gameId);
        if (!game) return;

        const playerSide = game.players.allies.id === socket.id ? 'allies' : 'axis';

        if (game.state.currentPlayer !== playerSide) {
            socket.emit('error', { message: 'Not your turn!' });
            return;
        }

        const attackerCell = game.state.board[from];
        const defenderCell = game.state.board[to];

        if (!attackerCell.unit || !defenderCell.unit) {
            socket.emit('error', { message: 'Invalid attack!' });
            return;
        }

        // Perform combat
        const attacker = attackerCell.unit;
        const defender = defenderCell.unit;
        const numDice = attacker.strength;
        const dice = [];

        for (let i = 0; i < numDice; i++) {
            dice.push(Math.floor(Math.random() * 6) + 1);
        }

        let hits = 0;
        dice.forEach(roll => {
            if (defender.type === 'infantry' && roll >= 4) hits++;
            if (defender.type === 'armor' && roll >= 5) hits++;
            if (defender.type === 'artillery' && roll >= 5) hits++;
        });

        // Terrain defense
        if (defenderCell.terrain === 'forest' || defenderCell.terrain === 'town') {
            hits = Math.max(0, hits - 1);
        }

        game.addCombatLog(`${attacker.side} ${attacker.type} attacks: [${dice.join(',')}] = ${hits} hits`);

        defenderCell.unit.strength -= hits;

        if (defenderCell.unit.strength <= 0) {
            defenderCell.unit = null;
            game.state.scores[playerSide]++;
            game.addCombatLog(`${defender.side} ${defender.type} destroyed!`);
        }

        game.state.unitsToActivate--;
        game.broadcastState();
    });

    socket.on('endTurn', () => {
        const game = games.get(socket.gameId);
        if (!game) return;

        const playerSide = game.players.allies.id === socket.id ? 'allies' : 'axis';

        if (game.state.currentPlayer !== playerSide) {
            socket.emit('error', { message: 'Not your turn!' });
            return;
        }

        // Reset units
        Object.values(game.state.board).forEach(cell => {
            if (cell.unit) {
                cell.unit.hasMoved = false;
            }
        });

        // Draw new card
        // eslint-disable-next-line no-unused-vars
        const usedCards = game.state.cardsInHand[playerSide];
        game.state.cardsInHand[playerSide] = game.generateCommandCards();

        // Switch player
        game.state.currentPlayer = playerSide === 'allies' ? 'axis' : 'allies';
        game.state.phase = 'selectCard';
        game.state.unitsToActivate = 0;
        game.state.selectedCard = null;

        game.addCombatLog(`${playerSide} ended turn`);
        game.broadcastState();
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        // Remove from waiting list
        const waitingIndex = waitingPlayers.indexOf(socket);
        if (waitingIndex > -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }

        // Handle game disconnection
        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (game) {
                // Notify opponent
                const opponentSide = game.players.allies.id === socket.id ? 'axis' : 'allies';
                game.players[opponentSide].socket.emit('opponentDisconnected');

                games.delete(socket.gameId);
            }
        }
    });
});

// REST API endpoints
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        activeGames: games.size,
        waitingPlayers: waitingPlayers.length
    });
});

app.get('/api/stats', (req, res) => {
    res.json({
        activeGames: games.size,
        waitingPlayers: waitingPlayers.length,
        totalConnections: io.engine.clientsCount
    });
});

app.get('/api/scenarios', (req, res) => {
    const scenarioList = Object.entries(scenarios).map(([id, scenario]) => ({
        id,
        name: scenario.name,
        description: scenario.description,
        victoryPoints: scenario.victoryPoints
    }));
    res.json(scenarioList);
});

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Memoir '44 server running on port ${PORT}`);
});