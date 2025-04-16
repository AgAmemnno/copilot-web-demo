# aiohttp Web Server

This project is a simple web server built using the `aiohttp` framework. It serves static files and handles HTTP requests through defined routes.

## Project Structure

```
aiohttp-web-server
├── app
│   ├── __init__.py
│   ├── main.py
│   ├── routes.py
│   └── handlers.py
├── static
│   ├── css
│   │   └── styles.css
│   ├── js
│   │   └── scripts.js
│   └── index.html
├── tests
│   ├── __init__.py
│   └── test_routes.py
├── requirements.txt
└── README.md
```

## Installation

To set up the project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd aiohttp-web-server
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

To run the web server, execute the following command:

```
python -m app.main
```

The server will start and listen for incoming requests. You can access the web application by navigating to `http://localhost:8080` in your web browser.

## Testing

To run the tests, use the following command:

```
pytest
```

This will execute the unit tests defined in the `tests/test_routes.py` file.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.