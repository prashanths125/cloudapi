# Cloud API (AWS Integrated) - Demo (Default VPC Auto Pick)

This project is an **event-driven Cloud API architecture demo** using:

- GraphQL Gateway (Apollo Server)
- RabbitMQ (Event Bus)
- Orders Service (AWS Provisioning Worker)
- AWS SDK v3 (EC2 integration)
- Docker Compose (local setup)

---

## Key Feature

If you do NOT provide:

- `AWS_SECURITY_GROUP_ID`
- `AWS_SUBNET_ID`

The system will automatically select:

- Default VPC
- Default Subnet
- Default Security Group

---

## Architecture Flow

GraphQL Mutation -> RabbitMQ Queue -> Orders Service -> AWS Provisioning

Example:

- `createOrder(service: "ec2")` -> provisions an EC2 instance

---

## Prerequisites

- Docker + Docker Compose installed
- AWS Account + IAM User Access Keys
- Valid AMI ID for your region (for EC2 provisioning)

---

## Setup

### 1) Create `.env` file

Edit `.env`:

```env
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=ap-south-1
AWS_AMI_ID=ami-0dffgxxxxxxxxxx   # Pick AMI ID from your region

AWS_KEY_NAME=my-keypair         # Update key-pair
AWS_INSTANCE_TYPE=t3.micro
AWS_INSTANCE_NAME=EC2-demo
```

---

## Run Locally

```bash
docker-compose up --build
```

---

## Services

| Service | URL |
|--------|-----|
| GraphQL Gateway | http://localhost:4000 |
| RabbitMQ UI | http://localhost:15672 |

RabbitMQ credentials:
- user: `guest`
- password: `guest`

---

## Test GraphQL

Open:

http://localhost:4000

### Health Check

```graphql
query {
  health
}
```

### Provision EC2 Instance (default VPC auto selected)

```graphql
mutation {
  createOrder(service: "ec2")
}
```

---

## Verify Event Flow (Logs)

### Gateway logs

```bash
docker-compose logs -f gateway
```

### Orders service logs

```bash
docker-compose logs -f orders-service
```

Expected output:

- Default VPC resources selected
- EC2 provisioning started
- Instance created successfully

---

## Verify in AWS Console

AWS Console -> EC2 -> Instances

---

## Stop Services

```bash
docker-compose down
```

---

## Notes / Security

- Do NOT commit `.env` file
- Default security group may not allow SSH inbound
- For production use IAM roles instead of access keys

---
