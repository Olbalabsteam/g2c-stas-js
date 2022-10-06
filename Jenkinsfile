
pipeline {
    agent any

    stages {
        stage('Install Dependencies') {
            steps {
                echo 'Installing Dependencies..'
                sh 'npm install'
            }
        }
        stage('Unit Tests') {
            steps {
                echo 'Unit Test'
                sh 'API_USERNAME=taal_private API_PASSWORD=dotheT@@l007 npm run test contractUnit'
                allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
            }
        }
          stage('Functional Tests') {
            steps {
                echo 'Functional Tests'
                sh 'API_USERNAME=taal_private API_PASSWORD=dotheT@@l007 npm run test'
                allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
            }
        }
    }
    post {
            always {
                    cleanWs()
                }

        }
}