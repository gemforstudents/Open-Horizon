# HORIZON: OPEN ROADS 🏎️💨

An arcade 3D open-world mobile racing game inspired by the freedom, exploration, and driving thrill of Forza Horizon. Built with React, TypeScript, Three.js, and Tailwind CSS.

## Features

- **Open-World Map**: Scenic coastal highway, winding mountain hill climbs, dense pine forests, tunnels, dirt rally shortcuts, ocean lookout, and a vibrant Festival Hub.
- **3 Distinct Playable Vehicles**:
  - **Apex GT-V8**: Balanced sports coupe, high agility, responsive drift.
  - **Veloce Hyperion**: Ultra-fast V10 supercar, blistering acceleration and top-end speed.
  - **Terra Raider 4x4**: Rugged off-road trophy truck, long-travel suspension, supreme dirt grip.
- **Physics & Driving Mechanics**:
  - Speed-dependent steering, lateral grip curves, inertia, and aerodynamic drag.
  - Realistic counter-steering drift mechanics with drift combo score multiplier.
  - Dynamic suspension roll (body roll during cornering) and pitch (squat on acceleration, dive under braking).
  - Wheel rotation speed synced to chassis velocity and front wheel steering angles.
  - Tire smoke, dust trails, and contact grounding.
- **Activities & Progression**:
  - **Free Roam**: Pure exploration with discoverable scenic landmarks and XP boards.
  - **Speed Traps**: Radar flash speed zones recording your peak speed with credit rewards.
  - **Drift Zones**: Multiplier-based drift challenges rewarding continuous angles.
  - **2 Point-to-Point Festival Races**:
    - *Coastal Sprint* (Festival Hub to Ocean Lookout)
    - *Mountain Pass Rally* (Challenging elevation climb & gravel bends)
  - **AI Opponents**: Lightweight waypoint-navigating rival racers.
- **Garage & Customization**:
  - 3D interactive turntable vehicle showroom.
  - Custom factory paint colors (Championship Yellow, Horizon Blue, Sunset Orange, Stealth Black, British Racing Green, Pearl White, Crimson Red).
  - Performance telemetry (Top Speed, 0-100 km/h, Handling, Off-Road rating).
- **Audio Synthesizer (Zero External Dependencies)**:
  - Procedural Web Audio engine: RPM-modulated engine growl, gear shift drop, tire screech on drift, checkpoint chime, collision impact.
- **Mobile-First & Desktop Friendly**:
  - Touchscreen controls: Virtual analog steering wheel or left/right steering pads, responsive throttle/brake pedals, handbrake, camera toggle, and emergency car reset.
  - Desktop controls: Keyboard (WASD / Arrow Keys, Space for Handbrake, C for Camera, R for Car Reset, Esc for Pause).
  - PWA offline caching and installation support.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Building for Production

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Testing

Run unit tests covering physics calculation, vehicle definitions, progression saving, and checkpoint validation:

```bash
npm test
```

## License

MIT License. See [LICENSE](./LICENSE) for details.
