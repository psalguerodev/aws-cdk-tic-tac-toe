import { ChakraProvider, Container } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <Router>
          <Container maxW="100vw" p={0} centerContent>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </Container>
        </Router>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;
