# Tic Tac Toe React

Un juego de Tic Tac Toe moderno implementado con React, TypeScript y Chakra UI. Incluye modo de juego contra la computadora con diferentes niveles de dificultad y efectos visuales atractivos.

## ✨ Características

- 🎮 Dos modos de juego:
  - Jugador vs Jugador
  - Jugador vs Computadora
- 🤖 Tres niveles de dificultad para el modo contra computadora:
  - Fácil: Movimientos aleatorios
  - Medio: 50% de probabilidad de movimiento óptimo
  - Difícil: Algoritmo Minimax con Alpha-Beta pruning
- 🎯 Interfaz moderna y responsive con Chakra UI
- 🎉 Efectos visuales atractivos:
  - Animación de confeti al ganar
  - Mensaje de victoria con efectos visuales
  - Transiciones suaves
- 💾 Persistencia de datos:
  - Guarda nombres de jugadores
  - Registro de victorias
  - Configuración del juego
- ⚡ Rendimiento optimizado con Alpha-Beta pruning

## 🛠️ Tecnologías

- React
- TypeScript
- Chakra UI
- React Confetti
- LocalStorage para persistencia

## 🚀 Instalación

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
```

2. Instala las dependencias:

```bash
cd <nombre-del-proyecto>
yarn install
```

3. Inicia el servidor de desarrollo:

```bash
yarn dev
```

## 🎮 Cómo Jugar

1. Al iniciar el juego, configura:

   - Nombres de los jugadores
   - Modo de juego (vs Jugador o vs Computadora)
   - Nivel de dificultad (si juegas contra la computadora)

2. El juego sigue las reglas clásicas del Tic Tac Toe:

   - Los jugadores alternan turnos
   - Gana quien complete una línea de tres símbolos
   - El juego termina en empate si no hay más movimientos disponibles

3. Características adicionales:
   - Botón para reiniciar la partida actual
   - Opción para reiniciar el juego completo
   - Contador de victorias para cada jugador

## 🤖 Algoritmo de la Computadora

El modo de juego contra la computadora utiliza diferentes estrategias según el nivel:

- **Fácil**: Movimientos completamente aleatorios
- **Medio**:
  - 50% de probabilidad de hacer un movimiento óptimo
  - 50% de probabilidad de hacer un movimiento aleatorio
- **Difícil**:
  - Utiliza el algoritmo Minimax con Alpha-Beta pruning
  - 20% de probabilidad de hacer un movimiento sub-óptimo para mayor diversión

## 📝 Licencia

MIT
