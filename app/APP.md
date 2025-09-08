# Application Overview

This document provides a summary of the files in the `/app` directory of the think-alike-web project.

## Files

### `page.tsx`

This is the main entry point for the Next.js application. Its primary role is to render the core `<App />` component. It wraps the `App` component with a `<GameProvider>`, which suggests that it provides a global context or state management for the game's data throughout the component tree.

### `layout.tsx`

This file defines the root HTML layout for all pages in the application. It sets up the basic HTML structure (`<html>`, `<body>`), includes the global stylesheet (`globals.css`), configures the "Inter" font, and sets important metadata for the application such as the title ("Think Alike") and favicon. It also integrates Vercel Analytics.

### `globals.css`

This file contains the global styles for the application. It leverages Tailwind CSS by importing its base styles. It defines a comprehensive set of CSS custom properties (variables) for theming, supporting both light and dark modes. These variables control colors for background, text, cards, and other UI elements. It also includes base styles and custom component classes.

### `local_config.json`

This is a configuration file used for local development. It specifies the connection details for the backend services.

-   `API_BASE`: The base URL for the REST API (`http://localhost:8000/api/v1`).
-   `WS_URL`: The URL for the WebSocket server (`http://localhost:8000`).
-   `ENDPOINTS`: A detailed map of all the REST API endpoints, including the HTTP method and path for each action (e.g., creating players, joining rooms, getting game stats).

### `heroku_config.json`

This is the configuration file for the production environment hosted on Heroku. It has the same structure as `local_config.json` but the URLs point to the live Heroku application (`https://think-alike-fcb3d08077fe.herokuapp.com`). This allows the frontend to communicate with the correct backend services when deployed.
