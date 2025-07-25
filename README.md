# Superpowers

<p align="center">
  <img src="public/superpowers.svg" alt="Superpowers Logo" width="120">
</p>
Superpowers is a free, open-source Chrome extension that puts you in control of your AI interactions. Your keys, your data, your browser.

## Why Superpowers?
- **Chrome-native experience**: Get powerful AI features without leaving your **favorite browser**
- **Zero ecosystem lock-in**: Works with your existing tools and workflows
- **Open & transparent**: Community-driven development with MIT licensing
- **Privacy-first**: Your data never leaves your local machine


## Installation

1. Download the `superpowers-x.y.z.zip` file from the latest [GitHub release](https://github.com/superhq-ai/superpowers/releases).
2. Unpack the downloaded zip file.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable "Developer mode" in the top right corner.
5. Click "Load unpacked" and select the unpacked extension directory.

## Setup

### Option 1: Local AI with Ollama (Recommended for Privacy)

1. **Install Ollama**: Download and install [Ollama](https://ollama.ai/)
2. **Start Ollama**: Run `ollama serve` in your terminal
3. **Download a Model**: Run `ollama pull llama3.2` (or any other model)
4. **Configure Extension**:
   - Open the Superpowers sidebar
   - Go to Settings
   - Select "Ollama (Local)" as provider
   - Verify the URL is `http://localhost:11434`
   - Test the connection

### Option 2: Cloud AI with Gemini

1. **Get API Key**: Obtain API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Configure Settings**:
   - Open the Superpowers sidebar
   - Go to Settings
   - Select "Gemini" as provider
   - Enter your API key
   - Test the connection

## Usage

- Press `Cmd + Shift + U` (or `Ctrl + Shift + U` on Windows/Linux) to open the Superpowers sidebar.
- Alternatively, right-click on any page and select "Use Superpowers" from the context menu.

## Disclaimer

This is an alpha version of Superpowers. While we work to improve stability, we recommend using it with caution. The developers are not liable for any loss or damage.

## Contributing

Superpowers is an open-source project and we welcome contributions! Feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
