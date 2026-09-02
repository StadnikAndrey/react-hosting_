# React Interactive Product Configurator
An interactive web application for complex parametric product configuration, built with React with a focus on scalable architecture, predictable state management, and deep rendering optimization.

### Key Features
* **Complex Business Logic Engine:** Processing multi-level nested JSON structures supporting dynamic dependency chains between parameters, conditional validation, and real-time complex pricing calculations.

* **Rendering Performance Optimization:** Preventing redundant re-renders and UI freezes when modifying interconnected configuration nodes through a combination of local memoization (useMemo) and granular reactivity.

* **Reactive State Architecture (MobX):** Utilizing stores with reactive computed properties for efficient derivation of computed data and a predictable data flow.

* **Client-Side Session Persistence:** Integrating bidirectional state synchronization with LocalStorage, allowing users to save, restore, and modify custom configurations across sessions.

* **Cart Module & Data Serialization:** A robust cart management subsystem featuring on-the-fly price recalculation, interactive cart editing, and state structure serialization for backend order submission.

### Tech Stack
* **Core:** React, JavaScript (ES6+)
* **Build Tool:** Vite
* **State Management:** MobX (mobx, mobx-react-lite)
* **Routing:** React Router
* **Styling:** SCSS
