# Microservices Example with Node.js and RabbitMQ

This project demonstrates a simple microservices architecture using Node.js and RabbitMQ. The architecture includes a User Service that registers users and an Order Service that processes orders.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)

## Prerequisites

- Docker: Ensure you have Docker installed on your machine. You can download it from [Docker's official site](https://www.docker.com/get-started).
- Docker Compose: This usually comes with Docker Desktop installations, but you can also install it separately. Check [Docker Compose installation instructions](https://docs.docker.com/compose/install/) if needed.

### Instructions for Use

- **Replace `<repository-url>`** and `<repository-directory>` with the actual repository URL and directory name if applicable.
- Save this content in a file named `README.md` in your project directory.

This `README.md` provides a comprehensive guide for setting up, running, and interacting with your microservices application using Node.js and RabbitMQ. If you need further modifications or additional sections, feel free to ask!

## Getting Started

1.  **Clone the Repository**

    Clone the repository to your local machine:

    ```
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Build and Run the Containers**

    ```
    docker-compose up --build
    ```

3.  **Curl Examples**

    Create a user:

    ```
    curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{"username": "john_doe", "email": "john@example.com"}'
    ```

    Place an order:

    ```
    curl -X POST http://localhost:3001/order \
    -H "Content-Type: application/json" \
    -d '{"userId": 1, "items": [{"product": "Widget", "quantity": 2}, {"product": "Gadget", "quantity": 1}]}'
    ```

    Post an inventory item

    ```
    curl -X POST http://localhost:3002/inventory \
     -H "Content-Type: application/json" \
     -d '{"productName": "Widget", "quantity": 100}'
    ```

    Post a shipment item

    ```
    curl -X POST http://localhost:3003/shipment \
     -H "Content-Type: application/json" \
     -d '{"order_id": 1, "shipping_address": "123 Shipping Lane"}'
    ```

    Get inventory status:

    ```
    curl -X GET http://localhost:3002/inventory
    ```

    Get all shipments:

    ```
    curl -X GET http://localhost:3003/shipments
    ```
