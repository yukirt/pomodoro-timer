# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server on port 3000 (configured in vite.config.ts)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build

### Testing and Quality
- `npm test` - Run all tests (Vitest)
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - ESLint with TypeScript rules

## Architecture Overview

This is a **Pomodoro Timer application** built with React 18 + TypeScript using a modular, component-based architecture with clear separation of concerns.

### Core Architecture Pattern
The application follows a **Manager Pattern** with event-driven architecture:
- **Controllers/Managers**: Handle business logic and state management
- **Components**: Pure UI components that react to state changes
- **Event System**: Subscription-based communication between layers

### Key Core Modules

**TimerController** (`src/core/timer/TimerController.ts`):
- Central timer state management with event subscription system
- Supports work/shortBreak/longBreak modes
- Event types: 'tick', 'start', 'pause', 'reset', 'modeChange', 'complete'

**SettingsManager** (`src/core/settings/SettingsManager.ts`):
- Singleton pattern for application settings
- localStorage persistence with validation
- Default settings: 25min work, 5min short break, 15min long break

**SessionManager** (`src/core/stats/SessionManager.ts`):
- Tracks completed pomodoro sessions
- Provides statistics and historical data

**TaskManager** (`src/core/task/TaskManager.ts`):
- Task CRUD operations with pomodoro integration
- Event-driven task lifecycle management

### Component Structure
- **Responsive Layout**: Desktop sidebar + mobile modal overlay patterns
- **Theme System**: Context-based themes that change with timer modes (work=red, break=green/blue)
- **Performance Optimized**: Extensive use of React.memo, useMemo, useCallback

### Storage Strategy
- **localStorage** for all data persistence (settings, sessions, tasks)
- **Optimized storage utilities** in `src/utils/` for performance monitoring
- **Error handling** with fallbacks for storage failures

### Testing Setup
- **Vitest** with jsdom environment
- **Testing Library** for component testing
- **Comprehensive test coverage** including unit, integration, and e2e tests
- Test setup file: `src/test/setup.ts`

### Notable Technical Details
- **TypeScript strict mode** enabled with comprehensive type definitions
- **Event-driven architecture** with subscription/unsubscription patterns
- **Performance monitoring** integrated throughout with `performanceMonitor` utility
- **Chinese UI** (Traditional Chinese) - main interface language
- **Auto-switching logic** between work/break modes with cycle tracking