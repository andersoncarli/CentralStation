# Central Station Blog Application

This is a full-stack blog application built using the Central Station framework, demonstrating real-time client-server communication and modern web development practices.

## Features

- Real-time updates using WebSocket communication
- Server-side rendering with automatic internationalization (i18n)
- Dynamic theming (light/dark mode)
- User authentication with JWT tokens
- Blog post creation, viewing, and commenting
- Modular component system using web components
- CSS processing with Tailwind CSS
- Dynamic module loading
- Multi-language support with automatic translation
- Responsive design for various screen sizes

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/central-station-blog.git
   cd central-station-blog
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   JWT_SECRET=your_jwt_secret_here
   PORT=3000
   ```

### Running the Application

1. Start the server:
   ```
   npm run start:server
   ```

2. In a separate terminal, start the client:
   ```
   npm run start:client
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `src/server/`: Server-side code including the Central Station core
- `src/client/`: Client-side code including the Central Station client
- `blog/`: Blog-specific implementation
  - `components/`: Web components for the blog
  - `server/`: Blog server implementation
  - `client/`: Blog client implementation
- `locales/`: Translation files for different languages

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Central Station framework developers
- Contributors to the various open-source libraries used in this project