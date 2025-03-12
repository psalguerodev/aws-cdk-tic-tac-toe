import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  keyframes,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Spinner,
  Switch,
  Tab,
  Table,
  TableContainer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";
import { FaTrophy } from "react-icons/fa";

type Player = "X" | "O" | null;
type Difficulty = "fácil" | "medio" | "difícil";

interface PlayerStats {
  name: string;
  wins: number;
}

interface GameResult {
  playerX: PlayerStats;
  playerO: PlayerStats;
  winner: Player;
  date: string;
  vsComputer: boolean;
  difficulty?: Difficulty;
}

interface GameSettings {
  playerX: PlayerStats;
  playerO: PlayerStats;
  vsComputer: boolean;
  difficulty: Difficulty;
}

interface ApiGameStats {
  games: GameResult[];
  totalGames: number;
  playerStats: {
    [key: string]: PlayerStats;
  };
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

const API_URL = "https://8lrj00xq0j.execute-api.us-east-1.amazonaws.com/prod";

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
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<ApiGameStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const {
    isOpen: isStatsOpen,
    onOpen: onStatsOpen,
    onClose: onStatsClose,
  } = useDisclosure();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

    // Cargar estadísticas al inicio
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch(`${API_URL}/stats`);
      if (!response.ok) throw new Error("Error al obtener estadísticas");
      const data: ApiGameStats = await response.json();
      setStats(data);

      // Actualizar estadísticas locales si hay datos
      if (data.playerStats) {
        const currentX = playerX.name;
        const currentO = playerO.name;
        if (currentX && data.playerStats[currentX]) {
          setPlayerX((prev) => ({
            ...prev,
            wins: data.playerStats[currentX].wins,
          }));
        }
        if (currentO && data.playerStats[currentO]) {
          setPlayerO((prev) => ({
            ...prev,
            wins: data.playerStats[currentO].wins,
          }));
        }
      }
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const saveGameToApi = async (winner: Player) => {
    try {
      setIsLoading(true);
      const gameData = {
        playerX,
        playerO,
        winner: winner,
        vsComputer,
        difficulty: vsComputer ? difficulty : undefined,
        date: new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) throw new Error("Error al guardar el juego");

      // Actualizar estadísticas después de guardar
      await fetchStats();
    } catch (error) {
      console.error("Error al guardar el juego:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el resultado del juego",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const winner = calculateWinner(newBoard);
    if (winner || !newBoard.includes(null)) {
      handleGameEnd(winner, newBoard);
      return;
    }

    if (vsComputer && isXNext) {
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
      setIsXNext(!isXNext);
    }
  };

  const handleGameEnd = async (winner: Player, currentBoard: Player[]) => {
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

      // Guardar el juego en la API
      await saveGameToApi(winner);

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
      // Guardar empate en la API
      await saveGameToApi(null);

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
    const newBoard = Array(9).fill(null);
    setBoard(newBoard);

    if (vsComputer) {
      const computerStarts = Math.random() < 0.5;
      setIsXNext(!computerStarts);

      if (computerStarts) {
        const computerMove = getComputerMove(newBoard);
        const updatedBoard = [...newBoard];
        updatedBoard[computerMove] = "O";
        setBoard(updatedBoard);
        setIsXNext(true);
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
      const computerStarts = Math.random() < 0.5;
      setIsXNext(!computerStarts);

      const newBoard = Array(9).fill(null);
      if (computerStarts) {
        const computerMove = getComputerMove(newBoard);
        newBoard[computerMove] = "O";
        setIsXNext(true);
      }
      setBoard(newBoard);
    }

    saveSettings(
      playerX,
      vsComputer ? computerPlayer : playerO,
      vsComputer,
      difficulty
    );
    onClose();
  };

  const renderSquare = (index: number) => (
    <Button
      h="80px"
      w="80px"
      fontSize="4xl"
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

  const formatDateTime = (date: string) => {
    const dateObj = new Date(date);
    // Ajustar a zona horaria de Lima (UTC-5)
    const limaDate = new Date(dateObj.getTime() - 5 * 60 * 60 * 1000);

    const day = limaDate.getDate().toString().padStart(2, "0");
    const month = (limaDate.getMonth() + 1).toString().padStart(2, "0");
    const hours = limaDate.getHours().toString().padStart(2, "0");
    const minutes = limaDate.getMinutes().toString().padStart(2, "0");

    return `${day}/${month} ${hours}:${minutes}`;
  };

  return (
    <Flex w="100vw" h="100vh" align="center" justify="center">
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
              style={{ position: "fixed", top: 0, left: 0, zIndex: 1001 }}
            />
          )}
          <VStack
            animation={`${fadeIn} 0.5s ease-out`}
            spacing={4}
            zIndex={1002}
          >
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
      <Card maxW="500px" w="90%" mx="auto" boxShadow="xl">
        <CardHeader py={2}>
          <Heading size="lg" textAlign="center">
            Tic Tac Toe
          </Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={3}>
            {isLoading && (
              <Text color="gray.500" fontSize="sm">
                Guardando resultado...
              </Text>
            )}
            <HStack spacing={8} justify="center">
              <VStack spacing={0}>
                <Text fontWeight="bold" fontSize="md">
                  {playerX.name} (X)
                </Text>
                <Text fontSize="sm">Victorias: {playerX.wins}</Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontWeight="bold" fontSize="md">
                  {playerO.name} (O)
                </Text>
                <Text fontSize="sm">Victorias: {playerO.wins}</Text>
              </VStack>
            </HStack>

            <Button
              size="sm"
              colorScheme="purple"
              variant="outline"
              onClick={() => {
                fetchStats();
                onStatsOpen();
              }}
            >
              Ver Ranking
            </Button>

            {vsComputer && (
              <FormControl w="180px">
                <FormLabel textAlign="center" fontSize="sm" mb={1}>
                  Nivel de dificultad
                </FormLabel>
                <Select
                  size="sm"
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

            <Text fontSize="lg" fontWeight="bold">
              {status}
            </Text>
            <Box>
              <Grid templateColumns="repeat(3, 1fr)" gap={1}>
                {Array(9)
                  .fill(null)
                  .map((_, i) => (
                    <Box key={i}>{renderSquare(i)}</Box>
                  ))}
              </Grid>
            </Box>
            <VStack spacing={2}>
              <Button colorScheme="blue" onClick={resetGame} size="md">
                Reiniciar Juego
              </Button>
              {vsComputer && (
                <Text fontSize="xs" color="gray.600">
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
                fontSize="xs"
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

      <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Estadísticas del Juego</ModalHeader>
          <ModalBody>
            {isLoadingStats ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="xl" color="purple.500" />
              </Flex>
            ) : stats ? (
              <Tabs isFitted variant="enclosed">
                <TabList mb="1em">
                  <Tab>Ranking</Tab>
                  <Tab>Historial</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="bold">
                          Total de partidas: {stats.totalGames}
                        </Text>
                      </HStack>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th width="15%">Posición</Th>
                              <Th width="45%">Jugador</Th>
                              <Th width="20%" isNumeric>
                                Victorias
                              </Th>
                              <Th width="20%">Estado</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Object.entries(stats.playerStats)
                              .sort(([, a], [, b]) => b.wins - a.wins)
                              .map(([name, stats], index) => (
                                <Tr key={name}>
                                  <Td>
                                    <HStack spacing={2}>
                                      <Text>{index + 1}º</Text>
                                      {index < 3 && (
                                        <Box
                                          color={
                                            index === 0
                                              ? "yellow.400"
                                              : index === 1
                                              ? "gray.400"
                                              : "orange.400"
                                          }
                                        >
                                          <FaTrophy size="1.2em" />
                                        </Box>
                                      )}
                                    </HStack>
                                  </Td>
                                  <Td>
                                    <Text isTruncated maxW="100%">
                                      {name}{" "}
                                      {name === "Computadora" && (
                                        <Badge colorScheme="purple">IA</Badge>
                                      )}
                                    </Text>
                                  </Td>
                                  <Td isNumeric>{stats.wins}</Td>
                                  <Td>
                                    {name === playerX.name ||
                                    name === playerO.name ? (
                                      <Badge colorScheme="green">
                                        En juego
                                      </Badge>
                                    ) : null}
                                  </Td>
                                </Tr>
                              ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </VStack>
                  </TabPanel>
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th width="20%">Fecha</Th>
                              <Th width="20%">Jugador X</Th>
                              <Th width="20%">Jugador O</Th>
                              <Th width="20%">Ganador</Th>
                              <Th width="20%">Modo</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {stats.games
                              .sort(
                                (a, b) =>
                                  new Date(b.date).getTime() -
                                  new Date(a.date).getTime()
                              )
                              .slice(
                                (currentPage - 1) * itemsPerPage,
                                currentPage * itemsPerPage
                              )
                              .map((game, index) => (
                                <Tr key={index}>
                                  <Td>
                                    <Text fontSize="sm" noOfLines={2}>
                                      {formatDateTime(game.date)}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" noOfLines={1}>
                                      {game.playerX.name}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" noOfLines={1}>
                                      {game.playerO.name}{" "}
                                      {game.vsComputer && (
                                        <Badge colorScheme="purple">IA</Badge>
                                      )}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" noOfLines={1}>
                                      {game.winner ? (
                                        <Badge colorScheme="green">
                                          {game.winner === "X"
                                            ? game.playerX.name
                                            : game.playerO.name}
                                        </Badge>
                                      ) : (
                                        <Badge colorScheme="gray">Empate</Badge>
                                      )}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" noOfLines={1}>
                                      {game.vsComputer ? (
                                        <>vs IA ({game.difficulty})</>
                                      ) : (
                                        "vs Jugador"
                                      )}
                                    </Text>
                                  </Td>
                                </Tr>
                              ))}
                          </Tbody>
                        </Table>
                      </TableContainer>

                      <HStack justify="center" spacing={4}>
                        <IconButton
                          aria-label="Página anterior"
                          icon={<ChevronLeftIcon />}
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          isDisabled={currentPage === 1}
                          size="sm"
                        />

                        <Text fontSize="sm">
                          Página {currentPage} de{" "}
                          {Math.ceil(stats.games.length / itemsPerPage)}
                        </Text>

                        <IconButton
                          aria-label="Página siguiente"
                          icon={<ChevronRightIcon />}
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(
                                Math.ceil(stats.games.length / itemsPerPage),
                                prev + 1
                              )
                            )
                          }
                          isDisabled={
                            currentPage ===
                            Math.ceil(stats.games.length / itemsPerPage)
                          }
                          size="sm"
                        />

                        <HStack spacing={2}>
                          <Text fontSize="sm">Mostrar:</Text>
                          <NumberInput
                            size="sm"
                            maxW={20}
                            min={5}
                            max={20}
                            value={itemsPerPage}
                            onChange={(valueString) => {
                              const value = parseInt(valueString);
                              setItemsPerPage(value);
                              setCurrentPage(1);
                            }}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </HStack>
                      </HStack>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            ) : (
              <Text>No hay estadísticas disponibles</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onStatsClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Home;
