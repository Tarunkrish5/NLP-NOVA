# NEURAL SPARK | Design Architecture

This document tracks the visual identity and implementation details of the **Neural Spark** redesign.

## 🎨 Visual Identity
The redesign is based on an "Energy Topology" concept:
- **Core Color Palette**:
  - `CRIMSON RED (#ff3e3e)`: Represents motor signaling and high-priority gestures.
  - `ELECTRIC BLUE (#00d2ff)`: Represents baseline neural activity and UI feedback.
  - `CYBER BLUE (#00f2ff)`: HUD highlights.
- **Atmosphere**: Deep space black background with a digital scanline overlay and dynamic grid pulse.

## 🚀 Technical Implementation
- **Visualizer**: Custom Three.js particle engine with 3,000 dual-layered points (Base + Bloom).
- **Arcs**: High-frequency jittering using mid-point buffer updates for electrical arcs.
- **Communication**: Full-duplex WebSocket bridge between Mediapipe (Python) and the Frontend (JS) for 0ms lag perception.

---
*Design goal: Pixel-perfect replication of energy tendrils and spherical density.*
