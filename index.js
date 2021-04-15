const Kokopu = require('kokopu');

// Engine
class Engine {
    kokopuGame;
    VERSION = '0.1';
    move() {
        // Create a new position, play some moves...
        var position = this.kokopuGame.position;
        position.play('e4');
        position.play('e5');
        position.play('Nf3');

        // Display an ASCII-art representation of the position.
        console.log(position.ascii());

        // List the available moves.
        var moves = position.moves();
        console.log(moves.map(function(move) { return position.notation(move); }));

        // [ 'a6', 'a5', 'b6', 'b5', 'c6', 'c5', 'd6','d5', 'f6', 'f5', 'g6', 'g5', 'h6', 'h5', 'Na6', 'Nc6',
        // 'Qe7', 'Qf6', 'Qg5', 'Qh4', 'Ke7', 'Be7', 'Bd6', 'Bc5', 'Bb4', 'Ba3', 'Nf6', 'Nh6', 'Ne7' ]
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

            engine.resetTimeControl();
            timing = engine.getTimeControl();

            let go = command.split(' ');
            let depth = -1;
            let movestogo = 30;
            let movetime = -1;
            let inc = 0;

            if (go[1] == 'wtime' && engine.getSide() == engine.COLOR['WHITE'] ) { timing.time = parseInt(go[2]); }
            if (go[3] == 'btime' && engine.getSide() == engine.COLOR['BLACK'] ) { timing.time = parseInt(go[4]); }
            if (go[5] == 'winc' && engine.getSide() == engine.COLOR['WHITE']) { inc = parseInt(go[6]); }
            if (go[7] == 'binc' && engine.getSide() == engine.COLOR['BLACK']) { inc = parseInt(go[8]); }
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
            engine.setTimeControl(timing);
            console.log(
                'time:', timing.time,
                'inc', inc,
                'start', startTime,
                'stop', timing.stopTime,
                'depth', depth,
                'timeset', timing.timeSet
            );

            // search position
            engine.search(depth);
        }

        // parse UCI "position" command
        function parsePosition(command) {
            let position = command.split(' ');
            
            if (position[1].includes('startpos')) engine.setBoard(engine.START_FEN);
            else if (position[1] == 'fen') engine.setBoard(command.split('position fen ')[1]);
            
            let moves = command.split('moves ')[1];
            if (moves) { engine.loadMoves(moves); };
            
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