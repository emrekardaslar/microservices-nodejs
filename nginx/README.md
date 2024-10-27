# NGINX Configuration for Microservices

This directory contains the NGINX configuration files for routing requests to various microservices in your application. NGINX acts as a reverse proxy, handling requests and forwarding them to the appropriate service based on the URL path.

## Description

The NGINX setup is designed to streamline access to different microservices by using a common `/api/` prefix. This configuration allows clients to easily access user, order, inventory, and shipping services without needing to know the underlying service ports.

### Configuration Overview

- **Reverse Proxy**: NGINX listens on port 80 and forwards incoming requests to the corresponding microservice based on the URL path.
- **Rewrite Rules**: The configuration uses rewrite rules to strip the `/api/` prefix from the request URLs before forwarding them to the appropriate microservice.

## Example Access Endpoints

Here are some example endpoints you can access through the NGINX server:

1. **User Service**

   - **Get All Users**:

     - **Endpoint**: `GET http://localhost/api/users/`
     - **Curl Command**:

       ```bash
       curl -X GET http://localhost/api/users/
       ```

       ```

       ```

2. **Order Service**

   - **Get All Orders**:

     - **Endpoint**: `GET http://localhost/api/orders/`
     - **Curl Command**:
       ```bash
       curl -X GET http://localhost/api/orders/
       ```

3. **Inventory Service**

   - **Get All Inventory Items**:

     - **Endpoint**: `GET http://localhost/api/inventory/`
     - **Curl Command**:
       ```bash
       curl -X GET http://localhost/api/inventory/
       ```

4. **Shipping Service**

   - **Get All Shipments**:

     - **Endpoint**: `GET http://localhost/api/shipping/`
     - **Curl Command**:
       ```bash
       curl -X GET http://localhost/api/shipping/
       ```

## Usage

To run the NGINX server with this configuration, ensure you have Docker set up with the provided `docker-compose.yml` file. Use the following commands to build and start the services:

```bash
docker-compose up --build
```
