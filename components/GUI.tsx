import {useLoader} from '@react-three/fiber';
import React, {RefObject} from 'react';
import {CameraControls} from '@react-three/drei';
import * as THREE from 'three';
import Chess from '../ts/Chess';
import ChessBoard from './ChessBoard';
import Pieces from './Pieces';
import {ThreeEvent} from "@react-three/fiber/dist/declarations/src/core/events";

const chess = new Chess();
const colorWhite = 0xff0000;
const colorBlack = 0x00ff00;

let activeColor = colorWhite;
let selectedPiece = null as THREE.Object3D | null;

interface GUIProps {
    controls: RefObject<CameraControls>;
}


const GUI: React.FC<GUIProps> = ({controls}) => {
    const pieces = [
        {
            gltf: 'rook.glb',
            positions: [[-3.5, 0, 3.5], [-3.5, 0, -3.5], [3.5, 0, 3.5], [3.5, 0, -3.5]] as [number, number, number][],
        },
        {
            gltf: 'knight.glb',
            positions: [[-2.5, 0, 3.5], [-2.5, 0, -3.5], [2.5, 0, 3.5], [2.5, 0, -3.5]] as [number, number, number][],
        },
        {
            gltf: 'bishop.glb',
            positions: [[-1.5, 0, 3.5], [-1.5, 0, -3.5], [1.5, 0, 3.5], [1.5, 0, -3.5]] as [number, number, number][],
        },
        {
            gltf: 'queen.glb',
            positions: [[-.5, 0, 3.5], [-.5, 0, -3.5]] as [number, number, number][],
        },
        {
            gltf: 'king.glb',
            positions: [[.5, 0, 3.5], [.5, 0, -3.5]] as [number, number, number][],
        },
        {
            gltf: 'pawn.glb',
            positions: [[-3.5, 0, 2.5], [-3.5, 0, -2.5], [3.5, 0, 2.5], [3.5, 0, -2.5], [-2.5, 0, -2.5], [-2.5, 0, 2.5], [2.5, 0, -2.5], [2.5, 0, 2.5], [-1.5, 0, -2.5], [-1.5, 0, 2.5], [1.5, 0, -2.5], [1.5, 0, 2.5], [-.5, 0, -2.5], [-.5, 0, 2.5], [.5, 0, -2.5], [.5, 0, 2.5]] as [number, number, number][],
        }
    ];
    const boardTexture = useLoader(THREE.TextureLoader, '/chess/textures/board.jpg')

    return (
        <>
            <mesh rotation-x={-Math.PI / 2}>
                <boxGeometry args={[8.63, 8.63, 0.05]}/>
                <meshBasicMaterial map={boardTexture}/>
            </mesh>
            <ChessBoard
                controls={controls}
                fieldColor={colorBlack}
                fieldClick={fieldClick}
            />
            {pieces.map(piece => (
                <Pieces
                    key={piece.gltf}
                    gltf={piece.gltf}
                    positions={piece.positions}
                    pieceClick={pieceClick}
                />
            ))}
        </>);
};

function pieceClick(e: ThreeEvent<MouseEvent>) {
    if (!(e.eventObject instanceof THREE.Mesh)) {
        return;
    }

    if (e.eventObject.material.color.getHex('') !== activeColor) {
        return;
    }

    selectedPiece = e.eventObject;

    e.eventObject.parent?.getObjectByName('fieldsInstance')?.children.forEach((child) => {
        if (child.name.startsWith('field-') && child.position.y > 0) {
            child.position.y = -child.position.y;
        }
    });

    chess.getPossibleMoves(e.eventObject.position).forEach((move) => {
        const name = 'field-' + String.fromCharCode(65 + move.y) + (8 - move.x);
        const field = e.eventObject.parent?.getObjectByName(name) as any;

        if (field) {
            field.position.y = Math.abs(field.position.y);
            field.color = new THREE.Color(move.capture ? colorWhite : colorBlack);
        }
    });
}

function fieldClick(e: ThreeEvent<MouseEvent>, controls: RefObject<CameraControls>) {
    console.log('click', e, controls);
    const mesh = e.eventObject as THREE.Object3D;
    if (mesh.position.y > 0) {

        const {
            newPosition,
            capture,
            castling
        } = chess.move(mesh.position);

        if (newPosition) {
            const activePlayer = chess.getActivePlayer();

            if (capture) {
                const totalCaptured = chess.getCapturedPieces()[activePlayer === 'white' ? 'black' : 'white'].length;
                const capturedPiece = mesh.parent?.parent?.children.find((child) => child.position.x === newPosition.x && child.position.z === newPosition.z && !child.name.startsWith('field-'));
                const capturedPiecePosition = activeColor === colorWhite ? new THREE.Vector3(-5, 0, (-4.25 + totalCaptured * 0.5)) : new THREE.Vector3(5, 0, (4.25 - totalCaptured * 0.5));
                capturedPiece?.position.copy(capturedPiecePosition);
            }

            if (castling) {
                const rook = mesh.parent?.parent?.children.find((child) => child.position.x === castling.x && child.position.z === castling.z && !child.name.startsWith('field-'));
                rook?.position.copy(new THREE.Vector3(newPosition.x + (newPosition.x > 0 ? -1 : 1), 0, newPosition.z));
            }

            selectedPiece?.position.copy(newPosition);
            activeColor = chess.getActivePlayer() === 'white' ? colorWhite : colorBlack;
            controls.current?.rotateTo(chess.getActivePlayer() === 'white' ? 0 : Math.PI, Math.PI / 4, true);
        }

        mesh.parent?.children.forEach((child) => {
            if (child.name.startsWith('field-') && child.position.y > 0) {
                child.position.y = -child.position.y;
            }
        });
    }
}

export default GUI;
