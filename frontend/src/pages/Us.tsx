import { CheckIcon, ChevronDownIcon, StarIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Progress,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";
import messagesData from "../data/messages.json";
import questionsData from "../data/questions.json";

interface Question {
  id: number;
  type: "single" | "multiple";
  question: string;
  options: string[];
  correctAnswer: number | number[];
  explanation: string;
}

interface ScoreMessage {
  minScore: number;
  maxScore: number;
  message: string;
  color: string;
}

const Us = () => {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<(number | number[] | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [randomizedQuestions, setRandomizedQuestions] = useState<Question[]>(
    []
  );
  const toast = useToast();

  useEffect(() => {
    // Aleatorizar las preguntas al cargar el componente
    const shuffledQuestions = [...questionsData.questions]
      .map((q) => ({ ...q, type: q.type as "single" | "multiple" }))
      .sort(() => Math.random() - 0.5);
    setRandomizedQuestions(shuffledQuestions);
    // Inicializar respuestas según el tipo de pregunta
    const initialAnswers = shuffledQuestions.map((q) =>
      q.type === "multiple" ? [] : null
    );
    setAnswers(initialAnswers);
  }, []);

  const question = randomizedQuestions[currentQuestion];

  const handleSingleAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = parseInt(value);
    setAnswers(newAnswers);
  };

  const handleMultipleAnswer = (index: number) => {
    const newAnswers = [...answers];
    const currentAnswer = Array.isArray(newAnswers[currentQuestion])
      ? [...(newAnswers[currentQuestion] as number[])]
      : [];

    const maxSelections = (question.correctAnswer as number[]).length;

    if (currentAnswer.includes(index)) {
      // Deseleccionar
      newAnswers[currentQuestion] = currentAnswer.filter((i) => i !== index);
    } else if (currentAnswer.length < maxSelections) {
      // Seleccionar
      newAnswers[currentQuestion] = [...currentAnswer, index];
    }

    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    randomizedQuestions.forEach((q, index) => {
      const userAnswer = answers[index];
      if (q.type === "single") {
        if (userAnswer === q.correctAnswer) correct++;
      } else {
        const correctArray = q.correctAnswer as number[];
        const userArray = userAnswer as number[];
        if (
          userArray &&
          correctArray.length === userArray.length &&
          correctArray.every((value) => userArray.includes(value))
        ) {
          correct++;
        }
      }
    });
    return (correct / randomizedQuestions.length) * 100;
  };

  const getScoreMessage = (score: number): ScoreMessage => {
    return (
      messagesData.scoreMessages.find(
        (m) => score > m.minScore && score <= m.maxScore
      ) || messagesData.scoreMessages[0]
    );
  };

  const getIncorrectQuestions = () => {
    return randomizedQuestions.filter((q, index) => {
      const userAnswer = answers[index];
      if (q.type === "single") {
        return userAnswer !== q.correctAnswer;
      } else {
        const correctArray = q.correctAnswer as number[];
        const userArray = (userAnswer as number[]) || [];
        return !(
          userArray &&
          correctArray.length === userArray.length &&
          correctArray.every((value) => userArray.includes(value))
        );
      }
    });
  };

  const handleNext = () => {
    if (currentQuestion < randomizedQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (
      !showResults &&
      answers.every((a) => (Array.isArray(a) ? a.length > 0 : a !== null))
    ) {
      setShowResults(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    } else {
      toast({
        title: "Por favor responde todas las preguntas",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRestart = () => {
    const shuffledQuestions = [...questionsData.questions]
      .map((q) => ({ ...q, type: q.type as "single" | "multiple" }))
      .sort(() => Math.random() - 0.5);
    setRandomizedQuestions(shuffledQuestions);
    setCurrentQuestion(0);
    // Inicializar correctamente las respuestas para preguntas múltiples
    const initialAnswers = shuffledQuestions.map((q) =>
      q.type === "multiple" ? [] : null
    );
    setAnswers(initialAnswers);
    setShowResults(false);
  };

  const score = calculateScore();
  const scoreMessage = getScoreMessage(score);
  const incorrectQuestions = getIncorrectQuestions();

  const isAnswerComplete = (questionIndex: number) => {
    const currentAnswer = answers[questionIndex];
    const currentQuestion = randomizedQuestions[questionIndex];

    if (currentQuestion.type === "single") {
      return currentAnswer !== null;
    } else {
      return (
        Array.isArray(currentAnswer) &&
        currentAnswer.length ===
          (currentQuestion.correctAnswer as number[]).length
      );
    }
  };

  useEffect(() => {
    if (showResults) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }
  }, [showResults]);

  if (!question) return null;

  return (
    <Flex w="100vw" minH="100vh" align="center" justify="center" p={4}>
      {showConfetti && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1000}
        >
          <ReactConfetti
            numberOfPieces={500}
            recycle={false}
            gravity={0.3}
            initialVelocityY={30}
            initialVelocityX={15}
            width={window.innerWidth}
            height={window.innerHeight}
          />
        </Box>
      )}
      <Card
        maxW="600px"
        w="100%"
        mx="auto"
        boxShadow="xl"
        height={{ base: "90vh", md: "650px" }}
        display="flex"
        flexDirection="column"
        my="auto"
      >
        <CardHeader py={3} pt={4}>
          {!showResults ? (
            <Heading size="lg" textAlign="center">
              Test de Inteligencia Emocional
            </Heading>
          ) : (
            <Box textAlign="center">
              <Heading size="lg" mb={2}>
                ¡Test Completado!
              </Heading>
              <Box
                sx={{
                  opacity: 0,
                  animation: "fadeIn 0.5s ease-in forwards 0.3s",
                  "@keyframes fadeIn": {
                    "0%": {
                      opacity: 0,
                      transform: "translateY(-10px)",
                    },
                    "100%": {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  },
                }}
              >
                <Text color="gray.500" fontSize="md">
                  Test de Inteligencia Emocional
                </Text>
              </Box>
            </Box>
          )}
        </CardHeader>
        <CardBody
          flex="1"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Box
            flex="1"
            overflowY="auto"
            css={{
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                width: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "gray.200",
                borderRadius: "24px",
              },
            }}
          >
            {!showResults ? (
              <>
                <HStack
                  spacing={4}
                  mb={4}
                  position="sticky"
                  top={0}
                  zIndex={1}
                  bg="white"
                  w="100%"
                >
                  <Text fontSize="sm" fontWeight="medium" minW="45px">
                    {currentQuestion + 1}/{randomizedQuestions.length}
                  </Text>
                  <Progress
                    value={
                      ((currentQuestion + 1) / randomizedQuestions.length) * 100
                    }
                    w="100%"
                    colorScheme="purple"
                  />
                </HStack>
                <VStack spacing={6} w="100%" pb={4}>
                  <Text>{question.question}</Text>
                  {question.type === "single" ? (
                    <RadioGroup
                      onChange={handleSingleAnswer}
                      value={answers[currentQuestion]?.toString() || ""}
                    >
                      <Stack spacing={3} width="100%">
                        {question.options.map((option, index) => (
                          <Card
                            key={index}
                            p={3}
                            cursor="pointer"
                            _hover={{ bg: "gray.50" }}
                            onClick={() => handleSingleAnswer(index.toString())}
                          >
                            <Radio value={index.toString()}>{option}</Radio>
                          </Card>
                        ))}
                      </Stack>
                    </RadioGroup>
                  ) : (
                    <Stack spacing={3} width="100%">
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Selecciona {(question.correctAnswer as number[]).length}{" "}
                        respuestas
                      </Text>
                      {question.options.map((option, index) => {
                        const currentAnswer = Array.isArray(
                          answers[currentQuestion]
                        )
                          ? (answers[currentQuestion] as number[])
                          : [];
                        const maxSelections = (
                          question.correctAnswer as number[]
                        ).length;
                        const isSelected = currentAnswer.includes(index);
                        const isDisabled =
                          !isSelected && currentAnswer.length >= maxSelections;

                        return (
                          <Card
                            key={index}
                            p={3}
                            cursor={isDisabled ? "not-allowed" : "pointer"}
                            _hover={{ bg: isDisabled ? undefined : "gray.50" }}
                            onClick={() =>
                              !isDisabled && handleMultipleAnswer(index)
                            }
                            opacity={isDisabled ? 0.6 : 1}
                          >
                            <Checkbox
                              isChecked={isSelected}
                              isDisabled={isDisabled}
                              pointerEvents="none"
                            >
                              {option}
                            </Checkbox>
                          </Card>
                        );
                      })}
                    </Stack>
                  )}
                </VStack>
              </>
            ) : (
              <VStack spacing={4} align="stretch" w="100%" pb={4}>
                <Box textAlign="center" position="relative" mb={2}>
                  <Box
                    position="relative"
                    width="100px"
                    height="100px"
                    margin="0 auto"
                    mb={2}
                  >
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      fontSize="56px"
                      lineHeight="1"
                    >
                      {score >= 80
                        ? "🌟"
                        : score >= 60
                        ? "😊"
                        : score >= 40
                        ? "🤔"
                        : "📚"}
                    </Box>
                  </Box>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color={scoreMessage.color}
                    mb={1}
                  >
                    {score >= 80
                      ? "¡Excelente!"
                      : score >= 60
                      ? "¡Muy Bien!"
                      : score >= 40
                      ? "Buen Intento"
                      : "Sigue Aprendiendo"}
                  </Text>
                  <Text fontSize="md" color="gray.600" mb={3}>
                    {scoreMessage.message}
                  </Text>
                  <HStack justify="center" spacing={6} mb={3}>
                    <VStack spacing={1}>
                      <Box
                        bg="green.100"
                        p={2}
                        borderRadius="full"
                        color="green.500"
                        width="32px"
                        height="32px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <CheckIcon boxSize={4} />
                      </Box>
                      <Text fontWeight="bold">
                        {randomizedQuestions.length - incorrectQuestions.length}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Correctas
                      </Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Box
                        bg="purple.100"
                        p={2}
                        borderRadius="full"
                        color="purple.500"
                        width="32px"
                        height="32px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <StarIcon boxSize={4} />
                      </Box>
                      <Text fontWeight="bold">{score.toFixed(0)}%</Text>
                      <Text fontSize="sm" color="gray.600">
                        Puntuación
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {incorrectQuestions.length > 0 && (
                  <Center
                    py={1}
                    flexDirection="column"
                    role="button"
                    onClick={() => {
                      const element = document.getElementById(
                        "incorrect-questions"
                      );
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ transform: "translateY(2px)" }}
                  >
                    <Text color="gray.500" fontSize="sm" mb={0}>
                      Desliza para ver oportunidades de mejora
                    </Text>
                    <Box
                      animation="bounce 1s infinite"
                      css={{
                        "@keyframes bounce": {
                          "0%, 100%": {
                            transform: "translateY(0)",
                          },
                          "50%": {
                            transform: "translateY(5px)",
                          },
                        },
                      }}
                    >
                      <ChevronDownIcon boxSize={4} color="gray.400" />
                    </Box>
                  </Center>
                )}

                {incorrectQuestions.length > 0 && (
                  <Box id="incorrect-questions">
                    <HStack mb={2} align="center">
                      <Text fontWeight="bold" fontSize="lg">
                        Oportunidades de mejora
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        ({incorrectQuestions.length})
                      </Text>
                    </HStack>
                    <Accordion
                      defaultIndex={[0]}
                      allowMultiple
                      css={{
                        "& .chakra-accordion__button:focus": {
                          outline: "none",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {incorrectQuestions.map((q) => (
                        <AccordionItem key={q.id} border="none">
                          <AccordionButton
                            p={4}
                            _hover={{ bg: "gray.50" }}
                            _focus={{ outline: "none", boxShadow: "none" }}
                            _expanded={{ bg: "gray.50" }}
                            rounded="md"
                          >
                            <Box flex="1" textAlign="left">
                              <Text>{q.question}</Text>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4} pt={2}>
                            <Text color="green.600" fontSize="md">
                              Explicación: {q.explanation}
                            </Text>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </Box>
                )}
              </VStack>
            )}
          </Box>
          <HStack
            justify="space-between"
            mt={6}
            pt={4}
            borderTop="1px"
            borderColor="gray.100"
          >
            {!showResults && (
              <Button
                colorScheme="gray"
                onClick={handlePrevious}
                isDisabled={currentQuestion === 0}
              >
                Anterior
              </Button>
            )}
            {showResults ? (
              <Button colorScheme="blue" onClick={handleRestart} w="100%">
                Reiniciar Test
              </Button>
            ) : (
              <Button
                colorScheme="blue"
                onClick={handleNext}
                isDisabled={!isAnswerComplete(currentQuestion)}
                ml={!showResults ? 0 : "auto"}
              >
                {currentQuestion === randomizedQuestions.length - 1
                  ? "Terminar"
                  : "Siguiente"}
              </Button>
            )}
          </HStack>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default Us;
