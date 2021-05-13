const Kokopu = require('kokopu');

//@ts-check

// Engine
class Engine {
    kokopuGame;
    get currentPosition() {
        return this.kokopuGame.initialPosition();
    }
    VERSION = '0.1';
    WHITE = 'w';
    BLACK = 'b';
    // Init functions
    setHashSize() {
        console.log('Set hash size is not supported');
    }
    // Load functions
    newBoard() {
        this.kokopuGame.initialPosition(new Kokopu.Position('regular'));
    }
    setBoard(fenString) {
        let position = new Kokopu.Position(fenString)
        this.kokopuGame.initialPosition(position);
    }
    loadMoves(moveString, isUCINotation) {
        let moves = moveString.split(' ');
        let that = this;
        moves.forEach(function(move) {
            that.move(move, isUCINotation);
        });
    }
    // Logging / printing
    printBoard() {
        console.log(this.currentPosition.ascii());
    }
    // Stat functions
    getSide() {
        return this.currentPosition.turn(); // w or b
    }
    // Move functions
    move(move, isUCINotation) {
        if (isUCINotation) {
            move = this.currentPosition.uci(move);
        }
        console.log('moving ', this.currentPosition.notation(move));
        let result = this.currentPosition.play(move);
        console.log('moving result', result);
    }
    getMove(depth) {
        // List the available moves.
        var moves = this.currentPosition.moves();
        
        let that = this;
        console.log('possible moves', moves.map(function(move) { return that.currentPosition.notation(move); }));
        // e.g. [ 'a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6','d5', 'f6', 'f5', 'g6', 'g5', 'h6', 'h5', 'Na6', 'Nc6',
        // 'Qe7', 'Qf6', 'Qg5', 'Qh4', 'Ke7', 'Be7', 'Bd6', 'Bc5', 'Bb4', 'Ba3', 'Nf6', 'Nh6', 'Ne7' ]
        
        // Return first move
        let move = moves[0];
        console.log('our move is ', this.currentPosition.notation(move));
        return this.currentPosition.uci(move);

        // TODO: loop over every move and do a recursive search for future moves on the new position
        // So if we play e4, visit all possible next moves up until a specific depth
        // For every leaf, calculate the board score and then for every parent node, calculate the proper effective score
        // Then pick the move that leads to the heighest future board score

        // Note: what I would REALLY like is a board evaluator that identifies specific 'opportunities' and then works towards those
        // Or that identifies potential problems based on the board position, and then tries to fix those
    }
    scorePositionRecursively(targetDepth) {
        // Recursive search
        // Loop
        // Make move
        // Analyse position recursively, store scores
        // Undo move
        // Return worst score (assuming the opponent plays like we do)
    }
    scorePosition() {
        // Piece values
        // Piece positions
        // King safety. Always consider how much the king is trapped and/or threatened (ours and the opponent's)
        // Piece combinations (like two rooks or two bishops or adjacent pawns)
        // Pieces covering each other
        // Piece 'freedom' potential moves (less potential moves means less opportunities for good moves or escapes)
        // Piece attack possibilities (how many squares they cover in opponent's 'terrain' and/or attack opp pieces)
    }
    constructor() {
        this.kokopuGame = new Kokopu.Game();
        console.log('Engine created');
    }
}

// UCI connector
class UCIConnector {
    engine;
    listen() {
        process.stdin.setEncoding('utf-8');
        console.log('\n  Super Simple JS - UCI mode - v' + engine.VERSION + '\n\n');

        // parse UCI "go" command
        function parseGo(command) {
            if (command.includes('infinite')) return;

            //engine.resetTimeControl();
            //timing = engine.getTimeControl();
            let timing = {};

            let go = command.split(' ');
            let depth = -1;
            let movestogo = 30;
            let movetime = -1;
            let inc = 0;

            if (go[1] == 'wtime' && engine.getSide() == engine.WHITE ) { timing.time = parseInt(go[2]); }
            if (go[3] == 'btime' && engine.getSide() == engine.BLACK ) { timing.time = parseInt(go[4]); }
            if (go[5] == 'winc' && engine.getSide() == engine.WHITE) { inc = parseInt(go[6]); }
            if (go[7] == 'binc' && engine.getSide() == engine.BLACK) { inc = parseInt(go[8]); }
            if (go[9] == 'movestogo') { movestogo = parseInt(go[10]); }
            if (go[1] == 'movetime') { movetime = parseInt(go[2]); }
            if (go[1] == 'depth') { depth = parseInt(go[2]); }

            if(movetime != -1) {
                timing.time = movetime;
                movestogo = 1;
            }

            let startTime = new Date().getTime();

            if(timing.time != -1) {
                timing.timeSet = 1;
                
                let timeTotal = timing.time - 50;
                let moveTime = parseInt(timeTotal / movestogo + inc);
                
                if (inc > 0 && timeTotal < 5 * inc) moveTime = parseInt(75 * inc / 100);
                timing.stopTime = startTime + moveTime;    
            }

            // "infinite" depth if it's not specified
            if (depth == -1) depth = 64;

            // set time control
            //engine.setTimeControl(timing);
            console.log(
                'time:', timing.time,
                'inc', inc,
                'start', startTime,
                'stop', timing.stopTime,
                'depth', depth,
                'timeset', timing.timeSet
            );

            // search position
            let move = engine.getMove(depth);
            console.log('bestmove ' + move);
        }

        // parse UCI "position" command
        function parsePosition(command) {
            let position = command.split(' ');
            
            if (position[1].includes('startpos')) engine.newBoard();
            else if (position[1] == 'fen') engine.setBoard(command.split('position fen ')[1]);
            
            let moves = command.split('moves ')[1];
            if (moves) { engine.loadMoves(moves, true); };
            
            engine.printBoard();
        }

        // create CLI interface
        var readline = require('readline');
        var uci = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });

        // UCI loop
        uci.on('line', function(command){
            console.log('UCI command', command);
            if (command == 'uci') {
                console.log('id name SuperSimpleJS ' + engine.VERSION);
                console.log('id author Willem Mulder');
                console.log('option name Hash type spin default 16 min 4 max 128');
                console.log('uciok');
            }

            if (command == 'isready') console.log('readyok');
            if (command == 'quit') process.exit();
            if (command == 'ucinewgame') parsePosition("position startpos");
            if (command.includes('position')) parsePosition(command);
            if (command.includes('go')) parseGo(command);
            
            // set hash size
            if (command.includes("setoption name Hash value")) {
                let Mb = command.split(' ')[command.split(' ').length - 1];
                engine.setHashSize(Mb);
            }
            
            // perft (non UCI command)
            if (command.includes('perft')) engine.perft(command.split(' ')[1]);
        })
    }
    constructor(engine) {
        this.engine = engine;
        console.log('UCI Connector created');
    }
}

// Start
let engine = new Engine();
let connector = new UCIConnector(engine);
connector.listen();