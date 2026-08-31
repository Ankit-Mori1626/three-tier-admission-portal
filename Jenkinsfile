pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-cred')
        DOCKERHUB_USERNAME = "ankitmori1626"
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/three-tier-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/three-tier-frontend"
        IMAGE_TAG = "${env.BUILD_ID}"
        K8S_NAMESPACE = "three-tier-app"
    }

    stages {
        stage("Checkout") {
            steps {
                checkout scm
            }
        }

        stage("Build Backend") {
            steps {
                sh """
                    docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} backend/
                    docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest
                """
            }
        }

        stage("Build Frontend") {
            steps {
                sh """
                    docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} frontend/
                    docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest
                """
            }
        }

        stage("Push to Dockerhub") {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }

        stage("Deploy to Kubernetes") {
            steps {
                withKubeConfig([credentialsId: 'k8s-kubeconfig']) {
                    sh """
                        # 1. Pehle namespace create/ensure karein
                        kubectl apply -f k8s/namespace.yml

                        # 2. Ab baki saare resources deploy karein
                        kubectl apply -f k8s/

                        # 3. Rolling update with new build image tags
                        kubectl set image deployment/backend backend=${BACKEND_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}
                        kubectl set image deployment/frontend frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}

                        # 4. Rollout status verify karein
                        kubectl rollout status deployment/backend -n ${K8S_NAMESPACE}
                        kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        always {
            sh "docker logout"
        }
    }
}
