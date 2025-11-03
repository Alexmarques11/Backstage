# Docker & Kubernetes Explained - For Backstage Project

This guide explains Docker and Kubernetes in the context of our Backstage project, using simple analogies and practical examples.

## 🏠 The Restaurant Analogy

Think of our Backstage application like a restaurant:

### Without Docker & Kubernetes (Traditional Way)
- **Problem**: You rent a big building and manually set up everything
- You need to install the kitchen equipment, hire staff, manage everything yourself
- If something breaks, the whole restaurant stops
- Hard to expand or move to a new location

### With Docker & Kubernetes (Our Way)
- **Docker**: Like having pre-built, portable kitchen units
- **Kubernetes**: Like having a smart restaurant manager
- Everything is organized, scalable, and easy to manage

---

##  What is Docker?

**Docker = Portable Containers for Your Code**

### Real Example from Our Project

**Without Docker (the old way):**
```bash
# On your computer, you'd need to:
1. Install Node.js version 18
2. Install PostgreSQL database
3. Install all npm packages
4. Set up environment variables
5. Pray it works the same on the server
```

**With Docker (our way):**
```bash
# Everything is packaged in a container
docker run backstage-server
#  Works exactly the same everywhere!
```

### How We Use Docker in Backstage

**Our Backend has 2 Docker containers:**

1. **Server Container** (`backend/Dockerfile.server`)
   ```dockerfile
   FROM node:18-alpine          # Start with Node.js environment
   WORKDIR /app                 # Create app folder
   COPY package*.json ./        # Copy package files
   RUN npm ci --only=production # Install dependencies
   COPY . .                     # Copy our code
   EXPOSE 3000                  # Open port 3000
   CMD ["node", "server.js"]    # Start the server
   ```

2. **Auth Container** (`backend/Dockerfile.auth`)
   ```dockerfile
   FROM node:18-alpine          # Start with Node.js environment
   WORKDIR /app                 # Create app folder
   COPY package*.json ./        # Copy package files
   RUN npm ci --only=production # Install dependencies
   COPY . .                     # Copy our code
   EXPOSE 4000                  # Open port 4000
   CMD ["node", "authserver.js"] # Start the auth server
   ```

### Docker Analogy: Shipping Containers

**Think of Docker like shipping containers:**
- **Container**: Your code + everything it needs to run
- **Portable**: Runs the same on your laptop, server, or cloud
- **Isolated**: Won't interfere with other applications
- **Efficient**: Share resources but stay separate

```
┌─────────────────┐  ┌─────────────────┐
│  Server App     │  │  Auth App       │
│ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │ Node.js     │ │  │ │ Node.js     │ │
│ │ Our Code    │ │  │ │ Our Code    │ │
│ │ Dependencies│ │  │ │ Dependencies│ │
│ └─────────────┘ │  │ └─────────────┘ │
│   Port 3000     │  │   Port 4000     │
└─────────────────┘  └─────────────────┘
   Docker Container    Docker Container
```

---

##  What is Kubernetes?

**Kubernetes = Smart Management System for Docker Containers**

### Restaurant Manager Analogy

**Kubernetes is like a super-smart restaurant manager who:**
- **Schedules**: Decides which chef works when
- **Monitors**: Watches if chefs are sick and replaces them
- **Scales**: Hires more chefs during busy times
- **Routes**: Directs customers to the right table
- **Balances**: Makes sure no chef is overworked

### How We Use Kubernetes in Backstage

**Our Kubernetes setup manages:**

1. **Pods** (Groups of Containers)
   ```yaml
   # Our server pod runs the main API
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: backstage-server
   spec:
     replicas: 1                    # Run 1 copy normally
     selector:
       matchLabels:
         app: backstage-server
     template:
       spec:
         containers:
         - name: backstage-server
           image: backstage-server:latest
           ports:
           - containerPort: 3000
   ```

2. **Services** (Internal Networking)
   ```yaml
   # How pods talk to each other
   apiVersion: v1
   kind: Service
   metadata:
     name: backstage-server-service
   spec:
     selector:
       app: backstage-server
     ports:
     - port: 80
       targetPort: 3000
   ```

3. **Auto-scaling** (Smart Resource Management)
   ```yaml
   # Automatically create more pods when busy
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: backstage-server-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: backstage-server
     minReplicas: 1               # Minimum 1 pod
     maxReplicas: 3               # Maximum 3 pods
     targetCPUUtilizationPercentage: 70  # Scale up at 70% CPU
   ```

### Kubernetes Architecture in Our Project

```
┌─────────────────────────────────────────────────────────┐
│                 London Kubernetes Cluster               │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │   Server Pod    │    │   Auth Pod      │            │
│  │  ┌───────────┐  │    │  ┌───────────┐  │            │
│  │  │ Container │  │    │  │ Container │  │            │
│  │  │Port: 3000 │  │    │  │Port: 4000 │  │            │
│  │  └───────────┘  │    │  └───────────┘  │            │
│  └─────────────────┘    └─────────────────┘            │
│           │                       │                    │
│  ┌─────────────────────────────────────────┐           │
│  │         Internal Network                │           │
│  │   (Pods can talk to each other)         │           │
│  └─────────────────────────────────────────┘           │
│           │                                            │
│  ┌─────────────────────────────────────────┐           │
│  │        External Access                  │           │
│  │  NodePort: 30001 → Server               │           │
│  │  NodePort: 30002 → Auth                 │           │
│  └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────────────┐
                │    Internet     │
                │ Your Android    │
                │    App          │
                └─────────────────┘
```

---

##  Why We Use Docker & Kubernetes

### Problems Before Docker & Kubernetes

**"It works on my machine" syndrome:**
```
Developer: "The app works fine on my laptop!"
Server: "Error: Node.js version mismatch"
Developer: "But it worked yesterday..."
```

**Manual scaling:**
```
Users: "The app is slow!"
Admin: *manually starts more servers*
Admin: *forgets to turn them off*
Money: *disappears into the cloud*
```

### Benefits With Docker & Kubernetes

** Consistency:**
```bash
# Same environment everywhere
Developer laptop:  Works
Test server:  Works  
Production:  Works
```

** Auto-scaling:**
```bash
# Kubernetes watches and scales automatically
Normal traffic: 1 pod running
High traffic: 3 pods running
Low traffic: Back to 1 pod
```

** Self-healing:**
```bash
# If something crashes, Kubernetes restarts it
Pod crashes → Kubernetes detects → Starts new pod → Service continues
```

** Easy updates:**
```bash
# Rolling updates with zero downtime
./london-deploy.sh update
# Kubernetes gradually replaces old pods with new ones
```

---

##  Real Examples from Our Backstage Project

### 1. Building Our Docker Images

**What this does:**
```bash
# Build the server container
docker build -t backstage-server -f backend/Dockerfile.server backend/

# Build the auth container  
docker build -t backstage-auth -f backend/Dockerfile.auth backend/
```

**Translation:**
- Take our Node.js code
- Package it with Node.js runtime
- Create a portable container
- Tag it with a name so we can use it

### 2. Deploying to Kubernetes

**What this does:**
```bash
# Deploy our containers to Kubernetes
kubectl apply -f k8s/digitalocean/04-server-deployment.yaml
kubectl apply -f k8s/digitalocean/05-auth-deployment.yaml
```

**Translation:**
- Tell Kubernetes: "Run our server container"
- Tell Kubernetes: "Run our auth container"  
- Kubernetes finds space and starts them
- Sets up networking so they can talk to each other

### 3. Scaling When Busy

**What happens automatically:**
```bash
# When CPU usage goes above 70%
Kubernetes: "Traffic is high, starting more pods..."

# Current state
kubectl get pods -n backstage
NAME                               READY   STATUS    RESTARTS   AGE
backstage-server-abc123           1/1     Running   0          1m
backstage-server-def456           1/1     Running   0          30s
backstage-server-ghi789           1/1     Running   0          10s
```

**Translation:**
- Kubernetes monitors CPU usage
- When busy, it starts more copies of our app
- When calm, it stops extra copies
- We only pay for what we need

### 4. Updating Our Application

**What this does:**
```bash
./london-deploy.sh update
```

**Behind the scenes:**
1. Build new Docker images with updated code
2. Push images to registry
3. Tell Kubernetes to use new images
4. Kubernetes gradually replaces old pods with new ones
5. Zero downtime - users never notice the update

---

##  Our Project Structure Explained

### File Organization
```
backstage/
├── backend/                     # Our application code
│   ├── server.js               # Main API code
│   ├── authserver.js           # Auth API code
│   ├── Dockerfile.server       # How to build server container
│   └── Dockerfile.auth         # How to build auth container
├── k8s/digitalocean/           # Kubernetes instructions
│   ├── 04-server-deployment.yaml   # "Run server container"
│   ├── 05-auth-deployment.yaml     # "Run auth container"
│   ├── 06-services-nodeport.yaml   # "Make it accessible from internet"
│   └── 07-hpa.yaml                 # "Auto-scale when busy"
└── london-deploy.sh            # Script that does everything
```

### What Each File Does

**Dockerfile.server** (Build Instructions):
```dockerfile
FROM node:18-alpine     # Start with Node.js
WORKDIR /app           # Create workspace
COPY package*.json ./  # Copy dependency list
RUN npm install        # Install dependencies
COPY . .              # Copy our code
EXPOSE 3000           # Open port 3000
CMD ["node", "server.js"]  # Start our app
```
*Translation: "Here's how to build a container with our server code"*

**04-server-deployment.yaml** (Run Instructions):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backstage-server
spec:
  replicas: 1          # Run 1 copy
  template:
    spec:
      containers:
      - name: backstage-server
        image: backstage-server:latest  # Use our container
        ports:
        - containerPort: 3000
```
*Translation: "Kubernetes, please run our server container"*

**07-hpa.yaml** (Scaling Instructions):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backstage-server-hpa
spec:
  minReplicas: 1       # At least 1 copy
  maxReplicas: 3       # At most 3 copies
  targetCPUUtilizationPercentage: 70  # Scale up at 70% CPU
```
*Translation: "Kubernetes, automatically create more copies when busy"*

---

##  Key Concepts Summary

### Docker Concepts

| Term | What It Is | Example |
|------|------------|---------|
| **Container** | Package with code + dependencies | Our server app + Node.js |
| **Image** | Template for creating containers | `backstage-server:latest` |
| **Dockerfile** | Instructions to build an image | Recipe to build our app |
| **Registry** | Storage for images | DigitalOcean Container Registry |

### Kubernetes Concepts

| Term | What It Is | Example |
|------|------------|---------|
| **Pod** | Group of containers that work together | Our server container |
| **Deployment** | Instructions to run pods | "Run 1 copy of server" |
| **Service** | Network access to pods | Internal communication |
| **HPA** | Auto-scaling rules | "Scale up when busy" |
| **Namespace** | Isolated area for our app | `backstage` namespace |

---

##  Common Commands Explained

### Docker Commands
```bash
# Build our server container
docker build -t backstage-server -f backend/Dockerfile.server backend/
# Translation: Build a container called "backstage-server" using the recipe in Dockerfile.server

# Run container locally for testing
docker run -p 3000:3000 backstage-server
# Translation: Start our container and make port 3000 accessible

# Push to registry so Kubernetes can use it
docker push registry.digitalocean.com/backstage-registry/backstage-server:latest
# Translation: Upload our container to the cloud storage
```

### Kubernetes Commands
```bash
# Deploy our application
kubectl apply -f k8s/digitalocean/
# Translation: Tell Kubernetes to run everything in our config files

# Check if our app is running
kubectl get pods -n backstage
# Translation: Show me all running containers in our backstage area

# Check resource usage
kubectl top pods -n backstage
# Translation: Show me how much CPU/memory our app is using

# Scale manually
kubectl scale deployment backstage-server --replicas=2 -n backstage
# Translation: Run 2 copies of our server instead of 1
```

### Our Deployment Script
```bash
./london-deploy.sh update
# Translation: Build new containers, push to registry, tell Kubernetes to use them

./london-deploy.sh status  
# Translation: Show me the current state of our application

./london-deploy.sh test
# Translation: Check if our app is working correctly
```

---

##  Troubleshooting Guide

### When Something Goes Wrong

**"My changes aren't showing up"**
```bash
# 1. Check if new container was built
docker images | grep backstage-server

# 2. Check if Kubernetes is using new image
kubectl describe pod -n backstage | grep Image

# 3. Force Kubernetes to use new image
kubectl rollout restart deployment/backstage-server -n backstage
```

**"The app is not accessible"**
```bash
# 1. Check if pods are running
kubectl get pods -n backstage

# 2. Check if services are working
kubectl get services -n backstage

# 3. Check external access
kubectl get nodes -o wide
# Use the external IP with ports 30001/30002
```

**"The app is slow"**
```bash
# 1. Check resource usage
kubectl top pods -n backstage

# 2. Check auto-scaling
kubectl get hpa -n backstage

# 3. Manually scale up
kubectl scale deployment backstage-server --replicas=2 -n backstage
```

---

##  Learning Path

### For Your Friend (Docker & Kubernetes Beginner)

**Start Here:**
1. **Understand the concepts** (this document)
2. **Look at our files**: Check `backend/Dockerfile.server` and `k8s/digitalocean/`
3. **Try local Docker**: `docker build` and `docker run` commands
4. **Watch Kubernetes in action**: `kubectl get pods -n backstage`
5. **Make a small change**: Update code, build, deploy

**Practice Commands:**
```bash
# Safe commands to try (won't break anything)
kubectl get pods -n backstage
kubectl get services -n backstage
kubectl describe pod <pod-name> -n backstage
kubectl logs deployment/backstage-server -n backstage
kubectl top pods -n backstage
```

**Next Steps:**
- Read our Complete Guide for more details
- Try making code changes and deploying them
- Experiment with scaling up/down
- Learn about monitoring and troubleshooting

---

##  Why This Matters for Android Development

**For the Android app you're building:**

1. **Reliable Backend**: Docker ensures the APIs work consistently
2. **Scalable**: Kubernetes handles traffic spikes from your app
3. **Always Available**: Auto-healing means minimal downtime
4. **Easy Updates**: Backend can be updated without breaking your app
5. **Real URLs**: Your Android app connects to real production endpoints

**Your Android app will connect to:**
- `http://159.65.95.83:30001` (User management API)
- `http://159.65.95.83:30002` (Authentication API)

These are powered by Docker containers managed by Kubernetes! 

---

**Need help?** Check the [Complete Guide](COMPLETE_GUIDE.md) or [Quick Reference](QUICK_REFERENCE.md) for more details about our specific setup.