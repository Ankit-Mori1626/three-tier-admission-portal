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
                sh """
                    echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin
                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker push ${BACKEND_IMAGE}:latest
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker push ${FRONTEND_IMAGE}:latest
                """
            }
        }

        stage("Deploy to Kubernetes") {
            steps {
                withKubeConfig([credentialsId: 'k8s-kubeconfig']) {
                    sh """
                        kubectl apply -f k8s/
                        kubectl set image deployment/backend backend=${BACKEND_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}
                        kubectl set image deployment/frontend frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}
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
