import * as THREE from "three";

export default class Chess {
    private selectedPiece = [] as number[];

    private activePlayer = "white";

    private capturedPieces = {
        white: [],
        black: [],
    } as { [key: string]: string[] };

    private kingNotMoved = {
        white: true,
        black: true,
    } as { [key: string]: boolean };

    private leftRookNotMoved = {
        white: true,
        black: true,
    } as { [key: string]: boolean };

    private rightRookNotMoved = {
        white: true,
        black: true,
    } as { [key: string]: boolean };

    private board = [
        ["R", "N", "B", "Q", "K", "B", "N", "R"],
        ["P", "P", "P", "P", "P", "P", "P", "P"],
        [" ", " ", " ", " ", " ", " ", " ", " "],
        [" ", " ", " ", " ", " ", " ", " ", " "],
        [" ", " ", " ", " ", " ", " ", " ", " "],
        [" ", " ", " ", " ", " ", " ", " ", " "],
        ["p", "p", "p", "p", "p", "p", "p", "p"],
        ["r", "n", "b", "q", "k", "b", "n", "r"]
    ];

    constructor() {
        console.log("Chess constructor");
    }

    public move(position: THREE.Vector3) {
        const [x, y] = this.getPieceIndex(position);
        const piece = this.board[this.selectedPiece[0]][this.selectedPiece[1]]
        const possibleMoves = this.getPossibleMovesForPiece(piece, this.selectedPiece[0], this.selectedPiece[1]);
        const move = this.getMove(x, y, possibleMoves);
        console.log("Chess move", move);
        if (move) {
            let castlingRook = null
            if (move.castling) {
                if (y === 2) {
                    castlingRook = this.indexToPosition(x, 0);
                    this.board[move.x][move.y] = this.board[this.selectedPiece[0]][this.selectedPiece[1]];
                    this.board[this.selectedPiece[0]][this.selectedPiece[1]] = " ";
                    this.board[move.x][move.y + 1] = this.board[x][0];
                    this.board[x][0] = " ";
                }
                if (y === 6) {
                    castlingRook = this.indexToPosition(x, 7);
                    this.board[move.x][move.y] = this.board[this.selectedPiece[0]][this.selectedPiece[1]];
                    this.board[move.x][move.y] = " ";
                    this.board[move.x][move.y - 1] = this.board[x][7];
                    this.board[x][7] = " ";
                }
            }
            if (move.capture) {
                this.capturedPieces[this.activePlayer].push(this.board[x][y]);
            }
            if (piece === "K" || piece === "k") {
                this.kingNotMoved[this.activePlayer] = false;
            }
            if (piece === "R" || piece === "r") {
                if (this.selectedPiece[1] === 0) {
                    this.leftRookNotMoved[this.activePlayer] = false;
                }
                if (this.selectedPiece[1] === 7) {
                    this.rightRookNotMoved[this.activePlayer] = false;
                }
            }
            this.board[x][y] = this.board[this.selectedPiece[0]][this.selectedPiece[1]];
            this.board[this.selectedPiece[0]][this.selectedPiece[1]] = " ";
            this.selectedPiece = [];
            this.activePlayer = this.activePlayer === "white" ? "black" : "white";
            console.log('Chess Board', this.board);
            return {newPosition: this.indexToPosition(x, y), capture: move.capture, castling: castlingRook};
        }
        return {newPosition: null, capture: null, castling: null};
    }

    public getPossibleMoves(position: THREE.Vector3) {
        const [x, y] = this.getPieceIndex(position);
        const piece = this.board[x][y];
        this.selectedPiece = [x, y];
        return this.getPossibleMovesForPiece(piece, x, y);
    }

    public getActivePlayer() {
        return this.activePlayer;
    }

    public getCapturedPieces() {
        return this.capturedPieces;
    }

    private getPieceIndex(position: THREE.Vector3) {
        return [position.z + 3.5, position.x + 3.5];
    }

    public isKingInCheck(player: string): boolean {
        const kingSymbol = player === "white" ? "k" : "K";
        let kingPosition: [number, number] | undefined;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] === kingSymbol) {
                    kingPosition = [i, j];
                    break;
                }
            }
            if (kingPosition) {
                break;
            }
        }

        if (!kingPosition) {
            return false;
        }

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board[i][j];
                if (piece && piece.toLowerCase() !== kingSymbol.toLowerCase() && piece.toLowerCase() !== "p" && piece.toLowerCase() !== "k" && piece.toLowerCase() !== " ") {
                    const possibleMoves = this.getPossibleMovesForPiece(piece, i, j);
                    for (const move of possibleMoves) {
                        if (move.x === kingPosition[0] && move.y === kingPosition[1]) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    public isKingInCheckMate(player: string): boolean {
        const kingSymbol = player === "white" ? "k" : "K";
        let kingPosition: [number, number] | undefined;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] === kingSymbol) {
                    kingPosition = [i, j];
                    break;
                }
            }
            if (kingPosition) {
                break;
            }
        }

        if (!kingPosition) {
            return false;
        }

        const possibleMoves = this.getPossibleMovesForPiece(kingSymbol, kingPosition[0], kingPosition[1]);
        for (const move of possibleMoves) {
            const boardCopy = this.board.map((row) => row.slice());
            boardCopy[move.x][move.y] = boardCopy[kingPosition[0]][kingPosition[1]];
            boardCopy[kingPosition[0]][kingPosition[1]] = " ";
            const chessCopy = new Chess();
            chessCopy.board = boardCopy;
            if (!chessCopy.isKingInCheck(player)) {
                return false;
            }
        }

        return true;
    }

    private isFieldAttacked(x: number, y: number) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board[i][j];
                if (piece && piece.toLowerCase() !== " ") {
                    const possibleMoves = this.getPossibleMovesForPiece(piece, i, j);
                    for (const move of possibleMoves) {
                        if (move.capture && move.x === x && move.y === y) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private getPossibleMovesForPiece(piece: string, x: number, y: number) {
        console.log("Chess getPossibleMovesForPiece", piece);
        switch (piece) {
            case "P":
            case "p":
                return this.getPossibleMovesForPawn(x, y, piece);
            case "r":
            case "R":
                return this.getPossibleMovesForRook(x, y, piece);
            case "n":
            case "N":
                return this.getPossibleMovesForKnight(x, y, piece);
            case "b":
            case "B":
                return this.getPossibleMovesForBishop(x, y, piece);
            case "q":
            case "Q":
                return this.getPossibleMovesForQueen(x, y, piece);
            case "k":
            case "K":
                return this.getPossibleMovesForKing(x, y, piece);
            default:
                return [];
        }
    }

    private getPossibleMovesForPawn(x: number, y: number, symbol: string) {
        const possibleMoves = [];
        const regex = symbol === symbol.toLowerCase() ? /[RNBQKP]/ : /[rnbqkp]/;

        // Bewegungen für weiße Bauern
        if (symbol === "p") {
            // Ein Schritt nach vorne
            if (x > 0 && this.board[x - 1][y] === " ") {
                possibleMoves.push({x: x - 1, y: y, capture: false});
            }

            // Zwei Schritte nach vorne
            if (x === 6 && this.board[5][y] === " " && this.board[4][y] === " ") {
                possibleMoves.push({x: 4, y: y, capture: false});
            }

            // Schlagbewegungen
            if (x > 0 && y > 0 && regex.test(this.board[x - 1][y - 1])) {
                possibleMoves.push({x: x - 1, y: y - 1, capture: true});
            }
            if (x > 0 && y < 7 && regex.test(this.board[x - 1][y + 1])) {
                possibleMoves.push({x: x - 1, y: y + 1, capture: true});
            }
        }

        // Bewegungen für schwarze Bauern
        if (symbol === "P") {
            // Ein Schritt nach vorne
            if (x < 7 && this.board[x + 1][y] === " ") {
                possibleMoves.push({x: x + 1, y: y, capture: false});
            }

            // Zwei Schritte nach vorne
            if (x === 1 && this.board[2][y] === " " && this.board[3][y] === " ") {
                possibleMoves.push({x: 3, y: y, capture: false});
            }

            // Schlagbewegungen
            if (x < 7 && y > 0 && regex.test(this.board[x + 1][y - 1])) {
                possibleMoves.push({x: x + 1, y: y - 1, capture: true});
            }
            if (x < 7 && y < 7 && regex.test(this.board[x + 1][y + 1])) {
                possibleMoves.push({x: x + 1, y: y + 1, capture: true});
            }
        }

        console.log("Chess getPossibleMovesForPawn", possibleMoves);
        return possibleMoves;
    }


    private getPossibleMovesForRook(x: number, y: number, symbol: string) {
        const currentPosition = this.board[x][y];
        const possibleMoves: { x: number, y: number, capture: boolean, castling: boolean }[] = [];
        const regex = symbol === symbol.toLowerCase() ? /[rnbqkp]/ : /[RNBQKP]/;
        const regexEnemy = symbol === symbol.toLowerCase() ? /[RNBQKP]/ : /[rnbqkp]/;

        // Check for possible moves in horizontal direction
        for (let i = y - 1; i >= 0; i--) {
            const newPosition = this.board[x][i];

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                break;
            }

            if (regexEnemy.test(newPosition)) {
                possibleMoves.push({x: x, y: i, capture: true, castling: false});
                break;
            } else {
                possibleMoves.push({x: x, y: i, capture: false, castling: false});
            }
        }

        for (let i = y + 1; i < 8; i++) {
            const newPosition = this.board[x][i];

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                break;
            }

            if (regexEnemy.test(newPosition)) {
                possibleMoves.push({x: x, y: i, capture: true, castling: false});
                break;
            } else {
                possibleMoves.push({x: x, y: i, capture: false, castling: false});
            }
        }

        // Check for possible moves in vertical direction
        for (let i = x - 1; i >= 0; i--) {
            const newPosition = this.board[i][y];

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                break;
            }

            if (regexEnemy.test(newPosition)) {
                possibleMoves.push({x: i, y: y, capture: true, castling: false});
                break;
            } else {
                possibleMoves.push({x: i, y: y, capture: false, castling: false});
            }
        }

        for (let i = x + 1; i < 8; i++) {
            const newPosition = this.board[i][y];

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                break;
            }

            if (regexEnemy.test(newPosition)) {
                possibleMoves.push({x: i, y: y, capture: true, castling: false});
                break;
            } else {
                possibleMoves.push({x: i, y: y, capture: false, castling: false});
            }
        }

        return possibleMoves;
    }


    private getPossibleMovesForKnight(x: number, y: number, symbol: string) {
        const currentPosition = this.board[x][y];
        const regex = symbol === symbol.toLowerCase() ? /[rnbqkp]/ : /[RNBQKP]/;
        const regexEnemy = symbol === symbol.toLowerCase() ? /[RNBQKP]/ : /[rnbqkp]/;
        const possibleMoves: { x: number, y: number, capture: boolean, castling: boolean }[] = [];

        const moves = [
            [2, 1],
            [2, -1],
            [-2, 1],
            [-2, -1],
            [1, 2],
            [1, -2],
            [-1, 2],
            [-1, -2]
        ];

        for (const [dx, dy] of moves) {
            const newX = x + dx;
            const newY = y + dy;

            if (newX < 0 || newX > 7 || newY < 0 || newY > 7) {
                continue;
            }

            const newPosition = this.board[newX][newY];

            if (/[kK]/.test(currentPosition) && /[kK]/.test(newPosition)) {
                continue;
            }

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                continue;
            }

            possibleMoves.push({x: newX, y: newY, capture: regexEnemy.test(newPosition), castling: false});
        }

        return possibleMoves;
    }


    private getPossibleMovesForBishop(x: number, y: number, symbol: string) {
        const currentPosition = this.board[x][y];
        const regex = symbol === symbol.toLowerCase() ? /[rnbqkp]/ : /[RNBQKP]/;
        const regexEnemy = symbol === symbol.toLowerCase() ? /[RNBQKP]/ : /[rnbqkp]/;
        const possibleMoves: { x: number, y: number, capture: boolean, castling: boolean }[] = [];

        // Check moves along positive diagonal
        for (let i = 1; i <= Math.min(7 - x, 7 - y); i++) {
            const newX = x + i;
            const newY = y + i;
            const newPosition = this.board[newX][newY];

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                break;
            }

            if (regexEnemy.test(newPosition)) {
                possibleMoves.push({x: newX, y: newY, capture: true, castling: false});
                break;
            } else {
                possibleMoves.push({x: newX, y: newY, capture: false, castling: false});
            }
        }

        // Check moves along negative diagonal
        for (let i = 1; i <= Math.min(x, 7 - y); i++) {
            const newX = x - i;
            const newY = y + i;
            const newPosition = this.board[newX][newY];

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                break;
            }

            if (regexEnemy.test(newPosition)) {
                possibleMoves.push({x: newX, y: newY, capture: true, castling: false});
                break;
            } else {
                possibleMoves.push({x: newX, y: newY, capture: false, castling: false});
            }
        }

        for (let i = 1; i <= Math.min(7 - x, y); i++) {
            const newX = x + i;
            const newY = y - i;
            const newPosition = this.board[newX][newY];

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                break;
            }

            if (regexEnemy.test(newPosition)) {
                possibleMoves.push({x: newX, y: newY, capture: true, castling: false});
                break;
            } else {
                possibleMoves.push({x: newX, y: newY, capture: false, castling: false});
            }
        }

        for (let i = 1; i <= Math.min(x, y); i++) {
            const newX = x - i;
            const newY = y - i;
            const newPosition = this.board[newX][newY];

            if (regex.test(currentPosition) && regex.test(newPosition)) {
                break;
            }

            if (regexEnemy.test(newPosition)) {
                possibleMoves.push({x: newX, y: newY, capture: true, castling: false});
                break;
            } else {
                possibleMoves.push({x: newX, y: newY, capture: false, castling: false});
            }
        }

        return possibleMoves;
    }

    private getPossibleMovesForQueen(x: number, y: number, symbol: string) {
        return [this.getPossibleMovesForRook(x, y, symbol), this.getPossibleMovesForBishop(x, y, symbol)].flat();
    }

    private getPossibleMovesForKing(x: number, y: number, symbol: string) {
        const possibleMoves: { x: number, y: number, capture: boolean, castling: boolean }[] = [];
        const regex = symbol === symbol.toLowerCase() ? /[rnbqkp]/ : /[RNBQKP]/;
        const regexEnemy = symbol === symbol.toLowerCase() ? /[RNBQKP]/ : /[rnbqkp]/;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) {
                    continue;
                }

                const row = x + i;
                const col = y + j;

                if (row < 0 || row > 7 || col < 0 || col > 7) {
                    continue;
                }

                const newPosition = this.board[row][col];

                if (regex.test(newPosition)) {
                    continue;
                }

                if (regexEnemy.test(newPosition)) {
                    possibleMoves.push({x: row, y: col, capture: true, castling: false});
                } else {
                    possibleMoves.push({x: row, y: col, capture: false, castling: false});
                }
            }
        }

        if (this.kingNotMoved[this.activePlayer] && !this.isKingInCheck(this.activePlayer)) {
            if (this.leftRookNotMoved[this.activePlayer]) {
                if (this.board[x][y - 1] === " " && this.board[x][y - 2] === " " && this.board[x][y - 3] === " ") {
                    possibleMoves.push({x: x, y: y - 2, capture: false, castling: true});
                }
            }
            if (this.rightRookNotMoved[this.activePlayer]) {
                if (this.board[x][y + 1] === " " && this.board[x][y + 2] === " ") {
                    possibleMoves.push({x: x, y: y + 2, capture: false, castling: true});
                }
            }
        }

        return possibleMoves;
    }


    private indexToPosition(x: number, y: number) {
        return new THREE.Vector3(y - 3.5, 0, x - 3.5);
    }

    private getMove(x: number, y: number, possibleMoves: any): { x: number, y: number, capture: boolean, castling: boolean } | undefined {
        return possibleMoves.find((move: any) => move.x === x && move.y === y);
    }

}
