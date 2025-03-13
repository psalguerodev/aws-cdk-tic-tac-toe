import {
  AddIcon,
  CheckIcon,
  CopyIcon,
  DeleteIcon,
  EditIcon,
  ExternalLinkIcon,
  LinkIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const API_URL = "https://8lrj00xq0j.execute-api.us-east-1.amazonaws.com/prod";

interface Link {
  id: string;
  name: string;
  url: string;
  createdAt: number;
}

interface LinksResponse {
  links: Link[];
  lastEvaluatedKey: string | null;
  count: number;
}

const ITEMS_PER_PAGE = 12;
const MAX_PATH_LENGTH = 40;

const MotionHStack = motion(HStack);

const Links = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchRef = useRef(false);

  // Focus inicial al cargar la página
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cargar enlaces desde la API al iniciar
  const fetchLinks = async (nextKey?: string) => {
    try {
      setIsLoading(true);
      const url = new URL(`${API_URL}/links`);
      url.searchParams.append("limit", ITEMS_PER_PAGE.toString());
      if (nextKey) {
        url.searchParams.append("lastKey", nextKey);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Error al obtener los enlaces");

      const data: LinksResponse = await response.json();

      if (nextKey) {
        setLinks((prev) => [...prev, ...data.links]);
      } else {
        setLinks(data.links);
      }

      setLastEvaluatedKey(data.lastEvaluatedKey);
      setHasMore(!!data.lastEvaluatedKey);
    } catch (error) {
      console.error("Error al cargar los enlaces:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los enlaces",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const loadMore = () => {
    if (lastEvaluatedKey && !isLoading) {
      fetchLinks(lastEvaluatedKey);
    }
  };

  useEffect(() => {
    if (!fetchRef.current) {
      fetchRef.current = true;
      fetchLinks();
    }
  }, []);

  const getPathFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      if (path === "/") return "";
      return path.length > MAX_PATH_LENGTH
        ? path.substring(0, MAX_PATH_LENGTH) + "..."
        : path;
    } catch {
      return "";
    }
  };

  const isUrlDuplicate = (url: string, excludeId?: string) => {
    const normalizedUrl = url.replace(/\/$/, "");
    return links.some(
      (link) =>
        link.url.replace(/\/$/, "") === normalizedUrl && link.id !== excludeId
    );
  };

  const handleAddLink = async () => {
    if (!newUrl.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL",
        status: "error",
        duration: 3000,
      });
      return;
    }

    let url = newUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      new URL(url);
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor ingresa una URL válida",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (isUrlDuplicate(url)) {
      toast({
        title: "URL duplicada",
        description: "Este enlace ya existe en tu lista",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const newLink: Link = {
      id: Date.now().toString(),
      name: new URL(url).hostname.replace("www.", ""),
      url: url,
      createdAt: Date.now(),
    };

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([newLink]),
      });

      if (!response.ok) throw new Error("Error al guardar el enlace");

      // Recargar la primera página para mantener el orden correcto
      fetchLinks();
      setNewUrl("");
      inputRef.current?.focus();

      toast({
        title: "¡Enlace guardado!",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error al guardar el enlace:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el enlace",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddLink();
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/links/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar el enlace");

      // En lugar de recargar, eliminamos el enlace del estado local
      setLinks((prevLinks) => prevLinks.filter((link) => link.id !== id));

      toast({
        title: "Enlace eliminado",
        status: "info",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error al eliminar el enlace:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el enlace",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    onOpen();
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;

    try {
      new URL(editingLink.url);
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor ingresa una URL válida",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (isUrlDuplicate(editingLink.url, editingLink.id)) {
      toast({
        title: "URL duplicada",
        description: "Este enlace ya existe en tu lista",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/links/${editingLink.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: editingLink.url.trim(),
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar el enlace");

      // En lugar de recargar, actualizamos el enlace en el estado local
      setLinks((prevLinks) =>
        prevLinks.map((link) =>
          link.id === editingLink.id
            ? {
                ...link,
                url: editingLink.url.trim(),
                name: new URL(editingLink.url.trim()).hostname.replace(
                  "www.",
                  ""
                ),
              }
            : link
        )
      );

      onClose();
      inputRef.current?.focus();
      toast({
        title: "Enlace actualizado",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error al actualizar el enlace:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el enlace",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "¡Enlace copiado!",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el enlace",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Flex w="100vw" minH="100vh" align="center" justify="center" p={4}>
      <Card
        maxW={{ base: "90%", md: "500px" }}
        w="100%"
        mx="auto"
        boxShadow="xl"
        h={{ base: "85vh", md: "600px" }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <CardHeader
          py={4}
          flex="0 0 auto"
          borderBottom="1px"
          borderColor="gray.100"
        >
          <VStack spacing={4} align="stretch">
            <HStack justify="center" spacing={2}>
              <Heading size="md" textAlign="center" color="gray.700">
                Mis Enlaces Favoritos
              </Heading>
            </HStack>
            <HStack spacing={2}>
              <Input
                ref={inputRef}
                placeholder="Ingresa una URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                size="md"
                isDisabled={isLoading}
                autoFocus
              />
              <IconButton
                icon={isLoading ? <Spinner size="sm" /> : <AddIcon />}
                onClick={handleAddLink}
                colorScheme="blue"
                aria-label="Agregar enlace"
                size="md"
                isLoading={isLoading}
              />
            </HStack>
          </VStack>
        </CardHeader>

        <CardBody
          flex="1 1 auto"
          overflowY="auto"
          px={2}
          css={{
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--chakra-colors-gray-200)",
              borderRadius: "24px",
            },
          }}
        >
          <VStack spacing={1} align="stretch">
            <AnimatePresence mode="wait" initial={false}>
              {isLoading && links.length === 0 ? (
                <Flex justify="center" align="center" h="100px">
                  <Spinner size="xl" color="blue.500" />
                </Flex>
              ) : links.length === 0 ? (
                <Text textAlign="center" color="gray.500" fontSize="sm">
                  No hay enlaces guardados
                </Text>
              ) : (
                <>
                  {links.map((link) => (
                    <MotionHStack
                      key={link.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                        mass: 0.8,
                      }}
                      layout
                      p={2}
                      borderRadius="md"
                      _hover={{ bg: "gray.50" }}
                      justify="space-between"
                    >
                      <HStack spacing={3} flex={1} minW={0}>
                        <LinkIcon color="gray.400" flexShrink={0} />
                        <Box minW={0}>
                          <Text fontSize="sm" fontWeight="medium" isTruncated>
                            {link.name}
                          </Text>
                          {getPathFromUrl(link.url) && (
                            <Text fontSize="xs" color="gray.500" isTruncated>
                              {getPathFromUrl(link.url)}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                      <HStack spacing={1} flexShrink={0}>
                        <Tooltip label="Copiar enlace" placement="top">
                          <IconButton
                            icon={
                              copiedId === link.id ? (
                                <CheckIcon />
                              ) : (
                                <CopyIcon />
                              )
                            }
                            aria-label="Copiar enlace"
                            size="xs"
                            variant="ghost"
                            color={
                              copiedId === link.id ? "green.500" : undefined
                            }
                            onClick={() => handleCopyLink(link.url, link.id)}
                          />
                        </Tooltip>
                        <Tooltip label="Abrir enlace" placement="top">
                          <IconButton
                            icon={<ExternalLinkIcon />}
                            aria-label="Abrir enlace"
                            size="xs"
                            variant="ghost"
                            onClick={() => window.open(link.url, "_blank")}
                          />
                        </Tooltip>
                        <Tooltip label="Editar" placement="top">
                          <IconButton
                            icon={<EditIcon />}
                            aria-label="Editar enlace"
                            size="xs"
                            variant="ghost"
                            onClick={() => handleEditLink(link)}
                            isDisabled={isLoading}
                          />
                        </Tooltip>
                        <Tooltip label="Eliminar" placement="top">
                          <IconButton
                            icon={<DeleteIcon />}
                            aria-label="Eliminar enlace"
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteLink(link.id)}
                            isDisabled={isLoading}
                          />
                        </Tooltip>
                      </HStack>
                    </MotionHStack>
                  ))}
                  {hasMore && (
                    <Button
                      onClick={loadMore}
                      isLoading={isLoading}
                      variant="ghost"
                      size="sm"
                      my={2}
                    >
                      Cargar más enlaces
                    </Button>
                  )}
                </>
              )}
            </AnimatePresence>
          </VStack>
        </CardBody>
      </Card>

      {/* Modal de edición */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          inputRef.current?.focus();
        }}
        size="sm"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md">Editar Enlace</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="URL del enlace"
                value={editingLink?.url || ""}
                onChange={(e) =>
                  setEditingLink(
                    editingLink ? { ...editingLink, url: e.target.value } : null
                  )
                }
                isDisabled={isLoading}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              size="sm"
              onClick={onClose}
              isDisabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveEdit}
              size="sm"
              isLoading={isLoading}
            >
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Links;
