import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Grid,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Flex,
  Select,
  Switch,
  FormControl,
  FormLabel,
  FormErrorMessage,
  keyframes,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

type Player = "X" | "O" | null;
type Difficulty = "fácil" | "medio" | "difícil";

interface PlayerStats {
  name: string;
  wins: number;
}

interface GameSettings {
  playerX: PlayerStats;
  playerO: PlayerStats;
  vsComputer: boolean;
  difficulty: Difficulty;
}

const fadeIn = keyframes`
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
`;

const shine = keyframes`
  0% { background-position: -100% }
  100% { background-position: 200% }
`;

const Home = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [playerX, setPlayerX] = useState<PlayerStats>({ name: "", wins: 0 });
  const [playerO, setPlayerO] = useState<PlayerStats>({ name: "", wins: 0 });
  const [vsComputer, setVsComputer] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [showValidation, setShowValidation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinnerMessage, setShowWinnerMessage] = useState(false);
  const [winnerName, setWinnerName] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    const savedSettings = localStorage.getItem("tictactoeSettings");
    if (savedSettings) {
      const settings: GameSettings = JSON.parse(savedSettings);
      setPlayerX(settings.playerX);
      setPlayerO(settings.playerO);
      setVsComputer(settings.vsComputer);
      setDifficulty(settings.difficulty);
    } else {
      onOpen();
    }
  }, []);

  const saveSettings = (
    newPlayerX: PlayerStats,
    newPlayerO: PlayerStats,
    newVsComputer: boolean,
    newDifficulty: Difficulty
  ) => {
    const settings: GameSettings = {
      playerX: newPlayerX,
      playerO: newPlayerO,
      vsComputer: newVsComputer,
      difficulty: newDifficulty,
    };
    localStorage.setItem("tictactoeSettings", JSON.stringify(settings));
  };

  const calculateWinner = (squares: Player[]): Player => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  };

  const getAvailableMoves = (squares: Player[]): number[] => {
    return squares.reduce<number[]>((moves, cell, index) => {
      if (!cell) moves.push(index);
      return moves;
    }, []);
  };

  const minimax = (
    squares: Player[],
    depth: number,
    isMaximizing: boolean,
    alpha: number = -Infinity,
    beta: number = Infinity
  ): { score: number; move?: number } => {
    const winner = calculateWinner(squares);
    if (winner === "O") return { score: 10 - depth };
    if (winner === "X") return { score: depth - 10 };
    if (!squares.includes(null)) return { score: 0 };

    const availableMoves = getAvailableMoves(squares);

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMove;

      for (const move of availableMoves) {
        const newSquares = [...squares];
        newSquares[move] = "O";
        const result = minimax(newSquares, depth + 1, false, alpha, beta);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
      }

      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      let bestMove;

      for (const move of availableMoves) {
        const newSquares = [...squares];
        newSquares[move] = "X";
        const result = minimax(newSquares, depth + 1, true, alpha, beta);
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;
      }

      return { score: bestScore, move: bestMove };
    }
  };

  const getComputerMove = (squares: Player[]): number => {
    const availableMoves = getAvailableMoves(squares);

    if (difficulty === "fácil") {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    if (difficulty === "medio") {
      // 50% de probabilidad de hacer un movimiento aleatorio
      if (Math.random() < 0.5) {
        return availableMoves[
          Math.floor(Math.random() * availableMoves.length)
        ];
      }
    }

    // Para dificultad difícil
    if (difficulty === "difícil") {
      // 20% de probabilidad de hacer un movimiento sub-óptimo
      if (Math.random() < 0.2) {
        // Obtener los 2 mejores movimientos y elegir uno al azar
        const moves = availableMoves.map((move) => {
          const newSquares = [...squares];
          newSquares[move] = "O";
          const score = minimax(newSquares, 0, false).score;
          return { move, score };
        });

        // Ordenar movimientos por puntuación
        moves.sort((a, b) => b.score - a.score);

        // Elegir aleatoriamente entre los 2 mejores movimientos
        const topMoves = moves.slice(0, Math.min(2, moves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)].move;
      }
    }

    // Usar minimax para el resto de los casos
    const result = minimax(squares, 0, true);
    return result.move!;
  };

  const handleClick = (index: number) => {
    if (board[index] || calculateWinner(board)) return;

    const newBoard = board.slice();
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsXNext(false);

    const winner = calculateWinner(newBoard);
    if (winner || !newBoard.includes(null)) {
      handleGameEnd(winner, newBoard);
      return;
    }

    if (vsComputer) {
      // Turno de la computadora
      setTimeout(() => {
        const computerMove = getComputerMove(newBoard);
        const finalBoard = [...newBoard];
        finalBoard[computerMove] = "O";
        setBoard(finalBoard);
        setIsXNext(true);

        const computerWinner = calculateWinner(finalBoard);
        if (computerWinner || !finalBoard.includes(null)) {
          handleGameEnd(computerWinner, finalBoard);
        }
      }, 500); // Pequeño retraso para mejor UX
    } else {
      setIsXNext(true);
    }
  };

  const handleGameEnd = (winner: Player, currentBoard: Player[]) => {
    if (winner) {
      const currentPlayer = winner === "X" ? playerX : playerO;
      const updatedPlayer = {
        ...currentPlayer,
        wins: currentPlayer.wins + 1,
      };

      if (winner === "X") {
        setPlayerX(updatedPlayer);
        saveSettings(updatedPlayer, playerO, vsComputer, difficulty);
      } else {
        setPlayerO(updatedPlayer);
        saveSettings(playerX, updatedPlayer, vsComputer, difficulty);
      }

      // Mostrar confeti y mensaje del ganador
      setShowConfetti(true);
      setWinnerName(currentPlayer.name);
      setShowWinnerMessage(true);

      setTimeout(() => {
        setShowConfetti(false);
        setShowWinnerMessage(false);
      }, 3500);

      toast({
        title: "¡Juego terminado!",
        description: `¡${currentPlayer.name} ha ganado!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else if (!currentBoard.includes(null)) {
      toast({
        title: "¡Juego terminado!",
        description: "¡Empate!",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    if (vsComputer) {
      // Al reiniciar, también determinar aleatoriamente quién empieza
      const computerStarts = Math.random() < 0.5;
      setIsXNext(!computerStarts);

      if (computerStarts) {
        setTimeout(() => {
          const newBoard = Array(9).fill(null);
          const computerMove = getComputerMove(newBoard);
          newBoard[computerMove] = "O";
          setBoard(newBoard);
          setIsXNext(true);
        }, 500);
      }
    } else {
      setIsXNext(true);
    }
  };

  const handlePlayersSubmit = () => {
    setShowValidation(true);

    if (!playerX.name.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del Jugador X",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!vsComputer && !playerO.name.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del Jugador O",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const computerPlayer = { name: "Computadora", wins: 0 };
    if (vsComputer) {
      setPlayerO(computerPlayer);
      // Determinar aleatoriamente quién empieza
      const computerStarts = Math.random() < 0.5;
      setIsXNext(!computerStarts);

      if (computerStarts) {
        // Si la computadora empieza, hacer su movimiento después de un pequeño retraso
        setTimeout(() => {
          const newBoard = [...board];
          const computerMove = getComputerMove(newBoard);
          newBoard[computerMove] = "O";
          setBoard(newBoard);
          setIsXNext(true);
        }, 500);
      }
    }

    saveSettings(
      playerX,
      vsComputer ? computerPlayer : playerO,
      vsComputer,
      difficulty
    );
    onClose();
    resetGame();
  };

  const renderSquare = (index: number) => (
    <Button
      h="100px"
      w="100px"
      fontSize="5xl"
      onClick={() => handleClick(index)}
      bg="white"
      _hover={{ bg: "gray.100" }}
      border="2px"
      borderColor="gray.200"
      isDisabled={!isXNext && vsComputer}
    >
      {board[index]}
    </Button>
  );

  const winner = calculateWinner(board);
  const status = winner
    ? `Ganador: ${winner === "X" ? playerX.name : playerO.name}`
    : board.includes(null)
    ? `Siguiente jugador: ${isXNext ? playerX.name : playerO.name}`
    : "Empate";

  return (
    <Flex w="100vw" h="100vh" align="center" justify="center">
      {showConfetti && (
        <ReactConfetti
          numberOfPieces={500}
          recycle={false}
          gravity={0.3}
          initialVelocityY={30}
          initialVelocityX={15}
          confettiSource={{
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            w: 0,
            h: 0,
          }}
          tweenDuration={200}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      )}
      {showWinnerMessage && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.8)"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack animation={`${fadeIn} 0.5s ease-out`} spacing={4}>
            <Text
              fontSize="6xl"
              fontWeight="extrabold"
              color="white"
              textShadow="0 0 10px rgba(255,255,255,0.5)"
              bgGradient="linear(to-r, #ff0080, #7928CA, #ff0080)"
              bgClip="text"
              bgSize="200% auto"
              animation={`${shine} 2s linear infinite`}
            >
              ¡GANADOR!
            </Text>
            <Text
              fontSize="5xl"
              fontWeight="bold"
              color="white"
              textShadow="2px 2px 4px rgba(0,0,0,0.4)"
            >
              {winnerName}
            </Text>
          </VStack>
        </Box>
      )}
      <Card maxW="600px" w="90%" mx="auto" boxShadow="xl">
        <CardHeader>
          <Heading size="xl" textAlign="center">
            Tic Tac Toe
          </Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={6}>
            <HStack spacing={8} justify="center">
              <VStack>
                <Text fontWeight="bold">{playerX.name} (X)</Text>
                <Text>Victorias: {playerX.wins}</Text>
              </VStack>
              <VStack>
                <Text fontWeight="bold">{playerO.name} (O)</Text>
                <Text>Victorias: {playerO.wins}</Text>
              </VStack>
            </HStack>

            {vsComputer && (
              <FormControl w="200px">
                <FormLabel textAlign="center">Nivel de dificultad</FormLabel>
                <Select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as Difficulty);
                    // Reiniciar el juego al cambiar la dificultad
                    const computerStarts = Math.random() < 0.5;
                    setIsXNext(!computerStarts);
                    setBoard(Array(9).fill(null));

                    if (computerStarts) {
                      setTimeout(() => {
                        const newBoard = Array(9).fill(null);
                        const computerMove = getComputerMove(newBoard);
                        newBoard[computerMove] = "O";
                        setBoard(newBoard);
                        setIsXNext(true);
                      }, 500);
                    }

                    toast({
                      title: "Juego reiniciado",
                      description: `Nivel cambiado a ${e.target.value}`,
                      status: "info",
                      duration: 2000,
                      isClosable: true,
                    });
                  }}
                  bg="white"
                >
                  <option value="fácil">Fácil</option>
                  <option value="medio">Medio</option>
                  <option value="difícil">Difícil</option>
                </Select>
              </FormControl>
            )}

            <Text fontSize="xl" fontWeight="bold">
              {status}
            </Text>
            <Box>
              <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                {Array(9)
                  .fill(null)
                  .map((_, i) => (
                    <Box key={i}>{renderSquare(i)}</Box>
                  ))}
              </Grid>
            </Box>
            <VStack spacing={4}>
              <Button colorScheme="blue" onClick={resetGame} size="lg">
                Reiniciar Juego
              </Button>
              {vsComputer && (
                <Text fontSize="sm" color="gray.600">
                  Nivel actual:{" "}
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Text>
              )}
              <Text
                as="span"
                color="blue.500"
                textDecoration="underline"
                cursor="pointer"
                onClick={() => {
                  localStorage.removeItem("tictactoeSettings");
                  setPlayerX({ name: "", wins: 0 });
                  setPlayerO({ name: "", wins: 0 });
                  setVsComputer(false);
                  setDifficulty("fácil");
                  setShowValidation(false);
                  resetGame();
                  onOpen();
                }}
                fontSize="sm"
              >
                Reiniciar juego completo
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => {}}
        closeOnOverlayClick={false}
        closeOnEsc={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Configuración del Juego</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">¿Jugar contra la computadora?</FormLabel>
                <Switch
                  isChecked={vsComputer}
                  onChange={(e) => {
                    setVsComputer(e.target.checked);
                    if (e.target.checked) {
                      setPlayerO({ name: "", wins: 0 });
                    }
                  }}
                />
              </FormControl>

              {vsComputer && (
                <FormControl>
                  <FormLabel>Nivel de dificultad</FormLabel>
                  <Select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as Difficulty)
                    }
                  >
                    <option value="fácil">Fácil</option>
                    <option value="medio">Medio</option>
                    <option value="difícil">Difícil</option>
                  </Select>
                </FormControl>
              )}

              <FormControl
                isRequired
                isInvalid={showValidation && !playerX.name.trim()}
              >
                <FormLabel>Nombre del Jugador X</FormLabel>
                <Input
                  placeholder="Ingresa el nombre"
                  value={playerX.name}
                  onChange={(e) =>
                    setPlayerX({ ...playerX, name: e.target.value })
                  }
                />
                {showValidation && !playerX.name.trim() && (
                  <FormErrorMessage>El nombre es requerido</FormErrorMessage>
                )}
              </FormControl>

              {!vsComputer && (
                <FormControl
                  isRequired
                  isInvalid={showValidation && !playerO.name.trim()}
                >
                  <FormLabel>Nombre del Jugador O</FormLabel>
                  <Input
                    placeholder="Ingresa el nombre"
                    value={playerO.name}
                    onChange={(e) =>
                      setPlayerO({ ...playerO, name: e.target.value })
                    }
                  />
                  {showValidation && !playerO.name.trim() && (
                    <FormErrorMessage>El nombre es requerido</FormErrorMessage>
                  )}
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={handlePlayersSubmit}
              isDisabled={
                showValidation &&
                (!playerX.name.trim() || (!vsComputer && !playerO.name.trim()))
              }
            >
              Comenzar Juego
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Home;
